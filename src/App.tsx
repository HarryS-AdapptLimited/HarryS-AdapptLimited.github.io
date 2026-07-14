import { useRoute } from './lib/router'
import Nav from './components/Nav'
import Footer from './components/Footer'
import ErrorBoundary from './components/ErrorBoundary'
import Home from './pages/Home'
import IndexPage from './pages/IndexPage'
import Entry from './pages/Entry'
import CV from './pages/CV'
import AllPhotos from './pages/AllPhotos'
import NotFound from './pages/NotFound'
import { getEntry } from './lib/content'

function resolve(path: string) {
  const clean = path.replace(/\/+$/, '') || '/'
  switch (clean) {
    case '/':
      return <Home />
    case '/work':
      return <IndexPage type="creative" title="Work" blurb="Photographs and films from the road." />
    case '/tools':
      return <IndexPage type="tool" title="Tools" blurb="Software I make between trips — mostly things that run in a browser." />
    case '/photos':
      return <AllPhotos />
    case '/cv':
      return <CV />
    default: {
      const slug = clean.slice(1)
      const entry = getEntry(slug)
      return entry ? <Entry entry={entry} /> : <NotFound />
    }
  }
}

export default function App() {
  const path = useRoute()
  // the photo wall is its own full-screen surface — no footer, only the burger
  const fullscreen = path.replace(/\/+$/, '') === '/photos'
  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <Nav />
      <main id="main">
        <ErrorBoundary key={path}>{resolve(path)}</ErrorBoundary>
      </main>
      {!fullscreen && <Footer />}
    </>
  )
}
