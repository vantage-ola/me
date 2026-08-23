/**
 * Scheduled Medium -> blog sync.
 *
 * Medium's RSS feed only ever exposes the 10 most recent posts, so the feed
 * cannot be treated as the source of truth. Imported posts are committed to the
 * repo as markdown and tracked in content/.medium-sync.json, which makes git the
 * persistence layer and means a post surviving past the 10-item window is not
 * lost.
 *
 * The sync is append-only: a post already listed in the manifest is never
 * rewritten, so hand edits to titles, tags and excerpts are safe.
 *
 * GET /api/sync-medium              commit any new posts
 * GET /api/sync-medium?dryRun=1     report what would happen, commit nothing
 *
 * Requires Authorization: Bearer $CRON_SECRET, which Vercel Cron sends
 * automatically once CRON_SECRET is set on the project.
 */

import { commitFiles, GitHubError, listDirectory, readTextFile } from './_github.ts'
import { parseFeed, renderPost, slugFor, uniqueSlug } from './_medium.ts'
import type { FeedItem, RenderedPost } from './_medium.ts'

const MANIFEST_PATH = 'content/.medium-sync.json'
const POSTS_DIRECTORY = 'content/posts'
const DEFAULT_FEED = 'https://iloveracing.medium.com/feed'
/** The feed never returns more than 10 items, so this only bounds commit size. */
const MAX_POSTS_PER_RUN = 10

interface ManifestEntry {
  slug: string
  title: string
  url: string
  importedAt: string
  /** Free-form provenance, e.g. for entries backfilled by hand. */
  note?: string
}

interface Manifest {
  version: number
  imported: Record<string, ManifestEntry>
}

const EMPTY_MANIFEST: Manifest = { version: 1, imported: {} }

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  })
}

/**
 * Timing-safe-ish comparison. Node's crypto.timingSafeEqual needs equal-length
 * buffers, so length is compared first and the result is folded to avoid an
 * early return on the first differing byte.
 */
function secretMatches(provided: string, expected: string): boolean {
  if (provided.length !== expected.length) return false
  let diff = 0
  for (let i = 0; i < provided.length; i += 1) {
    diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i)
  }
  return diff === 0
}

function parseManifest(raw: string | null): Manifest {
  if (!raw) return structuredClone(EMPTY_MANIFEST)
  try {
    const parsed = JSON.parse(raw) as Partial<Manifest>
    if (!parsed.imported || typeof parsed.imported !== 'object') return structuredClone(EMPTY_MANIFEST)
    return { version: parsed.version ?? 1, imported: parsed.imported }
  } catch {
    // A corrupt manifest must not cause a re-import of everything.
    throw new Error(`${MANIFEST_PATH} is not valid JSON; refusing to sync`)
  }
}

function commitMessage(posts: RenderedPost[]): string {
  const subject =
    posts.length === 1
      ? `content(posts): import "${posts[0].item.title}" from Medium`
      : `content(posts): import ${posts.length} posts from Medium`
  const body = posts.map((post) => `- ${post.slug} (${post.item.id})`).join('\n')
  return `${subject}\n\n${body}\n`
}

