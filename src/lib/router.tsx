import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { AnchorHTMLAttributes, ReactNode } from 'react'

const RouteContext = createContext<string>('/')
const EVT = 'route:navigate'

// Remember where each history entry was scrolled so Back/Forward can restore it
// (a fresh forward navigation still starts at the top).
const scrollPositions = new Map<string, number>()
let currentPath = typeof window !== 'undefined' ? window.location.pathname : '/'

export function navigate(to: string, replace = false) {
  if (to === window.location.pathname + window.location.search) return
  scrollPositions.set(currentPath, window.scrollY)
  if (replace) window.history.replaceState({}, '', to)
  else window.history.pushState({}, '', to)
  window.dispatchEvent(new Event(EVT))
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(() => window.location.pathname)

  useEffect(() => {
    // Take manual control; we restore per-entry scroll ourselves.
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual'

    // Back/forward: restore the position this entry had when we left it.
    const onPop = () => {
      scrollPositions.set(currentPath, window.scrollY)
      const next = window.location.pathname
      currentPath = next
      setPath(next)
      const y = scrollPositions.get(next) ?? 0
      if (y <= 0) { window.scrollTo(0, 0); return }
      // The new view (and its images) may not have laid out yet, so the page can
      // still be too short to reach `y`. Re-apply on a timer until it sticks or the
      // target becomes reachable. setTimeout (not rAF, which is throttled in
      // background/inactive tabs) so this fires reliably.
      let tries = 0
      const restore = () => {
        window.scrollTo(0, y)
        const maxY = document.documentElement.scrollHeight - window.innerHeight
        const reached = window.scrollY >= Math.min(y, Math.max(0, maxY)) - 2
        if (!(reached && maxY >= y) && tries++ < 30) window.setTimeout(restore, 40)
      }
      window.setTimeout(restore, 0)
    }
    // Link navigation: a new page always starts at the top.
    const onNav = () => {
      currentPath = window.location.pathname
      setPath(currentPath)
      window.scrollTo(0, 0)
    }
    window.addEventListener('popstate', onPop)
    window.addEventListener(EVT, onNav)
    return () => {
      window.removeEventListener('popstate', onPop)
      window.removeEventListener(EVT, onNav)
    }
  }, [])

  return <RouteContext.Provider value={path}>{children}</RouteContext.Provider>
}

export const useRoute = () => useContext(RouteContext)

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }

export function Link({ to, children, onClick, ...rest }: LinkProps) {
  const handle = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      // let modified clicks / new-tab behave natively
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
      e.preventDefault()
      onClick?.(e)
      navigate(to)
    },
    [to, onClick],
  )
  return (
    <a href={to} onClick={handle} {...rest}>
      {children}
    </a>
  )
}
