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



/* --------------------------------------- feed and markdown conversion --- */

/**
 * Medium RSS -> markdown. Zero dependencies, runs on the Vercel Node runtime.
 *
 * The feed only ever exposes the 10 most recent posts, so callers must persist
 * what they import. See api/sync-medium.ts.
 */

export interface FeedItem {
  /** Medium post id from <guid>, e.g. "7002563b8907". Stable identity. */
  id: string
  title: string
  /** Canonical post URL with Medium's ?source= tracking removed. */
  url: string
  /** ISO date (UTC) derived from <pubDate>. */
  date: string
  categories: string[]
  /** Raw HTML from <content:encoded>. */
  html: string
}

/* ------------------------------------------------------------------ text --- */

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: '\u00a0',
  hellip: '\u2026',
  mdash: '\u2014',
  ndash: '\u2013',
  lsquo: '\u2018',
  rsquo: '\u2019',
  ldquo: '\u201c',
  rdquo: '\u201d',
}

export function decodeEntities(input: string): string {
  return input.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, body: string) => {
    if (body.startsWith('#x') || body.startsWith('#X')) {
      const code = Number.parseInt(body.slice(2), 16)
      return Number.isFinite(code) ? String.fromCodePoint(code) : match
    }
    if (body.startsWith('#')) {
      const code = Number.parseInt(body.slice(1), 10)
      return Number.isFinite(code) ? String.fromCodePoint(code) : match
    }
    const named = ENTITIES[body.toLowerCase()]
    return named ?? match
  })
}

/**
 * Medium pads text with non-breaking and hair spaces (it inserts \u00a0 before
 * the final word of most paragraphs). Left alone these become invisible landmines
 * in the markdown source.
 *
 * Only zero-width space and BOM are removed. U+200C/U+200D are deliberately kept:
 * the zero-width joiner is load-bearing inside emoji sequences and in scripts
 * like Persian and Hindi, so stripping it would corrupt real content.
 */
export function normalizeSpaces(input: string): string {
  return input
    .replace(/[\u00a0\u2007\u202f]/g, ' ')
    .replace(/[\u200a\u2009\u2008]/g, ' ')
    .replace(/\u200b|\ufeff/g, '')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
}

/* ------------------------------------------------------------------- xml --- */

/**
 * indexOf that never matches inside a CDATA section. Necessary because a post
 * body is CDATA-wrapped and could legitimately contain the text "</item>".
 */
function indexOfOutsideCdata(xml: string, needle: string, from: number): number {
  let cursor = from
  while (cursor <= xml.length) {
    const hit = xml.indexOf(needle, cursor)
    if (hit === -1) return -1
    const cdata = xml.indexOf('<![CDATA[', cursor)
    if (cdata === -1 || hit < cdata) return hit
    const cdataEnd = xml.indexOf(']]>', cdata)
    if (cdataEnd === -1) return -1
    cursor = cdataEnd + 3
  }
  return -1
}

function itemBlocks(xml: string): string[] {
  const blocks: string[] = []
  let cursor = 0
  for (;;) {
    const start = indexOfOutsideCdata(xml, '<item>', cursor)
    if (start === -1) break
    const end = indexOfOutsideCdata(xml, '</item>', start)
    if (end === -1) break
    blocks.push(xml.slice(start + '<item>'.length, end))
    cursor = end + '</item>'.length
  }
  return blocks
}

function unwrap(raw: string): string {
  const cdata = /^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/.exec(raw)
  if (cdata) return cdata[1]
  return decodeEntities(raw)
}

function tagContent(xml: string, name: string): string | null {
  const opening = new RegExp(`<${name.replace(':', ':')}(?:\\s[^>]*)?>`, 'i')
  const match = opening.exec(xml)
  if (!match) return null
  const start = match.index + match[0].length
  const end = indexOfOutsideCdata(xml, `</${name}>`, start)
  if (end === -1) return null
  return xml.slice(start, end)
}

