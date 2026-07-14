/**
 * Lightweight prerenderer.
 *
 * The site is a client-rendered SPA, but crawlers and social-card scrapers read
 * static HTML. This writes a per-route `index.html` into `dist/` with the correct
 * <title>, meta description and Open Graph tags injected into the built shell, so
 * every URL is individually indexable and shareable. The SPA still hydrates and
 * renders the body on load.
 *
 * No headless browser required — metadata is derived directly from the content
 * markdown, which keeps CI fast and deterministic.
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import yaml from 'js-yaml'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = join(ROOT, 'dist')
const ENTRIES_DIR = join(ROOT, 'src', 'content', 'entries')
const ORIGIN = 'https://harrystanyer.com'
const SITE = 'Harry Stanyer'

const template = readFileSync(join(DIST, 'index.html'), 'utf8')

function frontmatter(raw) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(raw)
  return m ? yaml.load(m[1]) ?? {} : {}
}

// Collect entry metadata straight from the markdown sources.
const entries = readdirSync(ENTRIES_DIR)
  .filter((f) => f.endsWith('.md'))
  .map((f) => ({ slug: f.replace(/\.md$/, ''), ...frontmatter(readFileSync(join(ENTRIES_DIR, f), 'utf8')) }))
  .filter((e) => !e.draft)

const abs = (p) => (p?.startsWith('http') ? p : ORIGIN + (p?.startsWith('/') ? p : '/' + (p ?? '')))

const routes = [
  { path: '/work', title: `Work — ${SITE}`, desc: 'Photographs and films from the road.' },
  { path: '/photos', title: `Photographs — ${SITE}`, desc: 'Every photograph, in one endless wall.' },
  { path: '/tools', title: `Tools — ${SITE}`, desc: 'Software I make between trips — mostly things that run in a browser.' },
  { path: '/cv', title: `CV — ${SITE}`, desc: 'Curriculum vitae of Harry Stanyer — Technical Lead, engineer and documentary maker.' },
  ...entries.map((e) => ({
    path: `/${e.slug}`,
    title: `${e.title} — ${SITE}`,
    desc: e.excerpt ?? '',
    image: e.cover ? abs(e.cover) : `${ORIGIN}/photos/me.png`,
  })),
]

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

function render(route) {
  const image = route.image ?? `${ORIGIN}/photos/me.png`
  const url = ORIGIN + route.path
  let html = template
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(route.title)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${esc(route.desc)}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(route.title)}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${esc(route.desc)}$2`)
    .replace(/(<meta property="og:image" content=")[^"]*(")/, `$1${esc(image)}$2`)
  // add canonical + og:url if not present
  if (!html.includes('og:url')) {
    html = html.replace('</title>', `</title>\n    <link rel="canonical" href="${url}" />\n    <meta property="og:url" content="${url}" />`)
  }
  const outDir = join(DIST, route.path)
  mkdirSync(outDir, { recursive: true })
  writeFileSync(join(outDir, 'index.html'), html)
  return route.path
}

const written = routes.map(render)

// sitemap.xml — home + every prerendered route
const urls = ['/', ...routes.map((r) => r.path)]
const sitemap =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map((u) => `  <url><loc>${ORIGIN}${u}</loc></url>`).join('\n') +
  `\n</urlset>\n`
writeFileSync(join(DIST, 'sitemap.xml'), sitemap)

console.log(`Prerendered ${written.length} routes + sitemap:\n  ${written.join('\n  ')}`)
