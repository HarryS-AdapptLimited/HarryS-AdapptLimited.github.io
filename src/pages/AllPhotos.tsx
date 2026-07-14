import { useEffect, useRef, useState, useCallback } from 'react'
import { Link } from '../lib/router'
import { useDocMeta } from '../lib/hooks'
import { formatDate } from '../templates/Masthead'
import { ALL_PHOTOS, type WallPhoto } from '../lib/photos'
import styles from './AllPhotos.module.css'

const GAP = 10

// A fixed shuffled permutation of all photo indices. Selecting consecutive
// entries gives distinct photos; each row is offset by ROW_STEP so vertical /
// diagonal neighbours never coincide, and the horizontal repeat sits off-screen.
const N_PHOTOS = ALL_PHOTOS.length
const ROW_STEP = 17
const PERM = (() => {
  const a = Array.from({ length: N_PHOTOS }, (_, i) => i)
  let s = 0x9e3779b1 >>> 0
  for (let i = a.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    const j = s % (i + 1)
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
})()
const photoAt = (r: number, k: number) => PERM[(((k + r * ROW_STEP) % N_PHOTOS) + N_PHOTOS) % N_PHOTOS]

// ---- fisheye field ----
// B = how much the focal tile grows. Magnification along one axis at offset t:
//   m(t) = 1 + B·h(t),  h(t) = (1 - |t|/R)²   (0 beyond R)
// Tile scale s = 1 + B·min(hx,hy) — a point focus, and ≤ each axis magnification.
// The push along an axis is ∫₀ᵗ (s-1), evaluated with the OTHER axis fixed, so
// the spread tapers off away from centre (rows bow locally) and cells still tile.
const B = 0.42
const hAxis = (t: number, R: number) => {
  const a = Math.min(Math.abs(t), R)
  return (1 - a / R) ** 2
}
const pushAxis = (t: number, R: number, hFixed: number) => {
  const a = Math.min(Math.abs(t), R)
  const vs = R * (1 - Math.sqrt(hFixed)) // point where the varying axis drops below hFixed
  const I = a <= vs ? hFixed * a : hFixed * vs + (R / 3) * (Math.pow(hFixed, 1.5) - (1 - a / R) ** 3)
  return Math.sign(t) * B * I
}

export default function AllPhotos() {
  useDocMeta('Photographs — Harry Stanyer', 'Every photograph, in one endless wall.')

  const [vp, setVp] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }))
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [selected, setSelected] = useState<{ photo: WallPhoto; index: number } | null>(null)
  const [open, setOpen] = useState(false) // detail visible (drives blast + fade)
  const [closing, setClosing] = useState(false) // blast is animating shut
  const [reduceMotion] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false)

  // "lens" magnify: whichever photo is nearest the centre of the screen is the
  // biggest, tapering to normal size outward — refocuses live as you pan.
  const lens = !reduceMotion
  const focusR = Math.min(vp.w, vp.h) * 0.5 || 1

  const wallRef = useRef<HTMLDivElement>(null)
  const offsetRef = useRef({ x: 0, y: 0 })
  const rafRef = useRef(0)
  const inertiaRef = useRef(0)
  const drag = useRef({ active: false, lastX: 0, lastY: 0, vx: 0, vy: 0, moved: 0 })

  const ROW_H = vp.w < 700 ? 130 : vp.w < 1100 ? 168 : 200
  const ROW_STRIDE = ROW_H + GAP
  const PERIOD = Math.min(30, N_PHOTOS) // photos per row before the horizontal sequence repeats

  const scheduleRender = useCallback(() => {
    if (rafRef.current) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0
      setOffset({ x: offsetRef.current.x, y: offsetRef.current.y })
    })
  }, [])

  const stopInertia = () => {
    if (inertiaRef.current) cancelAnimationFrame(inertiaRef.current)
    inertiaRef.current = 0
  }

  // lock page scroll while mounted
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  // viewport tracking
  useEffect(() => {
    const onResize = () => setVp({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // non-passive wheel panning
  useEffect(() => {
    const el = wallRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (open) return
      e.preventDefault()
      stopInertia()
      offsetRef.current.x -= e.deltaX
      offsetRef.current.y -= e.deltaY
      scheduleRender()
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [open, scheduleRender])

  // Escape closes the detail view
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && open) close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => () => { stopInertia(); if (rafRef.current) cancelAnimationFrame(rafRef.current) }, [])

  // ---- pointer panning ----
  const onPointerDown = (e: React.PointerEvent) => {
    if (open) return
    stopInertia()
    drag.current = { active: true, lastX: e.clientX, lastY: e.clientY, vx: 0, vy: 0, moved: 0 }
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current.active) return
    const dx = e.clientX - drag.current.lastX
    const dy = e.clientY - drag.current.lastY
    drag.current.lastX = e.clientX
    drag.current.lastY = e.clientY
    drag.current.vx = dx
    drag.current.vy = dy
    drag.current.moved += Math.abs(dx) + Math.abs(dy)
    offsetRef.current.x += dx
    offsetRef.current.y += dy
    scheduleRender()
  }
  const onPointerUp = () => {
    if (!drag.current.active) return
    drag.current.active = false
    const { vx, vy } = drag.current
    if (Math.hypot(vx, vy) > 3) {
      let cvx = vx, cvy = vy
      const step = () => {
        cvx *= 0.94; cvy *= 0.94
        offsetRef.current.x += cvx
        offsetRef.current.y += cvy
        // update state directly in this rAF (no second scheduled frame → no stutter)
        setOffset({ x: offsetRef.current.x, y: offsetRef.current.y })
        if (Math.hypot(cvx, cvy) > 0.25) inertiaRef.current = requestAnimationFrame(step)
      }
      inertiaRef.current = requestAnimationFrame(step)
    }
  }

  const selectPhoto = (photo: WallPhoto, index: number) => {
    if (drag.current.moved > 6) return // it was a pan, not a tap
    stopInertia()
    setClosing(false)
    setSelected({ photo, index })
    // one tick later so the detail mounts closed, then transitions open (rAF can be paused)
    window.setTimeout(() => setOpen(true), 20)
  }
  const close = () => {
    setOpen(false)
    setClosing(true) // keep the transform transition on so tiles animate back
    window.setTimeout(() => { setSelected(null); setClosing(false) }, 550)
  }

  // ---- visible tiles: fixed-height rows, natural widths, infinite in both axes ----
  // MARGIN over-renders past the edges so fisheye-displaced tiles still cover the rim
  const MARGIN = lens ? 180 : 20
  const tiles = []
  const r0 = Math.floor((-offset.y - MARGIN) / ROW_STRIDE) - 1
  const r1 = Math.floor((-offset.y + vp.h + MARGIN) / ROW_STRIDE) + 1

  for (let r = r0; r <= r1; r++) {
    const screenY = r * ROW_STRIDE + offset.y
    if (screenY > vp.h + MARGIN || screenY + ROW_H < -MARGIN) continue

    // this row's repeating photo sequence + cumulative widths (period)
    const seq: { photo: (typeof ALL_PHOTOS)[number]; index: number; w: number }[] = []
    const cum = [0]
    for (let k = 0; k < PERIOD; k++) {
      const index = photoAt(r, k)
      const photo = ALL_PHOTOS[index]
      const ar = Math.min(2.4, Math.max(0.55, photo.ratio)) // clamp extremes for layout sanity
      const w = Math.round(ROW_H * ar)
      seq.push({ photo, index, w })
      cum.push(cum[k] + w + GAP)
    }
    const P = cum[PERIOD] // period width incl. trailing gap

    const leftWorld = -offset.x
    const startPeriod = Math.floor((leftWorld - MARGIN) / P)
    for (let pi = startPeriod; ; pi++) {
      const screenBase = pi * P + offset.x
      if (screenBase > vp.w + MARGIN) break
      for (let k = 0; k < PERIOD; k++) {
        const screenX = screenBase + cum[k]
        const { photo, index, w } = seq[k]
        if (screenX > vp.w + MARGIN) break
        if (screenX + w < -MARGIN) continue
        const bx = screenX + w / 2 - vp.w / 2
        const by = screenY + ROW_H / 2 - vp.h / 2
        // Fisheye: point-focus scale + per-axis integral push (rows bow locally,
        // spread tapers away from centre, cells still tile → no overlap).
        let px = 0, py = 0, s = 1, z = 1
        if (lens) {
          const Rx = focusR * 1.2
          const Ry = focusR
          const hx = hAxis(bx, Rx)
          const hy = hAxis(by, Ry)
          s = 1 + B * Math.min(hx, hy)
          px = pushAxis(bx, Rx, hy) // horizontal push, vertical proximity fixed
          py = pushAxis(by, Ry, hx) // vertical push, horizontal proximity fixed
          z = Math.round(s * 1000)
        }
        // Position + fisheye are one GPU transform (sub-pixel smooth, no reflow).
        const browseT = `translate3d(${(screenX + px).toFixed(2)}px, ${(screenY + py).toFixed(2)}px, 0) scale(${s.toFixed(3)})`
        const blastT = `translate3d(${(screenX + bx * 1.9).toFixed(1)}px, ${(screenY + by * 1.9).toFixed(1)}px, 0) scale(0.45)`
        tiles.push(
          <button
            key={`${r}:${pi}:${k}`}
            className={styles.tile}
            style={{
              left: 0,
              top: 0,
              width: w,
              height: ROW_H,
              transform: open ? blastT : browseT,
              opacity: open ? 0 : 1,
              zIndex: open ? undefined : z,
              // transition ONLY while the blast opens/closes; panning is transition-free
              // (instant transform tracking) so slow movement doesn't stutter
              transition: open || closing ? 'transform 0.55s cubic-bezier(0.2,0.7,0.2,1), opacity 0.5s ease' : 'none',
            }}
            onClick={() => selectPhoto(photo, index)}
            tabIndex={-1}
            aria-label={`Photograph from ${photo.title}`}
          >
            <img src={photo.thumb} alt="" draggable={false} loading="lazy" decoding="async"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = photo.src }} />
          </button>,
        )
      }
    }
  }

  const sel = selected

  return (
    <div className={styles.page}>
      <div
        ref={wallRef}
        className={`${styles.wall} ${open ? styles.wallBlasted : ''}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {tiles}
      </div>


      {sel && (
        <div className={`${styles.detail} ${open ? styles.detailOpen : ''}`} onClick={close}>
          <figure className={styles.detailFig}>
            <img className={styles.detailImg} src={sel.photo.src} alt={`Photograph from ${sel.photo.title}`} />
            <figcaption className={styles.meta}>
              <span className={styles.metaLine}>
                {[sel.photo.location || sel.photo.title, formatDate(sel.photo.date)].filter(Boolean).join(' · ')}
                {`  ·  ${String(sel.index + 1).padStart(2, '0')} / ${String(N_PHOTOS).padStart(2, '0')}`}
              </span>
              <h2 className={styles.metaTitle}>{sel.photo.title}</h2>
              <Link to={`/${sel.photo.slug}`} className={styles.metaLink} onClick={(e) => e.stopPropagation()}>
                View {sel.photo.title} gallery →
              </Link>
            </figcaption>
          </figure>
        </div>
      )}
    </div>
  )
}
