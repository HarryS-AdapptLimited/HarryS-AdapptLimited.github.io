import { useState } from 'react'
import type { Entry } from '../lib/types'
import Masthead from './Masthead'
import Img from '../components/Img'
import Lightbox from '../components/Lightbox'
import styles from './Gallery.module.css'

export default function Gallery({ entry }: { entry: Entry }) {
  const images = entry.images ?? []
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div className="container">
      <Masthead entry={entry} />
      {entry.html && <div className={`prose ${styles.intro}`} dangerouslySetInnerHTML={{ __html: entry.html }} />}

      <div className={styles.grid}>
        {images.map((im, i) => {
          // aspect ratio drives each cell's width within a shared-height row,
          // so landscape frames are naturally ~2× the width of portrait ones
          const [w, h] = (im.ratio ?? '3/4').split('/').map(Number)
          const ar = w && h ? w / h : 1
          return (
            <button
              key={im.src}
              className={styles.cell}
              style={{ ['--ar' as string]: ar }}
              onClick={() => setOpen(i)}
              aria-label={`View image ${i + 1}${im.caption ? `: ${im.caption}` : ''}`}
            >
              <Img src={im.src} alt={im.caption ?? entry.title} sizes="(max-width: 720px) 50vw, 40vw" />
            </button>
          )
        })}
      </div>

      {open !== null && (
        <Lightbox images={images} index={open} onClose={() => setOpen(null)} onIndex={setOpen} />
      )}
    </div>
  )
}
