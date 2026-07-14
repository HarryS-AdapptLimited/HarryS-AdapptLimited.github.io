/**
 * Import trip photos into per-trip galleries.
 *   npm run import-trips [sourceDir]     (default: ~/Documents/Pics/favs)
 *
 * For each <sourceDir>/<trip> folder it:
 *   - auto-orients every photo (bakes EXIF orientation into pixels — fixes
 *     landscape shots that would otherwise display rotated),
 *   - resizes to max 1800px wide and compresses to public/photos/trips/<trip>,
 *   - records each photo's real aspect ratio,
 *   - writes a gallery entry (src/content/entries/<trip>.md) with no body text.
 *
 * Re-runnable: it clears and rebuilds public/photos/trips.
 */
import sharp from 'sharp'
import { readdirSync, mkdirSync, rmSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'
import { tmpdir } from 'node:os'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = process.argv[2] || join(process.env.HOME, 'Documents', 'Pics', 'favs')
const PHOTOS_OUT = join(ROOT, 'public', 'photos') // flat — filenames are prefixed with the trip
const ENTRIES = join(ROOT, 'src', 'content', 'entries')
const MAX_W = 1800
const DATE = '2026-07-14'
const NAMES = { kohtao: 'Koh Tao', southkorea: 'South Korea' }
const pretty = (t) => NAMES[t] ?? t.charAt(0).toUpperCase() + t.slice(1)
const isImage = (f) => /\.(jpe?g|png|heic)$/i.test(f)

if (!existsSync(SRC)) {
  console.error(`Source not found: ${SRC}`)
  process.exit(1)
}

// .rotate() auto-orients from EXIF, baking rotation into pixels. Some HEICs
// exceed sharp/libheif's reference-count security limit, so fall back to sips.
async function encode(srcPath, outPath) {
  const run = (input) =>
    sharp(input).rotate().resize({ width: MAX_W, withoutEnlargement: true }).jpeg({ quality: 78, mozjpeg: true }).toFile(outPath)
  try {
    return await run(srcPath)
  } catch {
    const tmp = join(tmpdir(), `import-${process.pid}-${Math.floor(Math.random() * 1e9)}.jpg`)
    execSync(`sips -s format jpeg ${JSON.stringify(srcPath)} --out ${JSON.stringify(tmp)}`, { stdio: 'ignore' })
    const info = await run(tmp)
    rmSync(tmp, { force: true })
    return info
  }
}

mkdirSync(PHOTOS_OUT, { recursive: true })

const trips = readdirSync(SRC, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort()

for (const trip of trips) {
  const files = readdirSync(join(SRC, trip)).filter(isImage).sort()
  if (!files.length) continue
  // clear this trip's existing flat files (handles a shrunk photo count) without touching others
  for (const f of readdirSync(PHOTOS_OUT)) {
    if (f.startsWith(`${trip}-`) && /\.jpg$/i.test(f)) rmSync(join(PHOTOS_OUT, f), { force: true })
  }

  const images = []
  let n = 1
  for (const f of files) {
    const outName = `${trip}-${String(n).padStart(2, '0')}.jpg`
    const info = await encode(join(SRC, trip, f), join(PHOTOS_OUT, outName))
    images.push({ src: `/photos/${outName}`, ratio: `${info.width}/${info.height}` })
    n++
  }

  const title = pretty(trip)
  const imgLines = images.map((im) => `  - { src: ${im.src}, ratio: "${im.ratio}" }`).join('\n')
  const md = `---\ntitle: ${title}\nslug: ${trip}\ndate: ${DATE}\ntype: creative\ntemplate: gallery\nfeatured: false\ncover: ${images[0].src}\nimages:\n${imgLines}\n---\n`
  writeFileSync(join(ENTRIES, `${trip}.md`), md)
  console.log(`${trip}.md — ${images.length} photos`)
}
console.log('\n✓ Trips imported (auto-oriented, resized, gallery entries written).')