function allTagContents(xml: string, name: string): string[] {
  const out: string[] = []
  const pattern = new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'gi')
  for (const match of xml.matchAll(pattern)) out.push(match[1])
  return out
}

/* ------------------------------------------------------------------ feed --- */

function toIsoDate(pubDate: string | null): string {
  const parsed = pubDate ? new Date(pubDate.trim()) : new Date(Number.NaN)
  const date = Number.isNaN(parsed.getTime()) ? new Date() : parsed
  return date.toISOString().slice(0, 10)
}

function cleanUrl(link: string): string {
  try {
    const url = new URL(link.trim())
    url.search = ''
    url.hash = ''
    return url.toString()
  } catch {
    return link.trim()
  }
}

/** Medium ids come from <guid>https://medium.com/p/{id}</guid>. */
function postId(guid: string | null, html: string): string | null {
  if (guid) {
    const segment = guid.trim().replace(/\/+$/, '').split('/').pop()
    if (segment && /^[0-9a-f]{6,}$/i.test(segment)) return segment.toLowerCase()
  }
  // Fallback: the tracking pixel Medium appends carries postId=...
  const pixel = /[?&]postId=([0-9a-f]{6,})/i.exec(html)
  return pixel ? pixel[1].toLowerCase() : null
}

export function parseFeed(xml: string): FeedItem[] {
  const items: FeedItem[] = []
  for (const block of itemBlocks(xml)) {
    const html = normalizeSpaces(unwrap(tagContent(block, 'content:encoded') ?? ''))
    const rawTitle = tagContent(block, 'title')
    const rawLink = tagContent(block, 'link')
    const id = postId(tagContent(block, 'guid'), html)
    if (!id || !rawTitle || !rawLink) continue

    items.push({
      id,
      title: normalizeSpaces(unwrap(rawTitle)).trim(),
      url: cleanUrl(unwrap(rawLink)),
      date: toIsoDate(tagContent(block, 'pubDate')),
      categories: allTagContents(block, 'category')
        .map((value) => unwrap(value).trim().toLowerCase())
        .filter(Boolean),
      html,
    })
  }
  return items
}

/* -------------------------------------------------------------- markdown --- */

function attrValue(fragment: string, name: string): string | null {
  const pattern = new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'i')
  const match = pattern.exec(fragment)
  if (!match) return null
  return decodeEntities(match[2] ?? match[3] ?? '')
}

/**
 * Medium wraps embeds in cdn.embedly.com with the real destination in ?url=.
 * Unwrap it so the markdown links to YouTube rather than to a proxy widget.
 */
function resolveEmbed(src: string): { url: string; label: string } | null {
  let url: URL
  try {
    url = new URL(src)
  } catch {
    return null
  }
  if (!url.hostname.endsWith('embedly.com')) {
    return { url: src, label: url.hostname.replace(/^www\./, '') }
  }
  const target = url.searchParams.get('url')
  if (!target) return null
  const label = url.searchParams.get('display_name')
  let host = label
  if (!host) {
    try {
      host = new URL(target).hostname.replace(/^www\./, '')
    } catch {
      host = 'link'
    }
  }
  return { url: target, label: host }
}

/** Converts inline-level HTML only. Safe to run before block handling. */
function inlineToMarkdown(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<code\b[^>]*>([\s\S]*?)<\/code>/gi, (_m, inner: string) => `\`${stripTags(inner)}\``)
    .replace(/<(?:strong|b)\b[^>]*>([\s\S]*?)<\/(?:strong|b)>/gi, (_m, inner: string) => {
      const text = inlineToMarkdown(inner).trim()
      return text ? `**${text}**` : ''
    })
    .replace(/<(?:em|i)\b[^>]*>([\s\S]*?)<\/(?:em|i)>/gi, (_m, inner: string) => {
      const text = inlineToMarkdown(inner).trim()
      return text ? `*${text}*` : ''
    })
    .replace(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi, (_m, attrs: string, inner: string) => {
      const text = inlineToMarkdown(inner).trim()
      const href = attrValue(attrs, 'href')
      if (!text) return ''
      const destination = href ? linkDestination(href) : null
      if (!destination) return text
      return `[${text.replace(/[[\]]/g, '')}](${destination})`
    })
}

