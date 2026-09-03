/**
 * Local end-to-end exercise of api/sync-medium.ts without touching Vercel.
 * Usage: bun scripts/test-sync-local.ts [dry|commit]
 * 'dry' (default) passes ?dryRun=1 so nothing is written to GitHub.
 */
import { readFileSync } from 'node:fs'
import { GET } from '../api/sync-medium.ts'

for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n')) {
  const m = /^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/.exec(line)
  if (m && !(m[1] in process.env)) process.env[m[1]] = m[2]
}

process.env.GITHUB_REPOSITORY ??= 'vantage-ola/me'

const dry = !process.argv.includes('commit')
const mode = dry ? '?dryRun=1' : ''
const request = new Request(`https://localhost/api/sync-medium${mode}`, {
  headers: { authorization: `Bearer ${process.env.CRON_SECRET ?? ''}` },
})

const response = await GET(request)
const body = await response.text()
console.log('HTTP', response.status)
try {
  const parsed = JSON.parse(body)
  const { preview, ...rest } = parsed as { preview?: unknown }
  console.log(JSON.stringify(rest, null, 2))
  if (Array.isArray(preview)) {
    console.log(`--- preview: ${preview.length} file(s) ---`)
    for (const p of preview as { path: string; contents: string }[]) {
      console.log(`\n===== ${p.path} =====`)
      console.log(p.contents.slice(0, 1200))
    }
  }
} catch {
  console.log(body)
}
