import type { Entry } from '../lib/types'
import Masthead from './Masthead'
import Img from '../components/Img'
import styles from './Article.module.css'

export default function Article({ entry }: { entry: Entry }) {
  return (
    <article className="container">
      <div className={styles.col}>
        <Masthead entry={entry} align="center" />
      </div>
      {entry.cover && (
        <div className={styles.cover}>
          <Img src={entry.cover} alt={entry.title} ratio="16/9" priority sizes="100vw" />
        </div>
      )}
      <div className={styles.col}>
        <div className="prose" dangerouslySetInnerHTML={{ __html: entry.html }} />
      </div>
    </article>
  )
}
