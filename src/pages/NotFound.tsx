import { Link } from '../lib/router'
import { useDocMeta } from '../lib/hooks'
import styles from './NotFound.module.css'

export default function NotFound() {
  useDocMeta('Not found — Harry Stanyer')
  return (
    <div className={`container ${styles.wrap}`}>
      <p className="eyebrow">Error 404</p>
      <h1 className={styles.big}>This page went off the map.</h1>
      <p className={styles.sub}>The link may be broken, or the page may have moved.</p>
      <Link to="/" className={styles.home}>← Back home</Link>
    </div>
  )
}
