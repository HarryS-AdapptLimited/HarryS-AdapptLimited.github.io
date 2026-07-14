import type { Entry, EntryImage } from '../lib/types'
import Masthead from './Masthead'
import Img from '../components/Img'
import styles from './PhotoEssay.module.css'

function Figure({ im, wide }: { im: EntryImage; wide?: boolean }) {
  return (
    <figure className={wide ? styles.wide : styles.cell}>
      <Img src={im.src} alt={im.caption ?? ''} ratio={im.ratio ?? (wide ? '3/2' : '3/4')} sizes={wide ? '100vw' : '50vw'} />
      {im.caption && <figcaption className={styles.cap}>{im.caption}</figcaption>}
    </figure>
  )
}

export default function PhotoEssay({ entry }: { entry: Entry }) {
  const images = entry.images ?? []
  // rhythm: first image wide, then pairs, occasional wide break
  const rows: EntryImage[][] = []
  for (let i = 0; i < images.length; i += 2) rows.push(images.slice(i, i + 2))

  return (
    <article className="container">
      <Masthead entry={entry} />

      {entry.cover && (
        <div className={styles.lead}>
          <Img src={entry.cover} alt={entry.title} ratio="3/2" priority sizes="100vw" />
        </div>
      )}

      {entry.html && <div className={`prose ${styles.body}`} dangerouslySetInnerHTML={{ __html: entry.html }} />}

      <div className={styles.stack}>
        {rows.map((row, ri) =>
          row.length === 1 ? (
            <Figure key={ri} im={row[0]} wide />
          ) : (
            <div key={ri} className={styles.pair}>
              <Figure im={row[0]} />
              <Figure im={row[1]} />
            </div>
          ),
        )}
      </div>
    </article>
  )
}
