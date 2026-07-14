import { useDocMeta } from '../lib/hooks'
import { ENTRIES, featured, byType } from '../lib/content'
import type { Entry, EntryType } from '../lib/types'
import { home, type Block } from '../lib/home'
import Hero from '../components/home/Hero'
import {
  Marquee,
  FeatureFull,
  SplitStatement,
  Diptych,
  TripleStrip,
  PosterGrid,
  IndexList,
  Statement,
  SectionHeading,
} from '../components/home/Sections'

// resolve an entry source keyword to a list of entries
function pickEntries(source: Block['source'], limit?: number): Entry[] {
  let list: Entry[]
  if (source === 'all' || !source) list = ENTRIES
  else if (source === 'featured') list = featured().length ? featured() : ENTRIES
  else list = byType(source as EntryType)
  return typeof limit === 'number' ? list.slice(0, limit) : list
}

function renderBlock(b: Block, i: number) {
  switch (b.type) {
    case 'marquee':
      return <Marquee key={i} items={b.items ?? []} />
    case 'feature':
      return (
        <FeatureFull
          key={i}
          image={b.image ?? ''}
          kicker={b.kicker}
          title={b.title ?? ''}
          href={b.href ?? '/'}
          ratio={b.ratio}
        />
      )
    case 'grid':
      return (
        <PosterGrid
          key={i}
          entries={pickEntries(b.source, b.limit)}
          title={b.title ?? 'Selected'}
          label={b.label}
          href={b.href}
          hrefLabel={b.hrefLabel}
        />
      )
    case 'split':
      return (
        <SplitStatement
          key={i}
          heading={b.heading ?? ''}
          body={b.body}
          image={b.image ?? ''}
          imageCaption={b.imageCaption}
          href={b.href}
          reverse={b.reverse}
        />
      )
    case 'diptych':
      return b.left && b.right ? <Diptych key={i} left={b.left} right={b.right} /> : null
    case 'triple':
      return <TripleStrip key={i} images={b.images ?? []} />
    case 'index': {
      const entries = pickEntries(b.source)
      return (
        <section key={i} style={{ marginTop: 'clamp(2rem, 6vw, 4rem)' }}>
          <SectionHeading
            title={b.title ?? 'Index'}
            label={b.label ?? `Index · ${String(entries.length).padStart(2, '0')}`}
          />
          <IndexList entries={entries} />
        </section>
      )
    }
    case 'statement':
      return (
        <Statement key={i} cta={b.ctaLabel && b.ctaTo ? { to: b.ctaTo, label: b.ctaLabel } : undefined}>
          {b.text}
        </Statement>
      )
    default:
      return null
  }
}

export default function Home() {
  useDocMeta(
    'Harry Stanyer — Photographer, Engineer',
    'Photographs, films and browser-based tools by Harry Stanyer — engineer and documentary maker.',
  )

  return (
    <>
      <Hero data={home.hero} />
      {home.blocks.map(renderBlock)}
    </>
  )
}
