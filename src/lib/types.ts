export interface ProjectFrontmatter {
  title: string
  role: string
  period: string
  status: 'active' | 'shipped' | 'archived'
  highlight: boolean
  tags: string[]
  links: { label: string; url: string }[]
  cover?: string
  description?: string
}

export interface PostFrontmatter {
  title: string
  date: string
  tags: string[]
  excerpt?: string
  updated?: string
  /** Optional preferred URL when this post should canonicalize elsewhere. */
  canonical_url?: string
  /** Medium post id, present only on posts imported by api/sync-medium.ts. */
  medium_id?: string
  /** URL of the Medium original, for attribution. */
  medium_url?: string
}

export interface Project {
  slug: string
  frontmatter: ProjectFrontmatter
  content: string
}

export interface Post {
  slug: string
  frontmatter: PostFrontmatter
  content: string
}
