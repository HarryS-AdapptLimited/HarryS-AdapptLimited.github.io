import { useDocMeta } from '../lib/hooks'
import type { Entry as EntryT } from '../lib/types'
import PhotoEssay from '../templates/PhotoEssay'
import Gallery from '../templates/Gallery'
import Video from '../templates/Video'
import Article from '../templates/Article'
import ToolCaseStudy from '../templates/ToolCaseStudy'

export default function Entry({ entry }: { entry: EntryT }) {
  useDocMeta(`${entry.title} — Harry Stanyer`, entry.excerpt)

  switch (entry.template) {
    case 'photo-essay':
      return <PhotoEssay entry={entry} />
    case 'gallery':
      return <Gallery entry={entry} />
    case 'video':
      return <Video entry={entry} />
    case 'tool':
      return <ToolCaseStudy entry={entry} />
    case 'article':
    default:
      return <Article entry={entry} />
  }
}
