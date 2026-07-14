import yaml from 'js-yaml'
import { marked } from 'marked'
import type { Entry, EntryImage } from './types'
import ratios from './photo-ratios.json'

const RATIOS = ratios as Record<string, string>

marked.setOptions({ gfm: true, breaks: false })

// prefer the real file ratio over anything hand-declared, so tiles never crop wrong
function withRealRatios(images?: EntryImage[]): EntryImage[] | undefined {
  if (!images) return undefined
  return images.map((im) => ({ ...im, ratio: RATIOS[im.src] ?? im.ratio }))
}

/** Split `---` YAML frontmatter from the markdown body. */
function parseFrontmatter(raw: string): { data: Record<string, unknown>; body: string } {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw)
  if (!match) return { data: {}, body: raw }
  const data = (yaml.load(match[1]) as Record<string, unknown>) ?? {}
  return { data, body: match[2] }
}

// Eagerly import every entry's markdown as a raw string at build time.
const files = import.meta.glob('../content/entries/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

function build(): Entry[] {
  const entries: Entry[] = []
  for (const [path, raw] of Object.entries(files)) {
    const slug = path.split('/').pop()!.replace(/\.md$/, '')
    const { data, body } = parseFrontmatter(raw)
    if (data.draft) continue
    entries.push({
      slug,
      title: String(data.title ?? slug),
      date: String(data.date ?? ''),
      type: (data.type as Entry['type']) ?? 'writing',
      template: (data.template as Entry['template']) ?? 'article',
      excerpt: data.excerpt ? String(data.excerpt) : undefined,
      cover: data.cover ? String(data.cover) : undefined,
      location: data.location ? String(data.location) : undefined,
      tags: (data.tags as string[]) ?? undefined,
      images: withRealRatios(data.images as EntryImage[] | undefined),
      video: data.video ? String(data.video) : undefined,
      poster: data.poster ? String(data.poster) : undefined,
      launch: data.launch ? String(data.launch) : undefined,
      source: data.source ? String(data.source) : undefined,
      tech: (data.tech as string[]) ?? undefined,
      featured: Boolean(data.featured),
      html: marked.parse(body.trim()) as string,
    })
  }
  // newest first
  return entries.sort((a, b) => (a.date < b.date ? 1 : -1))
}

export const ENTRIES: Entry[] = build()

export const getEntry = (slug: string) => ENTRIES.find((e) => e.slug === slug)
export const byType = (type: Entry['type']) => ENTRIES.filter((e) => e.type === type)
export const featured = () => ENTRIES.filter((e) => e.featured)
