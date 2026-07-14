import type { Entry } from '../lib/types'
import Masthead from './Masthead'
import Img from '../components/Img'
import styles from './ToolCaseStudy.module.css'

export default function ToolCaseStudy({ entry }: { entry: Entry }) {
  return (
    <article className="container">
      <Masthead entry={entry} />

      <div className={styles.actions}>
        {entry.launch && (
          <a className={styles.launch} href={entry.launch}>
            Launch {entry.title.split('—')[0].trim()} <span aria-hidden="true">↗</span>
          </a>
        )}
        {entry.source && (
          <a className={styles.source} href={entry.source} target="_blank" rel="noopener noreferrer">
            Source ↗
          </a>
        )}
      </div>

      {entry.tech && entry.tech.length > 0 && (
        <ul className={styles.stack} aria-label="Built with">
          {entry.tech.map((t) => (
            <li key={t} className={styles.chip}>{t}</li>
          ))}
        </ul>
      )}

      {entry.cover && (
        <div className={styles.shot}>
          <Img src={entry.cover} alt={`${entry.title} screenshot`} ratio="16/10" priority sizes="100vw" />
        </div>
      )}

      <div className={styles.bodyWrap}>
        <div className="prose" dangerouslySetInnerHTML={{ __html: entry.html }} />
      </div>

      {entry.images && entry.images.length > 0 && (
        <div className={styles.gallery}>
          {entry.images.map((im) => (
            <figure key={im.src} className={styles.figure}>
              <Img src={im.src} alt={im.caption ?? entry.title} ratio={im.ratio ?? '16/10'} sizes="(max-width: 720px) 100vw, 50vw" />
              {im.caption && <figcaption className={styles.cap}>{im.caption}</figcaption>}
            </figure>
          ))}
        </div>
      )}

      {entry.launch && (
        <div className={styles.footerCta}>
          <a className={styles.launch} href={entry.launch}>Open the tool <span aria-hidden="true">↗</span></a>
        </div>
      )}
    </article>
  )
}
