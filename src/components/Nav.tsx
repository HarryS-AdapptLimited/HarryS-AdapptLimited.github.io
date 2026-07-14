import { useEffect, useState } from 'react'
import { Link, useRoute } from '../lib/router'
import styles from './Nav.module.css'

const LINKS = [
  { to: '/', label: 'Home' },
  { to: '/work', label: 'Work' },
  { to: '/photos', label: 'Photos' },
  { to: '/tools', label: 'Tools' },
  { to: '/cv', label: 'CV' },
]

export default function Nav() {
  const path = useRoute()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => { setOpen(false) }, [path])

  // collapse the word to just the icon once the page is scrolled
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const isActive = (to: string) =>
    to === '/' ? path === '/' : path === to || path.startsWith(to)

  // the photo wall locks page scroll, so collapse the word there by default too
  const onPhotos = path.replace(/\/+$/, '') === '/photos'
  const collapsed = (scrolled || onPhotos) && !open

  return (
    <>
      <button
        className={`${styles.burger} ${open ? styles.burgerOpen : ''} ${collapsed ? styles.collapsed : ''}`}
        aria-expanded={open}
        aria-controls="site-menu"
        aria-label={open ? 'Close menu' : 'Open menu'}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={styles.bars} aria-hidden="true"><i /><i /></span>
        <span className={styles.burgerText}>{open ? 'Close' : 'Menu'}</span>
      </button>

      {open && (
        <div id="site-menu" className={styles.overlay} role="dialog" aria-modal="true" aria-label="Menu">
          <nav className={styles.nav} aria-label="Primary">
            {LINKS.map((l, i) => (
              <Link
                key={l.to}
                to={l.to}
                className={`${styles.link} ${isActive(l.to) ? styles.active : ''}`}
                style={{ ['--i' as string]: i }}
              >
                <span className={styles.num}>{String(i + 1).padStart(2, '0')}</span>
                <span className={styles.label}>{l.label}</span>
              </Link>
            ))}
          </nav>
          <div className={styles.meta}>
            <span>Harry Stanyer</span>
            <div className={styles.social}>
              <a href="https://www.linkedin.com/in/HarryStanyer" target="_blank" rel="noopener noreferrer">LinkedIn</a>
              <a href="https://github.com/HarryS-AdapptLimited" target="_blank" rel="noopener noreferrer">GitHub</a>
              <a href="mailto:stanyerharry@gmail.com">Email</a>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
