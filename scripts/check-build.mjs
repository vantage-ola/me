import assert from 'node:assert/strict'
import { readdir, readFile, access } from 'node:fs/promises'
import { join, dirname } from 'node:path'

async function files(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const nested = await Promise.all(entries.map((entry) => entry.isDirectory() ? files(join(dir, entry.name)) : [join(dir, entry.name)]))
  return nested.flat()
}
const htmlFiles = (await files('dist')).filter((file) => file.endsWith('.html'))
const sitemap = await readFile('dist/sitemap.xml', 'utf8')
let indexable = 0
for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8')
  const head = html.split('</head>')[0]
  assert.equal((head.match(/<title\b/g) ?? []).length, 1, file)
  assert.equal((head.match(/rel="canonical"/g) ?? []).length, 1, file)
  assert.match(head, /name="description" content="[^"]+"/, file)
  assert.match(head, /name="twitter:card" content="summary_large_image"/, file)
  const json = head.match(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/)[1]
  const schema = JSON.parse(json)
  assert.equal(schema['@context'], 'https://schema.org')
  const canonical = head.match(/rel="canonical" href="([^"]+)"/)[1]
  if (!head.includes('noindex')) { assert.ok(sitemap.includes(`<loc>${canonical}</loc>`), file); indexable++ }
  else assert.ok(!sitemap.includes(`<loc>${canonical}</loc>`), file)
  const image = head.match(/property="og:image" content="([^"]+)"/)[1]
  const png = await readFile(join('dist', new URL(image).pathname))
  assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [1200, 630], image)
  if (['writing', 'projects'].includes(dirname(file).split('/').at(-1))) {
    assert.match(html, /class="markdown-body"/, file)
    assert.match(html, /<p class="md-p">/, file)
    assert.ok(schema['@graph'].some((item) => item['@type'] === (file.includes('/writing/') ? 'BlogPosting' : 'CreativeWork')), file)
  }
  for (const [, link] of html.matchAll(/(?:href|src)="(\/[^"#?]*)[^"]*"/g)) {
    if (link.startsWith('//') || link === '/') continue
    const target = join('dist', link)
    const found = await access(target).then(() => true, () => access(`${target}.html`).then(() => true, () => false))
    assert.ok(found, `${file}: missing ${link}`)
  }
}
assert.equal((sitemap.match(/<loc>/g) ?? []).length, indexable)
for (const [name, dimensions] of [['portrait', [1080, 1350]], ['story', [1080, 1920]]]) {
  const png = await readFile(`dist/generated/sessions-${name}.png`)
  assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], dimensions)
}
assert.match(await readFile('dist/404.html', 'utf8'), /Page not found/)
console.log(`Checked ${htmlFiles.length} HTML pages, ${indexable} sitemap URLs, structured data, internal assets, and export sizes.`)