export async function GET(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET
  const token = process.env.GITHUB_TOKEN
  // Vercel populates the VERCEL_GIT_* system variables for git-connected
  // projects, so the repository does not normally need configuring by hand.
  const repository =
    process.env.GITHUB_REPOSITORY ??
    (process.env.VERCEL_GIT_REPO_OWNER && process.env.VERCEL_GIT_REPO_SLUG
      ? `${process.env.VERCEL_GIT_REPO_OWNER}/${process.env.VERCEL_GIT_REPO_SLUG}`
      : undefined)
  const branch = process.env.GITHUB_BRANCH ?? 'main'
  const feedUrl = process.env.MEDIUM_FEED_URL ?? DEFAULT_FEED

  if (!secret) return json({ error: 'CRON_SECRET is not configured' }, 500)

  const authorization = request.headers.get('authorization') ?? ''
  const provided = authorization.replace(/^Bearer\s+/i, '')
  if (!provided || !secretMatches(provided, secret)) {
    return json({ error: 'unauthorized' }, 401)
  }

  if (!token) return json({ error: 'GITHUB_TOKEN is not configured' }, 500)
  if (!repository?.includes('/')) {
    return json({ error: 'GITHUB_REPOSITORY must be set to "owner/repo"' }, 500)
  }

  const [owner, repo] = repository.split('/')
  const config = { token, owner, repo, branch }
  const dryRun = new URL(request.url).searchParams.get('dryRun') !== null

  try {
    const feedResponse = await fetch(feedUrl, {
      headers: { accept: 'application/rss+xml, application/xml, text/xml', 'user-agent': 'me-medium-sync' },
    })
    if (!feedResponse.ok) {
      return json({ error: `feed request failed: ${feedResponse.status}` }, 502)
    }

    const items = parseFeed(await feedResponse.text())
    if (items.length === 0) {
      // Either the feed changed shape or Medium served an error page. Either way,
      // doing nothing is correct.
      return json({ error: 'feed contained no parsable items' }, 502)
    }

    const [manifestRaw, existingFiles] = await Promise.all([
      readTextFile(config, MANIFEST_PATH),
      listDirectory(config, POSTS_DIRECTORY),
    ])

    const existingSlugs = existingFiles
      .filter((name) => name.endsWith('.md'))
      .map((name) => name.replace(/\.md$/, ''))

    // Losing the manifest is the one failure mode that can silently duplicate the
    // whole blog, because a re-import of an already-ported post is
    // indistinguishable from a genuinely new post that happens to share a slug.
    // Refuse rather than guess, unless bootstrapping is explicitly requested.
    const bootstrap = new URL(request.url).searchParams.get('bootstrap') !== null
    if (manifestRaw === null && existingSlugs.length > 0 && !bootstrap) {
      return json(
        {
          status: 'refused',
          error:
            `${MANIFEST_PATH} is missing but ${POSTS_DIRECTORY} already has ${existingSlugs.length} posts. ` +
            'Restore the manifest, or pass ?bootstrap=1 to import anyway (this can create duplicates).',
        },
        409,
      )
    }

    const manifest = parseManifest(manifestRaw)

    const takenSlugs = new Set([
      ...existingSlugs,
      ...Object.values(manifest.imported).map((entry) => entry.slug),
    ])

    const pending: FeedItem[] = items
      .filter((item) => !manifest.imported[item.id])
      .sort((a, b) => (a.date < b.date ? -1 : 1))

    const skipped = items.length - pending.length
    const batch = pending.slice(0, MAX_POSTS_PER_RUN)

    const rendered = batch.map((item) => {
      const slug = uniqueSlug(slugFor(item), takenSlugs)
      takenSlugs.add(slug)
      return renderPost(item, slug)
    })

    const summary = {
      feed: feedUrl,
      feedItems: items.length,
      alreadyImported: skipped,
      deferredToNextRun: Math.max(pending.length - batch.length, 0),
      imported: rendered.map((post) => ({
        id: post.item.id,
        slug: post.slug,
        title: post.item.title,
        date: post.item.date,
        path: post.path,
      })),
    }

    if (rendered.length === 0) return json({ ...summary, status: 'up-to-date' })

    if (dryRun) {
      return json({
        ...summary,
        status: 'dry-run',
        preview: rendered.map((post) => ({ path: post.path, contents: post.contents })),
      })
    }

    const now = new Date().toISOString()
    for (const post of rendered) {
      manifest.imported[post.item.id] = {
        slug: post.slug,
        title: post.item.title,
        url: post.item.url,
        importedAt: now,
      }
    }

    const files = [
      ...rendered.map((post) => ({ path: post.path, contents: post.contents })),
      { path: MANIFEST_PATH, contents: `${JSON.stringify(manifest, null, 2)}\n` },
    ]

    const { commitSha, commitUrl } = await commitFiles(config, commitMessage(rendered), files)

    return json({ ...summary, status: 'committed', commitSha, commitUrl })
  } catch (error) {
    if (error instanceof GitHubError && error.status === 422) {
      // The branch moved mid-run. Aborting is correct; the next run retries.
      return json({ status: 'conflict', error: error.message }, 409)
    }
    const message = error instanceof Error ? error.message : String(error)
    console.error('[sync-medium]', message)
    return json({ error: message }, 500)
  }
}
