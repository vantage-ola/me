import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { About } from './pages/About'
import { Projects } from './pages/Projects'
import { ProjectDetail } from './pages/ProjectDetail'
import { Writing } from './pages/Writing'
import { PostDetail } from './pages/PostDetail'
import { Uses } from './pages/Uses'
import { Now } from './pages/Now'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:slug" element={<ProjectDetail />} />
        <Route path="/writing" element={<Writing />} />
        <Route path="/writing/:slug" element={<PostDetail />} />
        <Route path="/uses" element={<Uses />} />
        <Route path="/now" element={<Now />} />
      </Routes>
    </Layout>
  )
}

export default App
