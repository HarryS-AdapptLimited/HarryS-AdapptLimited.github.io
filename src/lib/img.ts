/**
 * Responsive image helpers.
 *
 * Photography is ideally served from the existing Cloudflare image CDN
 * (`media.harrystanyer.com/cdn-cgi/image/...`), which resizes on the fly.
 * For those URLs we emit a real `srcset`. Local `/photos/*` files (used in
 * development / for images not yet on the CDN) are served as-is.
 */
const CDN_HOST = 'media.harrystanyer.com'
const WIDTHS = [480, 768, 1080, 1600, 2000]

function isCdn(src: string): boolean {
  return src.includes(CDN_HOST)
}

/** Build a Cloudflare image-resizing URL for a given width. */
function cdnVariant(src: string, width: number): string {
  // src like https://media.harrystanyer.com/<path> OR already-transformed URL
  try {
    const u = new URL(src)
    // strip any existing /cdn-cgi/image/... prefix to avoid double-transform
    const path = u.pathname.replace(/^\/cdn-cgi\/image\/[^/]+\//, '/')
    return `${u.origin}/cdn-cgi/image/width=${width},quality=78,format=auto${path}`
  } catch {
    return src
  }
}

export function srcSet(src: string): string | undefined {
  if (!isCdn(src)) return undefined
  return WIDTHS.map((w) => `${cdnVariant(src, w)} ${w}w`).join(', ')
}

export function primarySrc(src: string): string {
  return isCdn(src) ? cdnVariant(src, 1600) : src
}