/**
 * Strips HTML tags without eating angle-bracketed markdown link destinations.
 *
 * The element name must be followed by whitespace, `/` or `>`, so `<p>` and
 * `<img ... />` are removed while `<https://example.com/a b>` survives. This
 * matters because tidy() runs after inline conversion has already emitted
 * markdown.
 */
function stripTags(html: string): string {
  return html.replace(/<\/?[a-zA-Z][a-zA-Z0-9-]*(?:\s[^>]*)?\/?>|<!--[\s\S]*?-->/g, '')
}

/**
 * Prepares a URL for use inside `[text](...)`.
 *
 * Verified against the mdwrk renderer, which does its own percent-encoding:
 *   - raw brackets work and encode to %5B/%5D correctly
 *   - pre-encoded %XX gets double-encoded (%5B -> %255B), so never pre-encode
 *   - raw parens silently TRUNCATE the href, backslash-escaped parens work
 *   - `[text](<dest>)` is not supported; it degrades into an autolink and the
 *     link text is lost, so angle wrapping is not an option
 *   - whitespace in a destination truncates and has no working escape
 *
 * Returns null when the URL cannot be represented, so callers can fall back to
 * plain text rather than emit a silently broken link.
 */
function linkDestination(url: string): string | null {
  const trimmed = url.trim()
  if (!trimmed) return null
  // Whitespace or control characters make the renderer truncate the href, and
  // there is no escape form that works, so the link is dropped instead.
  if (/\s/.test(trimmed)) return null
  for (const character of trimmed) {
    const code = character.codePointAt(0) ?? 0
    if (code < 0x20 || code === 0x7f) return null
  }
  return trimmed.replace(/[\\()]/g, (char) => `\\${char}`)
}

