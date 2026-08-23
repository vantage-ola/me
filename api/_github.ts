/**
 * Minimal GitHub client for committing generated content back to the repo.
 *
 * Writes go through the Git Data API (blob -> tree -> commit -> ref) rather than
 * the Contents API, because the Contents API commits one file per call. Batching
 * matters here: every commit to the default branch triggers a Vercel build, so N
 * new posts must land as a single commit, not N commits.
 */

const API = 'https://api.github.com'

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
  return Buffer.from(file.content, 'base64').toString('utf8')
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
          content: Buffer.from(file.contents, 'utf8').toString('base64'),
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
