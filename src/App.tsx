import { Routes, Route, useLocation } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { About } from './pages/About'
import { Projects } from './pages/Projects'
import { ProjectDetail } from './pages/ProjectDetail'
import { Writing } from './pages/Writing'
import { PostDetail } from './pages/PostDetail'
import { Uses } from './pages/Uses'
import { Now } from './pages/Now'
import { Sessions } from './pages/Sessions'
import { SessionPayment } from './pages/SessionPayment'
import { Support } from './pages/Support'
import { PaymentResult } from './pages/PaymentResult'
import { Seo } from './components/Seo'
import { NotFound } from './pages/NotFound'
import { SessionPromo } from './pages/SessionPromo'

function App() {
  const { pathname } = useLocation()
  if (pathname.replace(/\/+$/, '') === '/sessions/promo') return <><Seo /><SessionPromo /></>
  return (
    <><Seo /><Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:slug" element={<ProjectDetail />} />
        <Route path="/writing" element={<Writing />} />
        <Route path="/writing/:slug" element={<PostDetail />} />
        <Route path="/uses" element={<Uses />} />
        <Route path="/now" element={<Now />} />
        <Route path="/sessions" element={<Sessions />} />
        <Route path="/sessions/pay" element={<SessionPayment />} />
        <Route path="/support" element={<Support />} />
        <Route path="/payment-result" element={<PaymentResult />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout></>
  )
}

export default App
