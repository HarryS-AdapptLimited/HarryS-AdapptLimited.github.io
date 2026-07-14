---
title: Prism — a design-effects studio
slug: prism
date: 2026-07-05
type: tool
template: tool
featured: true
excerpt: A fast, private design-effects studio that runs entirely in your
  browser. Load an image, video or GIF, stack effects, add animated text, and
  export — nothing ever leaves your machine.
cover: /photos/prism-cover.svg
launch: /tools/prism/
source: https://github.com/HarryS-AdapptLimited/vis
tech:
  - TypeScript
  - React
  - Vite
  - Canvas / WebGL
  - mediabunny
  - gifenc
---
## What it is

**Prism** is a design-effects studio that runs entirely in the browser. Load an image, video or GIF
(or start from blank), stack effects like fluted glass, dithering, halftone and glitch, add animated
text, and export a PNG, GIF or WebM. Everything is computed on-device — nothing is ever uploaded.

## How it's built

The whole thing is client-side TypeScript + React on Vite. Effects are small, self-registering
modules, so a new one is a single file — the architecture is designed so the effect library can keep
growing without touching the core. Video and GIF encoding run in-browser via `mediabunny` and
`gifenc`; nothing touches a server, which is the point.
