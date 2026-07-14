import data from '../content/home.json'

export interface Cta { label: string; to: string }

export interface HeroData {
  image: string
  title: string
  subhead: string
  primaryCta?: Cta
  secondaryCta?: Cta
}

export interface ImageRef { src: string; caption?: string; href?: string; ratio?: string }

/** A homepage block. `type` selects which layout component renders it. */
export interface Block {
  type: 'marquee' | 'feature' | 'split' | 'diptych' | 'triple' | 'grid' | 'index' | 'statement'
  // marquee
  items?: string[]
  // feature
  image?: string
  kicker?: string
  title?: string
  href?: string
  ratio?: string
  // grid / index headings
  label?: string
  hrefLabel?: string
  source?: 'featured' | 'all' | 'creative' | 'writing' | 'tool'
  limit?: number
  // split
  heading?: string
  body?: string
  imageCaption?: string
  reverse?: boolean
  // diptych
  left?: ImageRef
  right?: ImageRef
  // triple
  images?: ImageRef[]
  // statement
  text?: string
  ctaLabel?: string
  ctaTo?: string
}

export interface HomeContent {
  hero: HeroData
  blocks: Block[]
}

export const home = data as HomeContent
