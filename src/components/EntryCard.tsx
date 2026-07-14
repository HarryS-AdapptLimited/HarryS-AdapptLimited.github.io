import { Link } from '../lib/router'
import Img from './Img'
import { TEMPLATE_LABEL, type Entry } from '../lib/types'
import styles from './EntryCard.module.css'

export default function EntryCard({ entry, index }: { entry: Entry; index?: number }) {
  return (
    <Link to={`/${entry.slug}`} className={styles.card}>
      <div className={styles.frame}>
        {typeof index === 'number' && (
          <span className={styles.num}>{String(index + 1).padStart(2, '0')}</span>
        )}
        {entry.cover ? (
          <Img src={entry.cover} alt={entry.title} ratio="3/4" sizes="(max-width: 720px) 50vw, 25vw" />
        ) : (
          <div className={styles.placeholder} aria-hidden="true" />
        )}
      </div>
      <div className={styles.cap}>
        <span className={styles.title}>{entry.title}</span>
        <span className={styles.kind}>{TEMPLATE_LABEL[entry.template]}</span>
      </div>
      {entry.location && <span className={styles.loc}>{entry.location}</span>}
    </Link>
  )
}
