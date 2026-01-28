# Stanyer.space GitHub Pages Implementation Plan

## Overview

Build a minimalist personal website hosted on GitHub Pages with a distinctive 4x4 grid homepage. The center 4 cells merge to display "Stanyer.space" branding, while the surrounding 12 cells link to blog posts written in Markdown. Features include client-side search and a responsive design that works across desktop and mobile.

## Current State Analysis

- Empty directory - fresh project
- No existing code, styles, or content
- GitHub Pages requires either Jekyll processing or static HTML files

### Key Decisions Made:
- **Technology**: Plain HTML/CSS/JS (no build process, maximum design control)
- **Markdown handling**: Client-side parsing using Marked.js
- **Search**: Modal overlay with client-side filtering
- **Mobile**: 2-column responsive grid
- **Empty cells**: Show border outline only

## Desired End State

A fully functional GitHub Pages site at `stanyer.space` (or `username.github.io`) with:

1. **Homepage** (`index.html`):
   - Off-black background (#0d0d0d)
   - 4x4 grid filling viewport (no scroll on desktop)
   - Center merged cell with site title and tagline
   - 12 surrounding cells linking to blog posts
   - Search button in top-right corner
   - Fully responsive for mobile (2-column layout)

2. **Blog system**:
   - Markdown files in `/posts/` directory
   - Each post rendered on its own page via `post.html`
   - Posts indexed in `posts.json` for search/grid population

3. **Search functionality**:
   - Modal overlay triggered by search button
   - Real-time filtering as user types
   - Results show post title and excerpt

### Verification:
- Site loads at GitHub Pages URL
- All 12 grid positions can display blog posts
- Search finds posts by title and content
- Mobile layout works correctly (2-column)
- No horizontal scroll on any device
- Markdown posts render correctly

## What We're NOT Doing

- No Jekyll or static site generator (keeping it simple)
- No server-side processing
- No comments system
- No analytics (can be added later)
- No dark/light mode toggle (single dark theme)
- No RSS feed (can be added in future phase)
- No pagination (12 posts visible at once)
- No categories/tags system

## Implementation Approach

Use CSS Grid for the 4x4 layout with `grid-template-areas` for the merged center cell. Markdown files are fetched and parsed client-side using Marked.js. A JSON manifest (`posts.json`) lists all posts for search indexing and grid population. The site requires no build step - just push HTML/CSS/JS/MD files to GitHub.

---

## Phase 1: Project Structure & Base HTML/CSS

### Overview
Set up the file structure, create the base HTML document, and implement the 4x4 grid layout with responsive CSS.

### Changes Required:

#### 1.1 Create Directory Structure

**Directories to create:**
```
/
├── index.html          # Homepage
├── post.html           # Blog post template page
├── css/
│   └── style.css       # All styles
├── js/
│   ├── main.js         # Homepage grid population
│   ├── post.js         # Blog post rendering
│   └── search.js       # Search functionality
├── posts/
│   └── (markdown files will go here)
├── posts.json          # Blog post manifest
└── .nojekyll           # Disable Jekyll processing
```

#### 1.2 Create `.nojekyll` File

**File**: `.nojekyll`
**Purpose**: Tells GitHub Pages not to process files through Jekyll

```
(empty file)
```

#### 1.3 Create Base HTML Structure

**File**: `index.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Stanyer.space</title>
    <meta name="description" content="Engineer, photographer and documentary maker.">
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <button class="search-button" id="searchButton" aria-label="Search">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="M21 21l-4.35-4.35"></path>
        </svg>
    </button>

    <main class="grid-container">
        <!-- Row 1 -->
        <a href="#" class="grid-cell" data-position="0"></a>
        <a href="#" class="grid-cell" data-position="1"></a>
        <a href="#" class="grid-cell" data-position="2"></a>
        <a href="#" class="grid-cell" data-position="3"></a>

        <!-- Row 2 -->
        <a href="#" class="grid-cell" data-position="4"></a>
        <div class="grid-cell center-cell">
            <h1>Stanyer.space</h1>
            <p>Engineer, photographer and documentary maker.</p>
        </div>
        <a href="#" class="grid-cell" data-position="5"></a>

        <!-- Row 3 -->
        <a href="#" class="grid-cell" data-position="6"></a>
        <a href="#" class="grid-cell" data-position="7"></a>

        <!-- Row 4 -->
        <a href="#" class="grid-cell" data-position="8"></a>
        <a href="#" class="grid-cell" data-position="9"></a>
        <a href="#" class="grid-cell" data-position="10"></a>
        <a href="#" class="grid-cell" data-position="11"></a>
    </main>

    <!-- Search Modal -->
    <div class="search-modal" id="searchModal" hidden>
        <div class="search-modal-content">
            <button class="search-close" id="searchClose" aria-label="Close search">&times;</button>
            <input type="text" class="search-input" id="searchInput" placeholder="Search posts..." autofocus>
            <div class="search-results" id="searchResults"></div>
        </div>
    </div>

    <script src="js/main.js"></script>
    <script src="js/search.js"></script>
</body>
</html>
```

#### 1.4 Create Core CSS

**File**: `css/style.css`

```css
/* ============================================
   CSS Variables & Reset
   ============================================ */
:root {
    --bg-color: #0d0d0d;
    --text-color: #f0f0f0;
    --border-color: #f0f0f0;
    --border-width: 1px;
    --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
}

*, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

html, body {
    height: 100%;
    overflow: hidden;
}

body {
    background-color: var(--bg-color);
    color: var(--text-color);
    font-family: var(--font-family);
}

/* ============================================
   Search Button (Top Right)
   ============================================ */
.search-button {
    position: fixed;
    top: 1rem;
    right: 1rem;
    z-index: 100;
    background: transparent;
    border: var(--border-width) solid var(--border-color);
    color: var(--text-color);
    padding: 0.5rem;
    cursor: pointer;
    transition: background-color 0.2s ease;
}

.search-button:hover,
.search-button:focus {
    background-color: var(--text-color);
    color: var(--bg-color);
}

.search-button svg {
    display: block;
}

/* ============================================
   4x4 Grid Layout
   ============================================ */
.grid-container {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-template-rows: repeat(4, 1fr);
    grid-template-areas:
        "c0 c1 c2 c3"
        "c4 center center c5"
        "c6 center center c7"
        "c8 c9 c10 c11";
    height: 100vh;
    width: 100vw;
}

.grid-cell {
    border: var(--border-width) solid var(--border-color);
    display: flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    color: var(--text-color);
    padding: 1rem;
    text-align: center;
    transition: background-color 0.2s ease;
    font-size: clamp(0.875rem, 2vw, 1rem);
}

.grid-cell:hover:not(.center-cell) {
    background-color: rgba(240, 240, 240, 0.1);
}

/* Position each cell in the grid */
.grid-cell[data-position="0"] { grid-area: c0; }
.grid-cell[data-position="1"] { grid-area: c1; }
.grid-cell[data-position="2"] { grid-area: c2; }
.grid-cell[data-position="3"] { grid-area: c3; }
.grid-cell[data-position="4"] { grid-area: c4; }
.grid-cell[data-position="5"] { grid-area: c5; }
.grid-cell[data-position="6"] { grid-area: c6; }
.grid-cell[data-position="7"] { grid-area: c7; }
.grid-cell[data-position="8"] { grid-area: c8; }
.grid-cell[data-position="9"] { grid-area: c9; }
.grid-cell[data-position="10"] { grid-area: c10; }
.grid-cell[data-position="11"] { grid-area: c11; }

/* Center merged cell (2x2) */
.center-cell {
    grid-area: center;
    flex-direction: column;
    cursor: default;
}

.center-cell h1 {
    font-size: clamp(1.5rem, 5vw, 3rem);
    font-weight: 300;
    letter-spacing: 0.1em;
    margin-bottom: 0.5rem;
}

.center-cell p {
    font-size: clamp(0.75rem, 2vw, 1rem);
    opacity: 0.8;
    font-weight: 300;
}

/* ============================================
   Search Modal
   ============================================ */
.search-modal {
    position: fixed;
    inset: 0;
    background-color: rgba(13, 13, 13, 0.95);
    z-index: 200;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: 15vh;
}

.search-modal[hidden] {
    display: none;
}

.search-modal-content {
    width: 90%;
    max-width: 600px;
    position: relative;
}

.search-close {
    position: absolute;
    top: -2rem;
    right: 0;
    background: transparent;
    border: none;
    color: var(--text-color);
    font-size: 2rem;
    cursor: pointer;
    line-height: 1;
}

.search-close:hover {
    opacity: 0.7;
}

.search-input {
    width: 100%;
    padding: 1rem;
    font-size: 1.25rem;
    background: transparent;
    border: var(--border-width) solid var(--border-color);
    color: var(--text-color);
    font-family: var(--font-family);
}

.search-input:focus {
    outline: none;
    border-color: var(--text-color);
}

.search-input::placeholder {
    color: rgba(240, 240, 240, 0.5);
}

.search-results {
    margin-top: 1rem;
    max-height: 50vh;
    overflow-y: auto;
}

.search-result-item {
    display: block;
    padding: 1rem;
    border: var(--border-width) solid var(--border-color);
    border-top: none;
    color: var(--text-color);
    text-decoration: none;
    transition: background-color 0.2s ease;
}

.search-result-item:first-child {
    border-top: var(--border-width) solid var(--border-color);
}

.search-result-item:hover {
    background-color: rgba(240, 240, 240, 0.1);
}

.search-result-item h3 {
    font-size: 1rem;
    font-weight: 500;
    margin-bottom: 0.25rem;
}

.search-result-item p {
    font-size: 0.875rem;
    opacity: 0.7;
}

.search-no-results {
    padding: 1rem;
    text-align: center;
    opacity: 0.7;
}

/* ============================================
   Mobile Responsive (2-column layout)
   ============================================ */
@media (max-width: 768px) {
    html, body {
        overflow: auto;
    }

    .grid-container {
        grid-template-columns: repeat(2, 1fr);
        grid-template-rows: auto;
        grid-template-areas:
            "center center"
            "c0 c1"
            "c2 c3"
            "c4 c5"
            "c6 c7"
            "c8 c9"
            "c10 c11";
        height: auto;
        min-height: 100vh;
    }

    .center-cell {
        padding: 3rem 1rem;
    }

    .grid-cell:not(.center-cell) {
        min-height: 120px;
    }
}

/* ============================================
   Small mobile adjustments
   ============================================ */
@media (max-width: 480px) {
    .center-cell h1 {
        font-size: 1.75rem;
    }

    .center-cell p {
        font-size: 0.875rem;
    }

    .grid-cell:not(.center-cell) {
        min-height: 100px;
        font-size: 0.875rem;
    }
}
```

### Success Criteria:

#### Automated Verification:
- [x] All files created in correct locations
- [x] HTML validates (no syntax errors)
- [x] CSS validates (no syntax errors)
- [x] `.nojekyll` file exists (empty)

#### Manual Verification:
- [ ] Open `index.html` in browser - 4x4 grid displays correctly
- [ ] Center cell shows "Stanyer.space" and tagline
- [ ] Cells have thin white borders on dark background
- [ ] No scrolling on desktop viewport
- [ ] Resize browser to mobile width - layout switches to 2 columns
- [ ] Search button visible in top right corner

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation that the grid layout displays correctly before proceeding.

---

## Phase 2: JavaScript - Grid Population & Post Manifest

### Overview
Create the JavaScript to populate the grid cells with blog post links from a JSON manifest file.

### Changes Required:

#### 2.1 Create Posts Manifest

**File**: `posts.json`

```json
{
    "posts": [
        {
            "id": "example-post",
            "title": "Example Post",
            "date": "2026-01-27",
            "excerpt": "This is an example blog post to demonstrate the system.",
            "file": "posts/example-post.md"
        }
    ]
}
```

#### 2.2 Create Main JavaScript

**File**: `js/main.js`

```javascript
/**
 * Main JavaScript for Stanyer.space homepage
 * Handles grid population from posts.json
 */

(function() {
    'use strict';

    // Fetch and populate grid with posts
    async function loadPosts() {
        try {
            const response = await fetch('posts.json');
            if (!response.ok) throw new Error('Failed to load posts');

            const data = await response.json();
            populateGrid(data.posts);
        } catch (error) {
            console.error('Error loading posts:', error);
        }
    }

    // Populate grid cells with post data
    function populateGrid(posts) {
        const cells = document.querySelectorAll('.grid-cell[data-position]');

        posts.forEach((post, index) => {
            if (index < cells.length) {
                const cell = cells[index];
                cell.href = `post.html?id=${post.id}`;
                cell.textContent = post.title;
                cell.setAttribute('data-post-id', post.id);
            }
        });

        // Leave remaining cells empty (just border visible)
        for (let i = posts.length; i < cells.length; i++) {
            cells[i].removeAttribute('href');
            cells[i].style.pointerEvents = 'none';
        }
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadPosts);
    } else {
        loadPosts();
    }
})();
```

#### 2.3 Create Example Markdown Post

**File**: `posts/example-post.md`

```markdown
# Example Post

This is an example blog post to demonstrate how the Markdown system works.

## Features

You can use all standard Markdown features:

- **Bold text** and *italic text*
- [Links](https://example.com)
- Code blocks
- Lists (like this one)

## Code Example

```javascript
function hello() {
    console.log('Hello, world!');
}
```

## Conclusion

Add your own Markdown files to the `posts/` directory and update `posts.json` to include them.
```

### Success Criteria:

#### Automated Verification:
- [x] `posts.json` is valid JSON
- [x] `js/main.js` has no syntax errors
- [x] Example markdown file exists in `posts/` directory

#### Manual Verification:
- [ ] Open `index.html` - first grid cell shows "Example Post"
- [ ] Other grid cells remain empty (border only, not clickable)
- [ ] Console shows no errors

**Implementation Note**: After completing this phase, pause for manual confirmation that posts load into the grid correctly before proceeding.

---

## Phase 3: Blog Post Page & Markdown Rendering

### Overview
Create the blog post template page that fetches and renders Markdown content using Marked.js.

### Changes Required:

#### 3.1 Create Post Template HTML

**File**: `post.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Loading... - Stanyer.space</title>
    <meta name="description" content="">
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/post.css">
</head>
<body class="post-page">
    <header class="post-header">
        <a href="index.html" class="back-link">&larr; Back</a>
        <button class="search-button" id="searchButton" aria-label="Search">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="M21 21l-4.35-4.35"></path>
            </svg>
        </button>
    </header>

    <main class="post-container">
        <article class="post-content" id="postContent">
            <p class="loading">Loading...</p>
        </article>
    </main>

    <!-- Search Modal (same as index) -->
    <div class="search-modal" id="searchModal" hidden>
        <div class="search-modal-content">
            <button class="search-close" id="searchClose" aria-label="Close search">&times;</button>
            <input type="text" class="search-input" id="searchInput" placeholder="Search posts..." autofocus>
            <div class="search-results" id="searchResults"></div>
        </div>
    </div>

    <!-- Marked.js for Markdown parsing -->
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <script src="js/post.js"></script>
    <script src="js/search.js"></script>
</body>
</html>
```

#### 3.2 Create Post-Specific Styles

**File**: `css/post.css`

```css
/* ============================================
   Post Page Layout
   ============================================ */
.post-page {
    overflow: auto;
}

.post-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background-color: var(--bg-color);
    border-bottom: var(--border-width) solid var(--border-color);
    z-index: 50;
}

.back-link {
    color: var(--text-color);
    text-decoration: none;
    font-size: 1rem;
    transition: opacity 0.2s ease;
}

.back-link:hover {
    opacity: 0.7;
}

.post-header .search-button {
    position: static;
}

/* ============================================
   Post Content Area
   ============================================ */
.post-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 6rem 1.5rem 3rem;
}

.post-content {
    line-height: 1.7;
}

.post-content .loading {
    text-align: center;
    opacity: 0.7;
}

/* ============================================
   Markdown Rendered Content
   ============================================ */
.post-content h1 {
    font-size: 2.5rem;
    font-weight: 300;
    margin-bottom: 1.5rem;
    letter-spacing: 0.02em;
}

.post-content h2 {
    font-size: 1.5rem;
    font-weight: 400;
    margin-top: 2.5rem;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: var(--border-width) solid var(--border-color);
}

.post-content h3 {
    font-size: 1.25rem;
    font-weight: 500;
    margin-top: 2rem;
    margin-bottom: 0.75rem;
}

.post-content p {
    margin-bottom: 1.25rem;
}

.post-content a {
    color: var(--text-color);
    text-decoration: underline;
    text-underline-offset: 2px;
}

.post-content a:hover {
    opacity: 0.7;
}

.post-content ul,
.post-content ol {
    margin-bottom: 1.25rem;
    padding-left: 1.5rem;
}

.post-content li {
    margin-bottom: 0.5rem;
}

.post-content blockquote {
    border-left: 3px solid var(--border-color);
    padding-left: 1rem;
    margin: 1.5rem 0;
    opacity: 0.85;
    font-style: italic;
}

.post-content code {
    font-family: 'SF Mono', 'Fira Code', monospace;
    background-color: rgba(240, 240, 240, 0.1);
    padding: 0.2em 0.4em;
    border-radius: 3px;
    font-size: 0.9em;
}

.post-content pre {
    background-color: rgba(240, 240, 240, 0.05);
    border: var(--border-width) solid var(--border-color);
    padding: 1rem;
    overflow-x: auto;
    margin: 1.5rem 0;
}

.post-content pre code {
    background: none;
    padding: 0;
}

.post-content img {
    max-width: 100%;
    height: auto;
    margin: 1.5rem 0;
    border: var(--border-width) solid var(--border-color);
}

.post-content hr {
    border: none;
    border-top: var(--border-width) solid var(--border-color);
    margin: 2rem 0;
}

/* ============================================
   Error State
   ============================================ */
.post-error {
    text-align: center;
    padding: 3rem;
}

.post-error h1 {
    margin-bottom: 1rem;
}

.post-error a {
    color: var(--text-color);
}
```

#### 3.3 Create Post JavaScript

**File**: `js/post.js`

```javascript
/**
 * Post page JavaScript for Stanyer.space
 * Fetches and renders Markdown content
 */

(function() {
    'use strict';

    // Get post ID from URL
    function getPostId() {
        const params = new URLSearchParams(window.location.search);
        return params.get('id');
    }

    // Fetch post metadata from posts.json
    async function getPostMeta(postId) {
        const response = await fetch('posts.json');
        if (!response.ok) throw new Error('Failed to load posts manifest');

        const data = await response.json();
        return data.posts.find(post => post.id === postId);
    }

    // Fetch and render markdown content
    async function loadPost() {
        const postId = getPostId();
        const contentEl = document.getElementById('postContent');

        if (!postId) {
            showError(contentEl, 'No post specified');
            return;
        }

        try {
            // Get post metadata
            const postMeta = await getPostMeta(postId);

            if (!postMeta) {
                showError(contentEl, 'Post not found');
                return;
            }

            // Update page title
            document.title = `${postMeta.title} - Stanyer.space`;

            // Fetch markdown content
            const response = await fetch(postMeta.file);
            if (!response.ok) throw new Error('Failed to load post content');

            const markdown = await response.text();

            // Render markdown to HTML
            contentEl.innerHTML = marked.parse(markdown);

        } catch (error) {
            console.error('Error loading post:', error);
            showError(contentEl, 'Failed to load post');
        }
    }

    // Show error message
    function showError(element, message) {
        element.innerHTML = `
            <div class="post-error">
                <h1>Oops!</h1>
                <p>${message}</p>
                <p><a href="index.html">Return home</a></p>
            </div>
        `;
        document.title = 'Error - Stanyer.space';
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadPost);
    } else {
        loadPost();
    }
})();
```

### Success Criteria:

#### Automated Verification:
- [x] `post.html` is valid HTML
- [x] `css/post.css` has no syntax errors
- [x] `js/post.js` has no syntax errors
- [x] Marked.js CDN URL is accessible

#### Manual Verification:
- [ ] Click "Example Post" from homepage - navigates to post.html
- [ ] Post content renders with proper formatting (headings, code, lists)
- [ ] Back link returns to homepage
- [ ] Page title shows post title
- [ ] Mobile view - content is readable and properly sized
- [ ] Invalid post ID shows error message

**Implementation Note**: After completing this phase, pause for manual confirmation that blog posts render correctly before proceeding.

---

## Phase 4: Search Functionality

### Overview
Implement the search modal with real-time filtering of posts.

### Changes Required:

#### 4.1 Create Search JavaScript

**File**: `js/search.js`

```javascript
/**
 * Search functionality for Stanyer.space
 * Client-side search with modal overlay
 */

(function() {
    'use strict';

    let posts = [];
    let searchModal, searchInput, searchResults, searchButton, searchClose;

    // Initialize search
    async function initSearch() {
        // Cache DOM elements
        searchModal = document.getElementById('searchModal');
        searchInput = document.getElementById('searchInput');
        searchResults = document.getElementById('searchResults');
        searchButton = document.getElementById('searchButton');
        searchClose = document.getElementById('searchClose');

        if (!searchModal || !searchInput || !searchResults) return;

        // Load posts data
        try {
            const response = await fetch('posts.json');
            if (response.ok) {
                const data = await response.json();
                posts = data.posts;
            }
        } catch (error) {
            console.error('Error loading posts for search:', error);
        }

        // Bind events
        searchButton?.addEventListener('click', openSearch);
        searchClose?.addEventListener('click', closeSearch);
        searchModal?.addEventListener('click', handleModalClick);
        searchInput?.addEventListener('input', handleSearch);
        document.addEventListener('keydown', handleKeydown);
    }

    // Open search modal
    function openSearch() {
        searchModal.hidden = false;
        searchInput.value = '';
        searchResults.innerHTML = '';
        searchInput.focus();
        document.body.style.overflow = 'hidden';
    }

    // Close search modal
    function closeSearch() {
        searchModal.hidden = true;
        document.body.style.overflow = '';
    }

    // Handle click outside modal content
    function handleModalClick(e) {
        if (e.target === searchModal) {
            closeSearch();
        }
    }

    // Handle keyboard events
    function handleKeydown(e) {
        // Open search with Cmd/Ctrl + K
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            if (searchModal.hidden) {
                openSearch();
            } else {
                closeSearch();
            }
        }

        // Close with Escape
        if (e.key === 'Escape' && !searchModal.hidden) {
            closeSearch();
        }
    }

    // Handle search input
    function handleSearch(e) {
        const query = e.target.value.toLowerCase().trim();

        if (!query) {
            searchResults.innerHTML = '';
            return;
        }

        // Filter posts
        const matches = posts.filter(post => {
            const titleMatch = post.title.toLowerCase().includes(query);
            const excerptMatch = post.excerpt?.toLowerCase().includes(query);
            return titleMatch || excerptMatch;
        });

        // Render results
        if (matches.length === 0) {
            searchResults.innerHTML = '<p class="search-no-results">No posts found</p>';
        } else {
            searchResults.innerHTML = matches.map(post => `
                <a href="post.html?id=${post.id}" class="search-result-item">
                    <h3>${escapeHtml(post.title)}</h3>
                    ${post.excerpt ? `<p>${escapeHtml(post.excerpt)}</p>` : ''}
                </a>
            `).join('');
        }
    }

    // Escape HTML to prevent XSS
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSearch);
    } else {
        initSearch();
    }
})();
```

### Success Criteria:

#### Automated Verification:
- [x] `js/search.js` has no syntax errors

#### Manual Verification:
- [ ] Click search button - modal opens
- [ ] Type "example" - Example Post appears in results
- [ ] Click a search result - navigates to post
- [ ] Press Escape - modal closes
- [ ] Press Cmd/Ctrl+K - modal toggles
- [ ] Click outside modal - modal closes
- [ ] Type non-matching query - "No posts found" message appears
- [ ] Search works on both homepage and post pages

**Implementation Note**: After completing this phase, pause for manual confirmation that search functions correctly before proceeding.

---

## Phase 5: GitHub Pages Deployment Setup

### Overview
Configure the repository for GitHub Pages deployment and add final polish.

### Changes Required:

#### 5.1 Initialize Git Repository

**Commands to run:**
```bash
git init
git add .
git commit -m "Initial commit: Stanyer.space website"
```

#### 5.2 Create GitHub Repository

Either:
1. Create repository named `stanyer.space` (if using custom domain)
2. Or create repository named `username.github.io` (for default GitHub Pages URL)

#### 5.3 Push to GitHub

```bash
git remote add origin git@github.com:USERNAME/REPO_NAME.git
git branch -M main
git push -u origin main
```

#### 5.4 Enable GitHub Pages

1. Go to repository Settings > Pages
2. Source: Deploy from a branch
3. Branch: main, folder: / (root)
4. Save

#### 5.5 (Optional) Configure Custom Domain

If using `stanyer.space`:

**File**: `CNAME`

```
stanyer.space
```

And configure DNS at your domain registrar:
- A record: `185.199.108.153`
- A record: `185.199.109.153`
- A record: `185.199.110.153`
- A record: `185.199.111.153`
- Or CNAME record: `username.github.io`

### Success Criteria:

#### Automated Verification:
- [x] Git repository initialized
- [x] All files committed
- [ ] Pushed to GitHub successfully

#### Manual Verification:
- [ ] GitHub Pages site is accessible at URL
- [ ] Homepage loads correctly
- [ ] Blog post links work
- [ ] Search works
- [ ] Mobile layout works
- [ ] (If using custom domain) Custom domain resolves correctly

**Implementation Note**: After completing this phase, the site should be fully deployed and accessible.

---

## Phase 6: Adding New Blog Posts (Documentation)

### Overview
Document the process for adding new blog posts.

### Process for Adding Posts:

1. **Create Markdown file** in `posts/` directory:
   - Filename: `your-post-slug.md`
   - Start with `# Title` as first line

2. **Update `posts.json`**:
   ```json
   {
       "posts": [
           {
               "id": "your-post-slug",
               "title": "Your Post Title",
               "date": "2026-01-27",
               "excerpt": "A brief description of your post.",
               "file": "posts/your-post-slug.md"
           },
           // ... existing posts
       ]
   }
   ```

3. **Commit and push**:
   ```bash
   git add posts/your-post-slug.md posts.json
   git commit -m "Add post: Your Post Title"
   git push
   ```

4. Site updates automatically within a few minutes.

---

## Testing Strategy

### Unit Tests:
- Not applicable (static site, no build process)

### Integration Tests:
- Manual browser testing across devices

### Manual Testing Steps:
1. Load homepage in Chrome, Firefox, Safari
2. Verify grid layout on desktop (1920px, 1440px, 1024px widths)
3. Verify mobile layout (iPhone SE, iPhone 14, Android)
4. Test all post links navigate correctly
5. Test search functionality with various queries
6. Test keyboard shortcuts (Cmd+K, Escape)
7. Verify no console errors on any page
8. Test with slow network (throttle in DevTools)

## Performance Considerations

- **Marked.js**: ~50KB CDN load, cached after first visit
- **No build step**: Zero server-side processing
- **Minimal CSS/JS**: Total custom code < 10KB
- **Images**: Add `loading="lazy"` to images in markdown for performance
- **Caching**: GitHub Pages provides CDN caching automatically

## Future Enhancements (Out of Scope)

- RSS feed generation
- Syntax highlighting for code blocks (Prism.js or highlight.js)
- Dark/light mode toggle
- Comments system (via Giscus or similar)
- Analytics integration
- Tags/categories
- Pagination for 12+ posts

## References

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Marked.js Documentation](https://marked.js.org/)
- [CSS Grid Guide](https://css-tricks.com/snippets/css/complete-guide-grid/)
