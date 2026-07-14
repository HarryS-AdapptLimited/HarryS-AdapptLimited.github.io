/**
 * Compress/resize oversized images in public/photos in place.
 *   npm run optimize
 *
 * Skips images already within budget so it's safe to re-run. JPEGs are
 * recompressed; PNGs keep transparency (e.g. the me.png cutout).
 */
import sharp from 'sharp'
import { readdirSync, statSync, writeFileSync } from 'node:fs'
import { join, dirname, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'photos')
const MAX_W = 1800
const MAX_BYTES = 800 * 1024

const kb = (n) => `${Math.round(n / 1024)}KB`

// recursively collect image files under public/photos (incl. trip subfolders)
function walk(dir) {
  const out = []
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue
    const p = join(dir, e.name)
    if (e.isDirectory()) out.push(...walk(p))
    else if (['.jpg', '.jpeg', '.png'].includes(extname(e.name).toLowerCase())) out.push(p)
  }
  return out
}

let changed = 0
for (const file of walk(DIR)) {
  const ext = extname(file).toLowerCase()
  const name = file.slice(DIR.length + 1)
  const bytes = statSync(file).size
  const meta = await sharp(file).metadata()
  const width = meta.width ?? 0

  // Only touch images that are over-wide, or JPEGs that are BOTH over-wide-or-huge.
  // Once an image is ≤ MAX_W it's left alone, so re-runs never recompress (which
  // would slowly degrade quality). Genuinely huge in-budget-width files still get
  // one pass. PNG cutouts (alpha) are only ever resized, never palette-quantised.
  const isPng = ext === '.png'
  const overWide = width > MAX_W
  const needs = overWide || (!isPng && bytes > MAX_BYTES * 3)
  if (!needs) continue

  // .rotate() bakes EXIF orientation into pixels so landscape shots don't display rotated
  const pipeline = sharp(file).rotate().resize({ width: MAX_W, withoutEnlargement: true })
  const out = isPng
    ? await pipeline.png({ compressionLevel: 9, effort: 8 }).toBuffer()
    : await pipeline.jpeg({ quality: 78, mozjpeg: true }).toBuffer()
  writeFileSync(file, out)
  console.log(`  ${name}  ${kb(bytes)} → ${kb(out.length)}  (${width}px → ${Math.min(width, MAX_W)}px)`)
  changed++
}
console.log(changed ? `\n✓ Optimized ${changed} image(s).` : '✓ Nothing to optimize — all images within budget.')
