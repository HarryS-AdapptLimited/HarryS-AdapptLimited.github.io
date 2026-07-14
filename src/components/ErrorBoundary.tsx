import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { error: Error | null }

/**
 * Catches render errors so one bad component (e.g. a malformed content entry)
 * degrades to a readable message instead of a blank white screen.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error) {
    console.error('Render error:', error)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="container" style={{ padding: '6rem 0', maxWidth: '48ch' }}>
          <p className="eyebrow">Something broke</p>
          <h1 style={{ fontSize: 'var(--t-h2)', marginTop: '1rem' }}>This page hit an error.</h1>
          <p style={{ color: 'var(--ink-soft)', marginTop: '1rem', fontSize: 'var(--t-lead)' }}>
            Try reloading. If it keeps happening, the content or a component needs a fix.
          </p>
          <a
            href="/"
            style={{ display: 'inline-block', marginTop: '2rem', borderBottom: '1px solid var(--line-strong)', paddingBottom: '0.3rem', fontFamily: 'var(--f-mono)', fontSize: '0.8rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}
          >
            ← Back home
          </a>
        </div>
      )
    }
    return this.props.children
  }
}
