import type { Entry } from '../lib/types'
import Masthead from './Masthead'
import styles from './Video.module.css'

export default function Video({ entry }: { entry: Entry }) {
  return (
    <article className="container">
      <Masthead entry={entry} />

      {entry.video ? (
        <div className={styles.player}>
          <video
            controls
            playsInline
            preload="metadata"
            poster={entry.poster ?? entry.cover}
            className={styles.video}
          >
            <source src={entry.video} />
            Your browser doesn't support embedded video.
          </video>
        </div>
      ) : (
        <p className={styles.missing}>Video coming soon.</p>
      )}

      {entry.html && (
        <div className={styles.meta}>
          <div className="prose" dangerouslySetInnerHTML={{ __html: entry.html }} />
        </div>
      )}
    </article>
  )
}
