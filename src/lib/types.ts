export type EntryType = 'creative' | 'tool' | 'writing'
export type Template = 'photo-essay' | 'gallery' | 'video' | 'article' | 'tool'

export interface EntryImage {
  src: string
  caption?: string
  /** aspect ratio "w/h"; defaults to 3/4 (portrait) when omitted */
  ratio?: string
}

export interface Entry {
  slug: string
  title: string
  date: string            // ISO yyyy-mm-dd
  type: EntryType
  template: Template
  excerpt?: string
  cover?: string
  location?: string
  tags?: string[]
  images?: EntryImage[]
  video?: string          // mp4/webm URL for video template
  poster?: string         // video poster frame
  launch?: string         // live URL for tool template
  source?: string         // source repo URL for tool template
  tech?: string[]         // tech stack for tool template
  featured?: boolean
  /** rendered HTML body (from markdown) */
  html: string
}

export const TYPE_LABEL: Record<EntryType, string> = {
  creative: 'Work',
  tool: 'Tools',
  writing: 'Writing',
}

export const TEMPLATE_LABEL: Record<Template, string> = {
  'photo-essay': 'Photo essay',
  gallery: 'Gallery',
  video: 'Film',
  article: 'Essay',
  tool: 'Tool',
}
