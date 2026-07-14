import { srcSet, primarySrc } from '../lib/img'
import styles from './Img.module.css'

interface Props {
  src: string
  alt: string
  /** CSS aspect-ratio, e.g. "3/4". If omitted the frame hugs the loaded image. */
  ratio?: string
  sizes?: string
  priority?: boolean
  className?: string
}

export default function Img({ src, alt, ratio, sizes = '100vw', priority, className }: Props) {
  return (
    <div
      className={`${styles.frame} ${className ?? ''}`}
      style={ratio ? { aspectRatio: ratio } : undefined}
    >
      <img
        src={primarySrc(src)}
        srcSet={srcSet(src)}
        sizes={sizes}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        // @ts-expect-error fetchpriority is valid HTML but not yet in React types
        fetchpriority={priority ? 'high' : undefined}
        decoding="async"
      />
    </div>
  )
}
