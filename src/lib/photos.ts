import { ENTRIES } from './content'
import ratios from './photo-ratios.json'

const RATIOS = ratios as Record<string, string>

export interface WallPhoto {
  src: string        // full-res, for the focused view
  thumb: string      // small thumbnail, for the wall tiles
  ratio: number      // width / height (from the real file)
  title: string      // parent entry title (trip)
  location?: string
  date: string
  slug: string       // parent entry slug (for "view gallery" link)
}

const thumbOf = (src: string) => src.replace('/photos/', '/photos/thumbs/').replace(/\.(png|jpeg)$/i, '.jpg')

export function ratioOf(src: string, declared?: string): number {
  const r = RATIOS[src] ?? declared
  if (!r) return 1
  const [w, h] = r.split('/').map(Number)
  return w && h ? w / h : 1
}

// Every image across all gallery / photo-essay entries — deduped by src.
const seen = new Set<string>()
export const ALL_PHOTOS: WallPhoto[] = ENTRIES.flatMap((e) =>
  (e.images ?? []).flatMap((im) => {
    if (seen.has(im.src)) return []
    seen.add(im.src)
    return [{
      src: im.src,
      thumb: thumbOf(im.src),
      ratio: ratioOf(im.src, im.ratio),
      title: e.title,
      location: e.location,
      date: e.date,
      slug: e.slug,
    }]
  }),
)
