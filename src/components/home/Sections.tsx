import type { ReactNode } from 'react'
import { Link } from '../../lib/router'
import Img from '../Img'
import EntryCard from '../EntryCard'
import { TEMPLATE_LABEL, type Entry } from '../../lib/types'
import s from './Sections.module.css'

/* ---------- Small labelled section heading / divider ---------- */
export function SectionHeading({ title, label, href, hrefLabel = 'View all →' }: {
  title: string; label?: string; href?: string; hrefLabel?: string
}) {
  return (
    <div className={`container ${s.headingRow}`}>
      <div>
        {label && <p className="eyebrow">{label}</p>}
        <h2 className={s.h2}>{title}</h2>
      </div>
      {href && <Link to={href} className={s.seeAll}>{hrefLabel}</Link>}
    </div>
  )
}

/* ---------- Scrolling word marquee ---------- */
export function Marquee({ items }: { items: string[] }) {
  const row = [...items, ...items]
  return (
    <section className={s.marquee} aria-hidden="true">
      <div className={s.marqueeTrack}>
        {row.map((it, i) => (
          <span key={i} className={s.marqueeItem}>{it}<i className={s.dot}>◆</i></span>
        ))}
      </div>
    </section>
  )
}

/* ---------- Full-bleed feature image with overlaid title ---------- */
export function FeatureFull({ image, title, kicker, href, ratio = '21/9' }: {
  image: string; title: string; kicker?: string; href: string; ratio?: string
}) {
  return (
    <section className={s.feature}>
      <Link to={href} className={s.featureLink}>
        <div className={s.featureImg}>
          <Img src={image} alt={title} ratio={ratio} sizes="100vw" />
          <div className={s.featureScrim} aria-hidden="true" />
          <div className={s.featureOverlay}>
            <div className={`container ${s.featureCaption}`}>
              {kicker && <span className={s.featureKicker}>{kicker}</span>}
              <h3 className={s.featureTitle}>{title}</h3>
              <span className={s.featureCue}>View →</span>
            </div>
          </div>
        </div>
      </Link>
    </section>
  )
}

/* ---------- Split: big statement text beside an image ---------- */
export function SplitStatement({ heading, body, image, imageCaption, href, reverse }: {
  heading: ReactNode; body?: string; image: string; imageCaption?: string; href?: string; reverse?: boolean
}) {
  const media = (
    <figure className={s.splitFig}>
      <Img src={image} alt={imageCaption ?? ''} ratio="4/5" sizes="(max-width:720px) 100vw, 45vw" />
      {imageCaption && <figcaption className={s.cap}>{imageCaption}</figcaption>}
    </figure>
  )
  const text = (
    <div className={s.splitText}>
      <h3 className={s.splitHeading}>{heading}</h3>
      {body && <p className={s.splitBody}>{body}</p>}
      {href && <Link to={href} className={s.textLink}>More →</Link>}
    </div>
  )
  return (
    <section className={`container ${s.split} ${reverse ? s.splitReverse : ''}`}>
      {reverse ? <>{media}{text}</> : <>{text}{media}</>}
    </section>
  )
}

/* ---------- Diptych: two portraits side by side ---------- */
export function Diptych({ left, right }: {
  left: { src: string; caption?: string; href?: string }
  right: { src: string; caption?: string; href?: string }
}) {
  const Cell = ({ src, caption, href }: { src: string; caption?: string; href?: string }) => {
    const inner = (
      <figure className={s.diptychFig}>
        <Img src={src} alt={caption ?? ''} ratio="3/4" sizes="(max-width:720px) 100vw, 50vw" />
        {caption && <figcaption className={s.cap}>{caption}</figcaption>}
      </figure>
    )
    return href ? <Link to={href} className={s.diptychLink}>{inner}</Link> : inner
  }
  return (
    <section className={`container ${s.diptych}`}>
      <Cell {...left} />
      <Cell {...right} />
    </section>
  )
}

/* ---------- Triple strip: three images, mixed emphasis ---------- */
export function TripleStrip({ images }: { images: { src: string; caption?: string; ratio?: string }[] }) {
  return (
    <section className={`container ${s.triple}`}>
      {images.slice(0, 3).map((im, i) => (
        <figure key={i} className={s.tripleFig}>
          <Img src={im.src} alt={im.caption ?? ''} ratio={im.ratio ?? '3/4'} sizes="(max-width:720px) 100vw, 33vw" />
          {im.caption && <figcaption className={s.cap}>{im.caption}</figcaption>}
        </figure>
      ))}
    </section>
  )
}

/* ---------- Poster grid of entry cards ---------- */
export function PosterGrid({ entries, title, label, href, hrefLabel }: {
  entries: Entry[]; title: string; label?: string; href?: string; hrefLabel?: string
}) {
  return (
    <section className={s.posterSection}>
      <SectionHeading title={title} label={label} href={href} hrefLabel={hrefLabel} />
      <div className="container">
        <div className={s.posterGrid}>
          {entries.map((e, i) => (
            <EntryCard key={e.slug} entry={e} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- Editorial numbered index of entries ---------- */
export function IndexList({ entries }: { entries: Entry[] }) {
  return (
    <section className={`container ${s.index}`}>
      {entries.map((e, i) => (
        <Link key={e.slug} to={`/${e.slug}`} className={s.indexRow}>
          <span className={s.indexNum}>{String(i + 1).padStart(2, '0')}</span>
          <span className={s.indexTitle}>{e.title}</span>
          <span className={s.indexKind}>{TEMPLATE_LABEL[e.template]}</span>
          <span className={s.indexArrow}>→</span>
        </Link>
      ))}
    </section>
  )
}

/* ---------- Big centred statement / manifesto ---------- */
export function Statement({ children, cta }: { children: ReactNode; cta?: { to: string; label: string } }) {
  return (
    <section className={`container ${s.statement}`}>
      <p className={s.statementText}>{children}</p>
      {cta && <Link to={cta.to} className={s.statementCta}>{cta.label} →</Link>}
    </section>
  )
}
