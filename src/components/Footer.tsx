import { Link } from '../lib/router'
import styles from './Footer.module.css'

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.col}>
          <span className={styles.wordmark}>Harry Stanyer</span>
          <p className={styles.tag}>Photographs, films &amp; browser-based tools.</p>
        </div>
        <nav className={styles.links} aria-label="Footer">
          <Link to="/work">Work</Link>
          <Link to="/tools">Tools</Link>
          <Link to="/cv">CV</Link>
        </nav>
        <nav className={styles.links} aria-label="Elsewhere">
          <a href="https://www.linkedin.com/in/HarryStanyer" target="_blank" rel="noopener noreferrer">LinkedIn</a>
          <a href="https://github.com/HarryS-AdapptLimited" target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href="mailto:stanyerharry@gmail.com">Email</a>
        </nav>
        <span className={styles.copy}>© {year}</span>
      </div>
    </footer>
  )
}
