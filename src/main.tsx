import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@mdwrk/ui-tokens/styles/root.css'
import '@mdwrk/markdown-renderer-react/styles/default.css'
import './styles/themes.css'
import './index.css'
import App from './App.tsx'
import { Analytics } from "@vercel/analytics/react"

const root = document.getElementById('root')!
const app = (
  <StrictMode>
    <BrowserRouter>
      <App />
      <Analytics />
    </BrowserRouter>
  </StrictMode>
)
if (root.hasChildNodes()) hydrateRoot(root, app)
else createRoot(root).render(app)
