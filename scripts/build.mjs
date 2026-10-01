import { build } from 'vite'
import { Resvg } from '@resvg/resvg-js'
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { pathToFileURL } from 'node:url'

const root = process.cwd()
const generated = resolve(root, 'public/generated')
await rm(generated, { recursive: true, force: true })
await mkdir(`${generated}/social`, { recursive: true })
await build({ build: { ssr: 'src/entry-server.tsx', outDir: '.prerender', emptyOutDir: true }, ssr: { noExternal: ['@mdwrk/markdown-renderer-react'] } })
const { getPagePaths, getPageSeo, renderSeoHead, render, renderPoster, siteOrigin } = await import(pathToFileURL(resolve(root, '.prerender/entry-server.js')).href)
const paths = getPagePaths()
const escape = (value) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const font = { fontFiles: ['Figtree-Regular.otf', 'Figtree-Bold.otf'].map((file) => resolve(root, 'public/fonts', file)), loadSystemFonts: false, defaultFontFamily: 'Figtree' }
async function png(svg, filename) {
  await writeFile(filename, new Resvg(svg, { font }).render().asPng())
}
function lines(text, limit = 35, max = 3) {
  const rows = ['']
  for (const word of text.split(/\s+/)) {
    if (rows.at(-1).length + word.length > limit && rows.at(-1)) rows.push('')
    rows[rows.length - 1] += `${rows.at(-1) ? ' ' : ''}${word}`
  }
  if (rows.length > max) rows[max - 1] = `${rows[max - 1].replace(/\s+\S*$/, '')}...`
  return rows.slice(0, max)
}
function socialImage(seo) {
  const title = seo.title.replace(/ \| (?:Projects by )?Olaoluwa(?: Oluwasanya)?(?: \| Software engineer)?$/, '')
  const rows = lines(title)
  const label = seo.path.startsWith('/writing/') ? 'WRITING' : seo.path.startsWith('/projects/') ? 'PROJECTS' : seo.path === '/sessions' ? 'ONE-ON-ONE SESSIONS' : 'SOFTWARE ENGINEER'
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" font-family="Figtree"><rect width="1200" height="630" fill="#111111"/><path d="M960 0V240H1200M1020 0V180H1200M1080 0V120H1200" stroke="#20e6ef" stroke-opacity=".2" fill="none"/><text x="68" y="90" fill="#20e6ef" font-size="25" letter-spacing="3">${label}</text>${rows.map((line, i) => `<text x="64" y="${216 + i * 76}" fill="#f5f5f5" font-size="62" font-weight="700">${escape(line)}</text>`).join('')}<line x1="68" x2="1132" y1="475" y2="475" stroke="#333"/><text x="68" y="551" fill="#eee" font-size="32" font-weight="700">olaoluwa.</text><text x="1132" y="549" text-anchor="end" fill="#aaa" font-size="25">olaoluwa.work</text></svg>`
}
for (const path of paths) {
  const seo = getPageSeo(path)
  await png(socialImage(seo), resolve(root, 'public', new URL(seo.image).pathname.slice(1)))
}
for (const story of [false, true]) {
  const svg = renderPoster(story)
  const name = `sessions-${story ? 'story' : 'portrait'}`
  await writeFile(`${generated}/${name}.svg`, svg)
  await png(svg, `${generated}/${name}.png`)
}
await build({ build: { outDir: 'dist', emptyOutDir: true } })
const template = await readFile(resolve(root, 'dist/index.html'), 'utf8')
for (const path of [...paths, '/404']) {
  const seo = getPageSeo(path)
  // Payment pages depend on query parameters and are rendered in the browser.
  const html = ['/sessions/pay', '/payment-result'].includes(path) ? '' : render(path)
  const output = template.replace(/<!-- page-meta:start -->[\s\S]*?<!-- page-meta:end -->/, renderSeoHead(seo)).replace('<div id="root"></div>', () => `<div id="root">${html}</div>`)
  const filename = resolve(root, 'dist', path === '/' ? 'index.html' : `${path.slice(1)}.html`)
  await mkdir(dirname(filename), { recursive: true })
  await writeFile(filename, output)
}
const indexable = paths.map(getPageSeo).filter((seo) => !seo.noindex && seo.canonical.startsWith(siteOrigin))
await writeFile(resolve(root, 'dist/sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexable.map((seo) => `<url><loc>${escape(seo.canonical)}</loc>${seo.modified ? `<lastmod>${seo.modified}</lastmod>` : ''}</url>`).join('\n')}\n</urlset>\n`)
await writeFile(resolve(root, 'dist/robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${siteOrigin}/sitemap.xml\n`)
await rm(resolve(root, '.prerender'), { recursive: true, force: true })
console.log(`Generated ${paths.length} pages, social previews, and two session flyers.`)
