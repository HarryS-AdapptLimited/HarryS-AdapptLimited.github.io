import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { resolve, extname } from 'node:path'

// GitHub Pages can't set HTTP headers, so we declare a Content-Security-Policy
// via <meta> — but only in the production build, since Vite's dev server needs
// inline scripts / eval for HMR. frame-ancestors and X-Content-Type-Options
// still require a real header (add at an edge proxy such as Cloudflare later).
const CSP = [
  "default-src 'self'",
  "img-src 'self' data: https://media.harrystanyer.com",
  "media-src 'self' https://media.harrystanyer.com",
  "font-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self'",
  "connect-src 'self' https://media.harrystanyer.com",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-src 'self'",
].join('; ')

function cspPlugin(): Plugin {
  return {
    name: 'inject-csp',
    apply: 'build',
    transformIndexHtml() {
      return [
        {
          tag: 'meta',
          attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP },
          injectTo: 'head-prepend',
        },
      ]
    },
  }
}

// In the dev server, a directory request like `/tools/prism/` falls through to
// the SPA history-fallback (→ 404 page). This middleware serves the embedded
// Prism build from `public/` instead, matching production static hosting.
function embeddedAppsDevPlugin(): Plugin {
  const PREFIX = '/tools/prism'
  return {
    name: 'serve-embedded-apps',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url ?? '').split('?')[0]
        if (url === PREFIX) {
          res.statusCode = 301
          res.setHeader('Location', PREFIX + '/')
          res.end()
          return
        }
        if (url === PREFIX + '/') {
          res.setHeader('Content-Type', 'text/html')
          res.end(readFileSync(resolve('public/tools/prism/index.html')))
          return
        }
        next()
      })
    },
  }
}

// Serve the local Decap CMS at /admin in dev only (from `cms/`, never shipped).
function cmsDevPlugin(): Plugin {
  const TYPES: Record<string, string> = {
    '.html': 'text/html',
    '.yml': 'text/yaml',
    '.yaml': 'text/yaml',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.map': 'application/json',
    '.svg': 'image/svg+xml',
  }
  return {
    name: 'serve-cms',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url ?? '').split('?')[0]
        if (url !== '/admin' && !url.startsWith('/admin/')) return next()
        // `/admin` (no trailing slash) makes the page's relative asset URLs
        // resolve against `/` (e.g. /vendor/decap-cms.js), which we don't serve —
        // the bundle 404s and the page renders blank. Redirect to `/admin/`.
        if (url === '/admin') {
          res.statusCode = 301
          res.setHeader('Location', '/admin/')
          return res.end()
        }
        let rel = url.slice('/admin'.length)
        if (rel === '' || rel === '/') rel = '/index.html'
        try {
          const buf = readFileSync(resolve('cms' + rel))
          res.setHeader('Content-Type', TYPES[extname(rel)] ?? 'application/octet-stream')
          res.end(buf)
        } catch {
          next()
        }
      })
    },
  }
}

// harrystanyer.com is served from the domain root on GitHub Pages.
export default defineConfig({
  base: '/',
  plugins: [react(), cspPlugin(), embeddedAppsDevPlugin(), cmsDevPlugin()],
  server: { port: Number(process.env.PORT) || 5173 },
  build: { outDir: 'dist', assetsInlineLimit: 2048 },
})
