import { useEffect, useCallback } from 'react'
import { primarySrc, srcSet } from '../lib/img'
import type { EntryImage } from '../lib/types'
import styles from './Lightbox.module.css'

interface Props {
  images: EntryImage[]
  index: number
  onClose: () => void
  onIndex: (i: number) => void
}

export default function Lightbox({ images, index, onClose, onIndex }: Props) {
  const prev = useCallback(() => onIndex((index - 1 + images.length) % images.length), [index, images.length, onIndex])
  const next = useCallback(() => onIndex((index + 1) % images.length), [index, images.length, onIndex])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose, prev, next])

  // basic swipe
  let startX = 0
  const onStart = (e: React.TouchEvent) => { startX = e.touches[0].clientX }
  const onEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - startX
    if (dx > 50) prev()
    else if (dx < -50) next()
  }

  const img = images[index]

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Image viewer" onClick={onClose}>
      <button className={styles.close} onClick={onClose} aria-label="Close (Esc)">Close ✕</button>
      <button className={`${styles.nav} ${styles.prev}`} onClick={(e) => { e.stopPropagation(); prev() }} aria-label="Previous">←</button>
      <figure className={styles.figure} onClick={(e) => e.stopPropagation()} onTouchStart={onStart} onTouchEnd={onEnd}>
        <img src={primarySrc(img.src)} srcSet={srcSet(img.src)} sizes="90vw" alt={img.caption ?? ''} />
        <figcaption className={styles.caption}>
          <span>{img.caption}</span>
          <span className={styles.count}>{String(index + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}</span>
        </figcaption>
      </figure>
      <button className={`${styles.nav} ${styles.next}`} onClick={(e) => { e.stopPropagation(); next() }} aria-label="Next">→</button>
    </div>
  )
}
