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
