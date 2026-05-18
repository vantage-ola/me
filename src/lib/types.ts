export interface ProjectFrontmatter {
  title: string
  role: string
  period: string
  status: 'active' | 'shipped' | 'archived'
  highlight: boolean
  tags: string[]
  links: { label: string; url: string }[]
  cover?: string
}

export interface PostFrontmatter {
  title: string
  date: string
  tags: string[]
  excerpt?: string
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
