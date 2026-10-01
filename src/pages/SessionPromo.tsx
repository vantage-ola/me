import { useState } from 'react'
import { Link } from 'react-router-dom'
import { SessionPoster } from '../components/SessionPoster'

export function SessionPromo() {
  const [story, setStory] = useState(false)
  return <main className="promo-page">
    <header className="promo-toolbar"><Link to="/sessions">← Sessions</Link><div role="group" aria-label="Flyer format"><button type="button" aria-pressed={!story} onClick={() => setStory(false)}>Portrait</button><button type="button" aria-pressed={story} onClick={() => setStory(true)}>Story</button></div><a key={story ? 'story' : 'portrait'} className="primary-button" href={`/generated/sessions-${story ? 'story' : 'portrait'}.png`} download={`olaoluwa-sessions-${story ? 'story' : 'portrait'}.png`}>Download image</a></header>
    <div className="promo-art"><SessionPoster story={story} /></div>
    <p className="promo-caption">First-five prices apply after approval. Regular prices are shown crossed out.</p>
  </main>
}
