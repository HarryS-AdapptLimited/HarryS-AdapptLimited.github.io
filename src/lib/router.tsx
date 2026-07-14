import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { AnchorHTMLAttributes, ReactNode } from 'react'

const RouteContext = createContext<string>('/')
const EVT = 'route:navigate'

export function navigate(to: string, replace = false) {
  if (to === window.location.pathname + window.location.search) return
  if (replace) window.history.replaceState({}, '', to)
  else window.history.pushState({}, '', to)
  window.dispatchEvent(new Event(EVT))
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(() => window.location.pathname)

  useEffect(() => {
    const onChange = () => {
      setPath(window.location.pathname)
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('popstate', onChange)
    window.addEventListener(EVT, onChange)
    return () => {
      window.removeEventListener('popstate', onChange)
      window.removeEventListener(EVT, onChange)
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
