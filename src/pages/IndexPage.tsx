import { useDocMeta } from '../lib/hooks'
import { byType } from '../lib/content'
import type { EntryType } from '../lib/types'
import EntryCard from '../components/EntryCard'
import styles from './IndexPage.module.css'

interface Props { type: EntryType; title: string; blurb: string }

export default function IndexPage({ type, title, blurb }: Props) {
  useDocMeta(`${title} — Harry Stanyer`, blurb)
  const entries = byType(type)

  return (
    <div className="container">
      <header className={styles.head}>
        <p className="eyebrow">Index · {String(entries.length).padStart(2, '0')} entries</p>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.blurb}>{blurb}</p>
      </header>

      {entries.length ? (
        <div className={styles.grid}>
          {entries.map((e, i) => (
            <EntryCard key={e.slug} entry={e} index={i} />
          ))}
        </div>
      ) : (
        <p className={styles.empty}>Nothing published here yet — check back soon.</p>
      )}
    </div>
  )
}