function tidy(text: string): string {
  return normalizeSpaces(decodeEntities(stripTags(text)))
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

/** Keeps a paragraph from being reinterpreted as a heading, quote or list. */
function escapeBlockStart(text: string): string {
  return text.replace(/^([#>]|[-+*](?=\s)|\d+(?=[.)]\s))/, '\\$1')
}

export function htmlToMarkdown(html: string): string {
  let out = html

  const headingLevels = [...html.matchAll(/<h([1-6])\b/gi)].map((match) => Number(match[1]))
  const shallowestHeading = headingLevels.length ? Math.min(...headingLevels) : 3

  // Medium appends a 1x1 stat beacon to every post body.
  out = out.replace(/<img[^>]*medium\.com\/_\/stat[^>]*>/gi, '')

  // Figures become an image plus an italic caption line.
  out = out.replace(/<figure\b[^>]*>([\s\S]*?)<\/figure>/gi, (_m, inner: string) => {
    const source = attrValue(inner, 'src')
    const src = source ? linkDestination(source) : null
    if (!src) return '\n\n'
    const captionHtml = /<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/i.exec(inner)
    const caption = captionHtml ? tidy(inlineToMarkdown(captionHtml[1])) : ''
    const alt = (attrValue(inner, 'alt') || tidy(captionHtml?.[1] ?? '')).replace(/[[\]]/g, '')
    const image = `![${alt}](${src})`
    return caption ? `\n\n${image}\n\n*${caption}*\n\n` : `\n\n${image}\n\n`
  })

  // Embeds become a plain link to the real destination.
  out = out.replace(/<iframe\b([^>]*)>([\s\S]*?)<\/iframe>/gi, (_m, attrs: string, inner: string) => {
    const src = attrValue(attrs, 'src')
    const embed = src ? resolveEmbed(src) : null
    const fallback = attrValue(inner, 'href')
    const destination = embed ? linkDestination(embed.url) : null
    if (embed && destination) return `\n\n[${embed.label}](${destination})\n\n`
    const fallbackDestination = fallback ? linkDestination(fallback) : null
    if (fallbackDestination) return `\n\n[Watch the embed](${fallbackDestination})\n\n`
    return '\n\n'
  })

  out = inlineToMarkdown(out)

  out = out.replace(/<ol\b[^>]*>([\s\S]*?)<\/ol>/gi, (_m, inner: string) => {
    let index = 0
    const lines = [...inner.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)]
      .map((match) => {
        const text = tidy(match[1])
        if (!text) return ''
        index += 1
        return `${index}. ${text}`
      })
      .filter(Boolean)
    return lines.length ? `\n\n${lines.join('\n')}\n\n` : '\n\n'
  })

  out = out.replace(/<ul\b[^>]*>([\s\S]*?)<\/ul>/gi, (_m, inner: string) => {
    const lines = [...inner.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)]
      .map((match) => tidy(match[1]))
      .filter(Boolean)
      .map((text) => `- ${text}`)
    return lines.length ? `\n\n${lines.join('\n')}\n\n` : '\n\n'
  })

  out = out.replace(/<blockquote\b[^>]*>([\s\S]*?)<\/blockquote>/gi, (_m, inner: string) => {
    const body = inner
      .replace(/<\/p>\s*<p\b[^>]*>/gi, '\n\n')
      .replace(/<\/?p\b[^>]*>/gi, '')
    const quoted = tidy(body)
      .split('\n')
      .map((line) => (line.trim() ? `> ${line.trim()}` : '>'))
      .join('\n')
    return quoted ? `\n\n${quoted}\n\n` : '\n\n'
  })

  out = out.replace(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi, (_m, level: string, inner: string) => {
    const text = tidy(inner)
    if (!text) return '\n\n'
    // The post title is already an <h1> in the page shell, so the shallowest
    // heading in the body becomes ##. Medium is inconsistent about whether an
    // author's section headings are h3 or h4, so normalize per post rather than
    // hardcoding a level, otherwise heading depth varies between posts.
    const depth = Math.min(Number(level) - shallowestHeading + 2, 6)
    return `\n\n${'#'.repeat(depth)} ${text}\n\n`
  })

  out = out.replace(/<p\b[^>]*>([\s\S]*?)<\/p>/gi, (_m, inner: string) => {
    const text = tidy(inner)
    return text ? `\n\n${escapeBlockStart(text)}\n\n` : '\n\n'
  })

  out = normalizeSpaces(decodeEntities(stripTags(out)))

  return out
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/, ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/* ----------------------------------------------------------------- posts --- */

const MAX_EXCERPT = 160

export function buildExcerpt(markdown: string): string {
  const paragraph = markdown
    .split('\n\n')
    .map((block) => block.trim())
    .find((block) => block && !/^[#>!]/.test(block) && !/^[-*\d]/.test(block))
  if (!paragraph) return ''

  const plain = paragraph
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*`_]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (plain.length <= MAX_EXCERPT) return plain

  const sentence = /^(.{40,160}?[.!?])(\s|$)/.exec(plain)
  if (sentence) return sentence[1]

  const clipped = plain.slice(0, MAX_EXCERPT)
  const lastSpace = clipped.lastIndexOf(' ')
  return `${(lastSpace > 40 ? clipped.slice(0, lastSpace) : clipped).replace(/[,;:.\s]+$/, '')}...`
}

/**
 * Reuses Medium's own slug from the post URL rather than re-slugifying the
 * title. Medium already strips apostrophes and em dashes in a specific way and
 * matching it exactly avoids a class of unicode bugs.
 */
export function slugFor(item: FeedItem): string {
  try {
    const last = new URL(item.url).pathname.replace(/^\/+|\/+$/g, '').split('/').pop() ?? ''
    const withoutId = last.replace(new RegExp(`-?${item.id}$`, 'i'), '')
    if (withoutId) return withoutId
  } catch {
    /* fall through to title slugification */
  }
  return item.title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['\u2018\u2019]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || item.id
}

function yamlString(value: string): string {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}

export interface RenderedPost {
  item: FeedItem
  slug: string
  path: string
  contents: string
}

export function renderPost(item: FeedItem, slug: string, maxTags = 4): RenderedPost {
  const body = htmlToMarkdown(item.html)
  const excerpt = buildExcerpt(body)
  const tags = [...new Set(item.categories)].slice(0, maxTags)

  const frontmatter = [
    '---',
    `title: ${yamlString(item.title)}`,
    `date: ${item.date}`,
    `tags: [${tags.join(', ')}]`,
    ...(excerpt ? [`excerpt: ${yamlString(excerpt)}`] : []),
    `medium_id: ${yamlString(item.id)}`,
    `medium_url: ${yamlString(item.url)}`,
    '---',
  ].join('\n')

  return {
    item,
    slug,
    path: `content/posts/${slug}.md`,
    contents: `${frontmatter}\n\n${body}\n`,
  }
}

/** Appends -2, -3 ... when a slug is already taken by an unrelated post. */
export function uniqueSlug(desired: string, taken: Set<string>): string {
  if (!taken.has(desired)) return desired
  for (let suffix = 2; suffix < 50; suffix += 1) {
    const candidate = `${desired}-${suffix}`
    if (!taken.has(candidate)) return candidate
  }
  return `${desired}-${Date.now()}`
}

/* ------------------------------------------------------------- github --- */

/**
 * Minimal GitHub client for committing generated content back to the repo.
 *
 * Writes go through the Git Data API (blob -> tree -> commit -> ref) rather than
 * the Contents API, because the Contents API commits one file per call. Batching
 * matters here: every commit to the default branch triggers a Vercel build, so N
 * new posts must land as a single commit, not N commits.
 */

const API = 'https://api.github.com'

/**
 * Base64 via Web APIs rather than Buffer.
 *
 * Vercel typechecks files in /api against the root tsconfig.json, and that file
 * contains only project references, which Vercel does not support. The function
 * therefore compiles without @types/node, so Node globals are unavailable. See
 * the matching "types": [] in tsconfig.api.json, which makes the local
 * typecheck enforce the same constraint.
 */
function encodeBase64(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index])
  }
  return btoa(binary)
}

function decodeBase64(base64: string): string {
  // GitHub wraps base64 payloads at 60 characters and atob rejects whitespace.
  const binary = atob(base64.replace(/\s+/g, ''))
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return new TextDecoder().decode(bytes)
}

/** Reads an environment variable without depending on the Node process typings. */
function readEnv(name: string): string | undefined {
  const runtime = globalThis as { process?: { env?: Record<string, string | undefined> } }
  return runtime.process?.env?.[name]
}

export interface GitHubConfig {
  token: string
  owner: string
  repo: string
  branch: string
}

export interface FileChange {
  path: string
  contents: string
}

export class GitHubError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'GitHubError'
    this.status = status
  }
}

async function request<T>(
  config: GitHubConfig,
  path: string,
  init: RequestInit & { allow404?: boolean } = {},
): Promise<T | null> {
  const { allow404, ...rest } = init
  const response = await fetch(`${API}${path}`, {
    ...rest,
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${config.token}`,
      'content-type': 'application/json',
      'user-agent': 'me-medium-sync',
      'x-github-api-version': '2022-11-28',
      ...rest.headers,
    },
  })

  if (response.status === 404 && allow404) return null

  if (!response.ok) {
    const body = await response.text()
    throw new GitHubError(
      response.status,
      `${rest.method ?? 'GET'} ${path} failed: ${response.status} ${body.slice(0, 400)}`,
    )
  }

  if (response.status === 204) return null
  return (await response.json()) as T
}

function repoPath(config: GitHubConfig, suffix: string): string {
  return `/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.repo)}${suffix}`
}

/** Names of the files directly inside a directory. Empty array if it's missing. */
export async function listDirectory(config: GitHubConfig, directory: string): Promise<string[]> {
  const entries = await request<Array<{ name: string; type: string }>>(
    config,
    repoPath(config, `/contents/${directory}?ref=${encodeURIComponent(config.branch)}`),
    { allow404: true },
  )
  if (!entries || !Array.isArray(entries)) return []
  return entries.filter((entry) => entry.type === 'file').map((entry) => entry.name)
}

/** File contents as UTF-8 text, or null when the file does not exist. */
export async function readTextFile(config: GitHubConfig, path: string): Promise<string | null> {
  const file = await request<{ content?: string; encoding?: string }>(
    config,
    repoPath(config, `/contents/${path}?ref=${encodeURIComponent(config.branch)}`),
    { allow404: true },
  )
  if (!file?.content) return null
  if (file.encoding !== 'base64') return null
  return decodeBase64(file.content)
}

/**
 * Commits every file in one commit on top of the current branch head.
 *
 * The ref update is deliberately not forced: if someone pushed while this was
 * running, the fast-forward check fails and the run aborts instead of
 * overwriting that push. The next scheduled run picks the work back up.
 */
export async function commitFiles(
  config: GitHubConfig,
  message: string,
  files: FileChange[],
): Promise<{ commitSha: string; commitUrl: string }> {
  if (files.length === 0) throw new Error('commitFiles called with no files')

  const ref = await request<{ object: { sha: string } }>(
    config,
    repoPath(config, `/git/ref/heads/${config.branch}`),
  )
  if (!ref) throw new GitHubError(404, `branch ${config.branch} not found`)
  const headSha = ref.object.sha

  const headCommit = await request<{ tree: { sha: string } }>(
    config,
    repoPath(config, `/git/commits/${headSha}`),
  )
  if (!headCommit) throw new GitHubError(404, `commit ${headSha} not found`)

  const blobs = await Promise.all(
    files.map(async (file) => {
      const blob = await request<{ sha: string }>(config, repoPath(config, '/git/blobs'), {
        method: 'POST',
        body: JSON.stringify({
          content: encodeBase64(file.contents),
          encoding: 'base64',
        }),
      })
      if (!blob) throw new GitHubError(500, `blob creation returned no sha for ${file.path}`)
      return { path: file.path, mode: '100644' as const, type: 'blob' as const, sha: blob.sha }
    }),
  )

  const tree = await request<{ sha: string }>(config, repoPath(config, '/git/trees'), {
    method: 'POST',
    body: JSON.stringify({ base_tree: headCommit.tree.sha, tree: blobs }),
  })
  if (!tree) throw new GitHubError(500, 'tree creation returned no sha')

  const commit = await request<{ sha: string; html_url: string }>(
    config,
    repoPath(config, '/git/commits'),
    {
      method: 'POST',
      body: JSON.stringify({ message, tree: tree.sha, parents: [headSha] }),
    },
  )
  if (!commit) throw new GitHubError(500, 'commit creation returned no sha')

  await request(config, repoPath(config, `/git/refs/heads/${config.branch}`), {
    method: 'PATCH',
    body: JSON.stringify({ sha: commit.sha, force: false }),
  })

  return { commitSha: commit.sha, commitUrl: commit.html_url }
}

/* ------------------------------------------------------------ handler --- */

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
  const secret = readEnv('CRON_SECRET')
  const token = readEnv('GITHUB_TOKEN')
  // Vercel populates the VERCEL_GIT_* system variables for git-connected
  // projects, so the repository does not normally need configuring by hand.
  const repository =
    readEnv('GITHUB_REPOSITORY') ??
    (readEnv('VERCEL_GIT_REPO_OWNER') && readEnv('VERCEL_GIT_REPO_SLUG')
      ? `${readEnv('VERCEL_GIT_REPO_OWNER')}/${readEnv('VERCEL_GIT_REPO_SLUG')}`
      : undefined)
  const branch = readEnv('GITHUB_BRANCH') ?? 'main'
  const feedUrl = readEnv('MEDIUM_FEED_URL') ?? DEFAULT_FEED

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
