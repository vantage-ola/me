import { parse as parseYaml } from 'yaml'
import type { Project, Post } from './types'

const projectFiles = import.meta.glob('/content/projects/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>

const postFiles = import.meta.glob('/content/posts/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>

const pageFiles = import.meta.glob('/content/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>

function parseFrontmatter(raw: string): { data: Record<string, unknown>; content: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) return { data: {}, content: raw }
  return {
    data: (parseYaml(match[1]) ?? {}) as Record<string, unknown>,
    content: match[2].trim(),
  }
}

function slugFrom(path: string): string {
  return path.split('/').pop()!.replace(/\.md$/, '')
}

export function loadProjects(): Project[] {
  return Object.entries(projectFiles)
    .map(([path, raw]) => {
      const { data, content } = parseFrontmatter(raw)
      return { slug: slugFrom(path), frontmatter: data as unknown as Project['frontmatter'], content }
    })
    .sort((a, b) => {
      if (a.frontmatter.status === 'active' && b.frontmatter.status !== 'active') return -1
      if (b.frontmatter.status === 'active' && a.frontmatter.status !== 'active') return 1
      return a.frontmatter.period < b.frontmatter.period ? 1 : -1
    })
}

export function loadPosts(): Post[] {
  return Object.entries(postFiles)
    .map(([path, raw]) => {
      const { data, content } = parseFrontmatter(raw)
      return { slug: slugFrom(path), frontmatter: data as unknown as Post['frontmatter'], content }
    })
    .sort((a, b) => (a.frontmatter.date < b.frontmatter.date ? 1 : -1))
}

export function loadPage(name: string): string {
  const raw = pageFiles[`/content/${name}.md`]
  if (!raw) return ''
  return parseFrontmatter(raw).content
}
