import { PostItem } from '../components/PostItem'
import { loadPosts } from '../lib/content'

const posts = loadPosts()

export function Writing() {
  return (
    <>
      <h1 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem', fontWeight: 700, color: 'var(--fg-primary)' }}>
        Writing
      </h1>
      {posts.length === 0 ? (
        <p style={{ color: 'var(--fg-muted)' }}>Nothing published yet.</p>
      ) : (
        posts.map(p => <PostItem key={p.slug} post={p} />)
      )}
    </>
  )
}
