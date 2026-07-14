/**
 * Scaffold a new content entry with correct frontmatter.
 *   npm run new-entry
 */
import { createInterface } from 'node:readline/promises'
import { writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'content', 'entries')

if (!process.stdin.isTTY) {
  console.error('Run this in an interactive terminal:  npm run new-entry')
  process.exit(1)
}
const rl = createInterface({ input: process.stdin, output: process.stdout })

const slugify = (s) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

const TEMPLATES = {
  1: { type: 'creative', template: 'photo-essay', label: 'Photo essay' },
  2: { type: 'creative', template: 'gallery', label: 'Gallery' },
  3: { type: 'creative', template: 'video', label: 'Video / film' },
  4: { type: 'writing', template: 'article', label: 'Article' },
  5: { type: 'tool', template: 'tool', label: 'Tool case-study' },
}

function frontmatter(d) {
  const lines = [
    '---',
    `title: ${d.title}`,
    `slug: ${d.slug}`,
    `date: ${d.date}`,
    `type: ${d.type}`,
    `template: ${d.template}`,
    'featured: false',
    'draft: true',
    `excerpt: ${d.excerpt || 'One-line standfirst.'}`,
  ]
  if (d.type === 'creative') lines.push('location: ')
  lines.push('cover: /photos/REPLACE.jpg')
  if (d.template === 'photo-essay' || d.template === 'gallery') {
    lines.push('images:', '  - { src: /photos/REPLACE.jpg, caption: "" }')
  }
  if (d.template === 'video') lines.push('video: https://media.harrystanyer.com/REPLACE.mp4')
  if (d.template === 'tool') {
    lines.push('launch: /tools/REPLACE/', 'source: https://github.com/HarryS-AdapptLimited/REPLACE', 'tech: [TypeScript, React, Vite]')
  }
  lines.push('---', '', 'Write the body here in Markdown.', '')
  return lines.join('\n')
}

const today = new Date().toISOString().slice(0, 10)

const title = await rl.question('Title: ')
console.log('\nTemplate:\n' + Object.entries(TEMPLATES).map(([k, v]) => `  ${k}) ${v.label}`).join('\n'))
const choice = await rl.question('Choose 1-5: ')
const pick = TEMPLATES[choice.trim()]
if (!pick) { console.error('Invalid choice.'); rl.close(); process.exit(1) }
const excerpt = await rl.question('Excerpt (optional): ')
rl.close()

const slug = slugify(title)
const file = join(DIR, `${slug}.md`)
if (existsSync(file)) { console.error(`\n✗ ${slug}.md already exists.`); process.exit(1) }

writeFileSync(file, frontmatter({ title, slug, date: today, excerpt, ...pick }))
console.log(`\n✓ Created src/content/entries/${slug}.md  (${pick.label})`)
console.log('  It is marked draft:true — flip to false when ready to publish.')
console.log('  Add images to public/photos and run `npm run optimize`.')
