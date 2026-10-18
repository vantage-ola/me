import { useState } from 'react'
import { Link } from 'react-router-dom'
import { SessionPoster } from '../components/SessionPoster'

export function SessionPromo() {
  const [story, setStory] = useState(false)
  const [free, setFree] = useState(false)
  const format = `sessions-${free ? 'free-' : ''}${story ? 'story' : 'portrait'}`
  return <main className="promo-page">
    <header className="promo-toolbar"><Link to="/sessions">← Sessions</Link><div role="group" aria-label="Flyer type"><button type="button" aria-pressed={!free} onClick={() => setFree(false)}>Paid</button><button type="button" aria-pressed={free} onClick={() => setFree(true)}>Free</button></div><div role="group" aria-label="Flyer format"><button type="button" aria-pressed={!story} onClick={() => setStory(false)}>Portrait</button><button type="button" aria-pressed={story} onClick={() => setStory(true)}>Story</button></div><a key={format} className="primary-button" href={`/generated/${format}.png`} download={`olaoluwa-${format}.png`}>Download image</a></header>
    <div className="promo-art"><SessionPoster story={story} free={free} /></div>
    <p className="promo-caption">{free ? 'This flyer is for the free 90-minute session.' : 'First-five prices apply after approval. Regular prices are shown crossed out.'}</p>
  </main>
}
