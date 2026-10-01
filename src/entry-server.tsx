import { renderToString, renderToStaticMarkup } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import App from './App'
import { SessionPoster } from './components/SessionPoster'
export { getPagePaths, getPageSeo, renderSeoHead, siteOrigin } from './lib/seo'

export function render(path: string) {
  return renderToString(<StaticRouter location={path}><App /></StaticRouter>)
}

export function renderPoster(story = false) {
  return renderToStaticMarkup(<SessionPoster story={story} />)
}
