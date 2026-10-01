import { loadPosts, loadProjects } from './content'

export const siteOrigin = 'https://olaoluwa.work'
const person = { '@type': 'Person', '@id': `${siteOrigin}/#person`, name: 'Olaoluwa Oluwasanya', url: `${siteOrigin}/about`, jobTitle: 'Software Engineer', sameAs: ['https://github.com/vantage-ola', 'https://www.linkedin.com/in/olaoluwa-oluwasanya/', 'https://iloveracing.medium.com/'] }

export type PageSeo = {
  title: string
  description: string
  path: string
  canonical: string
  image: string
  imageAlt: string
  type: 'website' | 'article'
  noindex?: boolean
  published?: string
  modified?: string
  schema: Record<string, unknown>[]
}

export function plainText(markdown: string): string {
  return markdown.replace(/```[\s\S]*?```/g, ' ').replace(/!\[[^\]]*\]\([^)]*\)/g, ' ').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/<[^>]*>/g, ' ').replace(/[#*_`>~]/g, '').replace(/\s+/g, ' ').trim()
}

function summary(value: string): string {
  const text = plainText(value)
  if (text.length <= 160) return text
  return `${text.slice(0, 157).replace(/\s+\S*$/, '')}...`
}

const pages: Record<string, [string, string]> = {
  '/': ['Olaoluwa Oluwasanya | Software engineer', 'Software engineer building useful products. Explore my projects, read my writing, or book practical one-on-one help with software engineering.'],
  '/about': ['About Olaoluwa | Software engineer', 'Meet Olaoluwa Oluwasanya, a software engineer working with TypeScript, Python, and Node. Learn about my background and how I approach building software.'],
  '/projects': ['Software projects | Olaoluwa', 'Projects and open source contributions by Olaoluwa. Explore the software I build, the problems it solves, and the work behind it.'],
  '/writing': ['Writing on software, life, and motorsport | Olaoluwa', 'Articles by Olaoluwa about software engineering, payments, life, and motorsport. Read the latest posts and browse the archive.'],
  '/uses': ['Tools I use | Olaoluwa', 'The editor, development tools, hardware, and AI tools I use to build and ship software.'],
  '/now': ["What I'm working on now | Olaoluwa", "A look at what I'm building, learning, and spending time on right now."],
  '/sessions': ['Software engineering sessions for beginners | Olaoluwa', 'Book practical one-on-one software engineering help: CV feedback, project reviews, or a plan for what to learn next. Sessions start at ₦10,000.'],
  '/support': ['Support my work | Olaoluwa', "Found something I've built or written useful? Choose an amount and support my work through Paystack."],
  '/sessions/promo': ['One-on-one sessions | Olaoluwa', 'Practical software engineering help for beginners. View and download the session flyer.'],
  '/sessions/pay': ['Session payment | Olaoluwa', 'Complete your approved session booking securely through Paystack.'],
  '/payment-result': ['Payment confirmation | Olaoluwa', 'Check the status of your Paystack payment.'],
}

export function getPageSeo(pathname: string): PageSeo {
  const path = pathname.replace(/\/+$/, '') || '/'
  const page = pages[path]
  const post = path.startsWith('/writing/') ? loadPosts().find((item) => path === `/writing/${item.slug}`) : undefined
  const project = path.startsWith('/projects/') ? loadProjects().find((item) => path === `/projects/${item.slug}`) : undefined
  const canonical = post?.frontmatter.canonical_url || `${siteOrigin}${path === '/' ? '/' : path}`
  const image = `${siteOrigin}/generated/social/${post ? `writing-${post.slug}` : project ? `projects-${project.slug}` : path === '/' ? 'home' : path.slice(1).replace(/\//g, '-')}.png`
  const title = post ? `${post.frontmatter.title} | Olaoluwa` : project ? `${project.frontmatter.title} | Projects by Olaoluwa` : page?.[0] ?? 'Page not found | Olaoluwa'
  const description = post ? summary(post.frontmatter.excerpt || post.content) : project ? summary(project.frontmatter.description || project.content) : page?.[1] ?? "This page doesn't exist. Explore Olaoluwa's projects, writing, and sessions."
  const noindex = !page && !post && !project || ['/sessions/pay', '/payment-result', '/sessions/promo'].includes(path)
  const published = post ? new Date(post.frontmatter.date).toISOString() : undefined
  const modified = post?.frontmatter.updated ? new Date(post.frontmatter.updated).toISOString() : published
  const schema: Record<string, unknown>[] = [person]
  if (path === '/') schema.push({ '@type': 'WebSite', '@id': `${siteOrigin}/#website`, url: siteOrigin, name: 'Olaoluwa', author: { '@id': person['@id'] } })
  if (path === '/about') schema.push({ '@type': 'ProfilePage', url: canonical, mainEntity: { '@id': person['@id'] } })
  if (post) schema.push({ '@type': 'BlogPosting', headline: post.frontmatter.title, description, url: canonical, mainEntityOfPage: canonical, author: { '@id': person['@id'] }, datePublished: published, dateModified: modified, image: { '@type': 'ImageObject', url: image, width: 1200, height: 630 }, keywords: post.frontmatter.tags, ...(post.frontmatter.medium_url ? { isBasedOn: post.frontmatter.medium_url } : {}) })
  if (project) schema.push({ '@type': 'CreativeWork', name: project.frontmatter.title, description, url: canonical, creator: { '@id': person['@id'] }, keywords: project.frontmatter.tags })
  if (path !== '/' && !noindex) {
    const parent = post ? '/writing' : project ? '/projects' : undefined
    const crumbs = [{ '@type': 'ListItem', position: 1, name: 'Home', item: `${siteOrigin}/` }]
    if (parent) crumbs.push({ '@type': 'ListItem', position: 2, name: post ? 'Writing' : 'Projects', item: `${siteOrigin}${parent}` })
    crumbs.push({ '@type': 'ListItem', position: crumbs.length + 1, name: post?.frontmatter.title ?? project?.frontmatter.title ?? title.split(' | ')[0], item: canonical })
    schema.push({ '@type': 'BreadcrumbList', itemListElement: crumbs })
  }
  return { title, description, path, canonical, image: noindex && !page ? `${siteOrigin}/generated/social/home.png` : image, imageAlt: post?.frontmatter.title ?? project?.frontmatter.title ?? title, type: post ? 'article' : 'website', noindex, published, modified, schema }
}

export function getPagePaths(): string[] {
  return [...Object.keys(pages), ...loadPosts().map((post) => `/writing/${post.slug}`), ...loadProjects().map((project) => `/projects/${project.slug}`)]
}

type HeadElement = { tag: 'title' | 'meta' | 'link' | 'script'; attrs: Record<string, string>; text?: string }

export function getHeadElements(seo: PageSeo): HeadElement[] {
  const meta = (attrs: Record<string, string>): HeadElement => ({ tag: 'meta', attrs })
  return [
    { tag: 'title', attrs: {}, text: seo.title },
    meta({ name: 'description', content: seo.description }),
    meta({ name: 'robots', content: seo.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large' }),
    { tag: 'link', attrs: { rel: 'canonical', href: seo.canonical } },
    meta({ property: 'og:title', content: seo.title }), meta({ property: 'og:description', content: seo.description }),
    meta({ property: 'og:type', content: seo.type }), meta({ property: 'og:url', content: seo.canonical }),
    meta({ property: 'og:site_name', content: 'Olaoluwa' }), meta({ property: 'og:locale', content: 'en_NG' }),
    meta({ property: 'og:image', content: seo.image }), meta({ property: 'og:image:type', content: 'image/png' }),
    meta({ property: 'og:image:width', content: '1200' }), meta({ property: 'og:image:height', content: '630' }), meta({ property: 'og:image:alt', content: seo.imageAlt }),
    meta({ name: 'twitter:card', content: 'summary_large_image' }), meta({ name: 'twitter:title', content: seo.title }),
    meta({ name: 'twitter:description', content: seo.description }), meta({ name: 'twitter:image', content: seo.image }), meta({ name: 'twitter:image:alt', content: seo.imageAlt }),
    ...(seo.published ? [meta({ property: 'article:published_time', content: seo.published })] : []),
    ...(seo.modified ? [meta({ property: 'article:modified_time', content: seo.modified })] : []),
    { tag: 'script', attrs: { type: 'application/ld+json' }, text: JSON.stringify({ '@context': 'https://schema.org', '@graph': seo.schema }).replace(/</g, '\\u003c') },
  ]
}

export function renderSeoHead(seo: PageSeo): string {
  const escape = (value: string) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return getHeadElements(seo).map(({ tag, attrs, text }) => {
    const attributes = Object.entries(attrs).map(([key, value]) => ` ${key}="${escape(value)}"`).join('')
    const open = `<${tag} data-page-meta=""${attributes}>`
    return tag === 'meta' || tag === 'link' ? open : `${open}${tag === 'script' ? text : escape(text ?? '')}</${tag}>`
  }).join('\n')
}
