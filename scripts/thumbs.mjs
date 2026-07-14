/**
 * Generate small thumbnails for the photo wall.
 *   npm run thumbs
 *
 * Mirrors public/photos/** into public/photos/thumbs/** at 480px wide, so the
 * infinite wall loads tiny images (fast on mobile) while full-res is used only
 * for the focused view. Safe to re-run (skips unchanged by size check).
 */
import sharp from 'sharp'
import { readdirSync, mkdirSync, statSync, existsSync } from 'node:fs'
import { join, dirname, extname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = join(ROOT, 'public', 'photos')
const THUMBS = join(SRC, 'thumbs')
const WIDTH = 480
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

let made = 0
for (const file of walk(SRC)) {
  const rel = relative(SRC, file)
  const out = join(THUMBS, rel).replace(/\.(png|jpeg)$/i, '.jpg')
  if (existsSync(out) && statSync(out).mtimeMs >= statSync(file).mtimeMs) continue
  mkdirSync(dirname(out), { recursive: true })
  await sharp(file).rotate().resize({ width: WIDTH, withoutEnlargement: true }).jpeg({ quality: 70, mozjpeg: true }).toFile(out)
  made++
}
console.log(made ? `✓ Generated ${made} thumbnail(s) in public/photos/thumbs.` : '✓ Thumbnails already up to date.')
