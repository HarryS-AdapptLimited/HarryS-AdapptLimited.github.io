/**
 * Write src/lib/photo-ratios.json — a map of every photo's real aspect ratio
 * ("/photos/x.jpg" → "W/H"), read from the actual (orientation-corrected) files.
 * The wall and galleries use this so a tile's box always matches its image,
 * regardless of what (if anything) a content file declares.
 *   npm run manifest   (also run by build)
 */
import sharp from 'sharp'
import { readdirSync, writeFileSync } from 'node:fs'
import { join, dirname, extname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIR = join(ROOT, 'public', 'photos')
const OUT = join(ROOT, 'src', 'lib', 'photo-ratios.json')
const SKIP = new Set(['thumbs', 'tools'])

function walk(dir) {
  const out = []
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || SKIP.has(e.name)) continue
    const p = join(dir, e.name)
    if (e.isDirectory()) out.push(...walk(p))
    else if (['.jpg', '.jpeg', '.png'].includes(extname(e.name).toLowerCase())) out.push(p)
  }
  return out
}

const map = {}
for (const file of walk(DIR)) {
  const meta = await sharp(file).rotate().metadata()
  if (meta.width && meta.height) {
    map['/photos/' + relative(DIR, file).split('\\').join('/')] = `${meta.width}/${meta.height}`
  }
}
writeFileSync(OUT, JSON.stringify(map, null, 0) + '\n')
console.log(`✓ Wrote ${Object.keys(map).length} ratios to src/lib/photo-ratios.json`)
