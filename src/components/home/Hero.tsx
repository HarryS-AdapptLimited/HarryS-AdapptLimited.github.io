import { Link } from '../../lib/router'
import type { HeroData } from '../../lib/home'
import styles from './Hero.module.css'

export default function Hero({ data }: { data: HeroData }) {
  const [first, ...rest] = data.title.trim().split(/\s+/)
  return (
    <section className={styles.wrap} aria-label="Introduction">
      <div className={styles.hero}>
        <img
          className={styles.bg}
          src={data.image}
          alt={`${data.title} — cover`}
          decoding="async"
        />
        <div className={styles.scrim} aria-hidden="true" />

        <div className={styles.content}>
          <h1 className={styles.masthead}>
            <span>{first}</span>
            {rest.length > 0 && <span>{rest.join(' ')}</span>}
          </h1>
          {data.subhead && <p className={styles.subhead}>{data.subhead}</p>}
          <div className={styles.cta}>
            {data.primaryCta && (
              <Link to={data.primaryCta.to} className={styles.ctaLink}>{data.primaryCta.label} →</Link>
            )}
            {data.secondaryCta && (
              <Link to={data.secondaryCta.to} className={styles.ctaLink}>{data.secondaryCta.label} →</Link>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
