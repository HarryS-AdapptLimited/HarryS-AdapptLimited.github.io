import { Link } from '../lib/router'
import { TEMPLATE_LABEL, TYPE_LABEL, type Entry } from '../lib/types'
import styles from './Masthead.module.css'

export function formatDate(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''))
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}

const backHref: Record<Entry['type'], string> = {
  creative: '/work',
  writing: '/',
  tool: '/tools',
}

export default function Masthead({ entry, align = 'left' }: { entry: Entry; align?: 'left' | 'center' }) {
  return (
    <header className={`${styles.head} ${align === 'center' ? styles.center : ''}`}>
      <Link to={backHref[entry.type]} className={styles.back}>← {TYPE_LABEL[entry.type]}</Link>
      <p className="eyebrow">
        {TEMPLATE_LABEL[entry.template]}
        {entry.location ? ` · ${entry.location}` : ''}
        {entry.date ? ` · ${formatDate(entry.date)}` : ''}
      </p>
      <h1 className={styles.title}>{entry.title}</h1>
      {entry.excerpt && <p className={styles.lead}>{entry.excerpt}</p>}
    </header>
  )
}
