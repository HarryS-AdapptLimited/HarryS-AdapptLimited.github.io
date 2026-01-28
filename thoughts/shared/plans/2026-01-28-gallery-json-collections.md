# Gallery JSON Collections Implementation Plan

## Overview

Transform the gallery page from a markdown-rendered page into a custom JSON-driven photo gallery with:
- Collections view: Scrollable list of collections showing first image + name/description
- Image viewer: Single image display with metadata and arrow navigation
- Grid view: Full collection displayed as a grid of thumbnails

## Current State Analysis

- Router (`js/router.js:170-205`) loads posts by ID, fetches markdown, and renders via `marked.parse()`
- Gallery is currently defined in `posts.json` with `id: "gallery"` pointing to `posts/gallery.md`
- Post content renders into `#postContent` within `.post-view`
- Lazy loading already implemented for images via `processImages()` function

### Key Discoveries:
- `loadPostContent()` at `router.js:171` is the entry point for loading post data
- `postMeta.file` determines what content is fetched
- The router already handles transitions, back button, and URL state

## Desired End State

1. Navigating to `?id=gallery` loads a custom gallery interface (not markdown)
2. Gallery reads from `gallery.json` containing collections with images
3. Three view modes:
   - **Collections View**: Vertical scroll, each collection shows cover image on left, name/description on right
   - **Image Viewer**: Single image with description/location/date below, left/right arrows for navigation, loops through collection
   - **Grid View**: Button in top-right toggles to grid layout showing all images in current collection
4. Smooth fade transitions between views
5. Images lazy load with existing fade-in effect

### Verification:
- Navigate to gallery, see collections list
- Click collection, see first image with metadata and navigation arrows
- Use arrows to cycle through images (loops at ends)
- Click grid button to see all images in grid
- Click image in grid to return to single view at that image
- Back button returns to collections view, then to homepage

## What We're NOT Doing

- Video support (images only for now)
- Image upload/editing functionality
- Lightbox/fullscreen mode
- Image zoom/pan
- Keyboard navigation (can be added later)
- Collection reordering/management UI

## Implementation Approach

Modify the router to detect `id=gallery` and call a dedicated Gallery module instead of loading markdown. The Gallery module handles all three views and manages its own state.

---

## Phase 1: Data Structure & Gallery JSON

### Overview
Create the gallery.json data structure with sample collections.

### Changes Required:

#### 1.1 Create gallery.json

**File**: `gallery.json`
**Changes**: New file with collections structure

```json
{
    "collections": [
        {
            "id": "collection-slug",
            "name": "Collection Name",
            "description": "Description of this collection",
            "images": [
                {
                    "url": "https://cloudflare-url.com/image1.jpg",
                    "description": "Image description",
                    "location": "Location name",
                    "date": "2024-01-15"
                },
                {
                    "url": "https://cloudflare-url.com/image2.jpg",
                    "description": "Another image",
                    "location": "Another location",
                    "date": "2024-01-16"
                }
            ]
        }
    ]
}
```

### Success Criteria:

#### Automated Verification:
- [x] JSON is valid: `python3 -m json.tool gallery.json`

#### Manual Verification:
- [ ] Structure makes sense for intended use

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the structure is acceptable before proceeding to the next phase.

---

## Phase 2: Gallery JavaScript Module

### Overview
Create the Gallery module that handles loading data, rendering views, and managing state.

### Changes Required:

#### 2.1 Create Gallery Module

**File**: `js/gallery.js`
**Changes**: New file with Gallery IIFE module

```javascript
/**
 * Gallery Module for Stanyer.space
 * Handles photo collections with three views: collections, viewer, grid
 */

const Gallery = (function() {
    'use strict';

    let galleryData = null;
    let currentCollection = null;
    let currentImageIndex = 0;
    let currentView = 'collections'; // 'collections' | 'viewer' | 'grid'

    const TRANSITION_DURATION = 300;

    // DOM references (set during render)
    let container = null;

    // Load gallery data
    async function loadData() {
        if (galleryData) return galleryData;

        try {
            const response = await fetch('gallery.json');
            if (!response.ok) throw new Error('Failed to load gallery data');
            galleryData = await response.json();
            return galleryData;
        } catch (error) {
            console.error('Error loading gallery:', error);
            throw error;
        }
    }

    // Main render function - called by router
    async function render(containerElement) {
        container = containerElement;

        try {
            await loadData();
            renderCollectionsView();
        } catch (error) {
            container.innerHTML = `
                <div class="gallery-error">
                    <h2>Failed to load gallery</h2>
                    <p>Please try again later.</p>
                </div>
            `;
        }
    }

    // Render collections list view
    function renderCollectionsView() {
        currentView = 'collections';
        currentCollection = null;

        let html = '<div class="gallery-collections">';

        galleryData.collections.forEach(collection => {
            const coverImage = collection.images[0];
            html += `
                <div class="gallery-collection-item" data-collection-id="${collection.id}">
                    <div class="collection-cover">
                        <img src="${coverImage.url}" alt="${collection.name}" loading="lazy" class="lazy-image">
                    </div>
                    <div class="collection-info">
                        <h2 class="collection-name">${collection.name}</h2>
                        <p class="collection-description">${collection.description}</p>
                        <span class="collection-count">${collection.images.length} photos</span>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;

        // Add click handlers
        container.querySelectorAll('.gallery-collection-item').forEach(item => {
            item.addEventListener('click', () => {
                const collectionId = item.dataset.collectionId;
                openCollection(collectionId);
            });
        });

        // Process lazy loading
        processGalleryImages();
    }

    // Open a collection and show first image
    function openCollection(collectionId) {
        currentCollection = galleryData.collections.find(c => c.id === collectionId);
        if (!currentCollection) return;

        currentImageIndex = 0;
        renderViewerView();
    }

    // Render single image viewer
    function renderViewerView() {
        currentView = 'viewer';
        const image = currentCollection.images[currentImageIndex];

        const html = `
            <div class="gallery-viewer">
                <button class="gallery-grid-toggle" aria-label="View grid">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="7" height="7"></rect>
                        <rect x="14" y="3" width="7" height="7"></rect>
                        <rect x="3" y="14" width="7" height="7"></rect>
                        <rect x="14" y="14" width="7" height="7"></rect>
                    </svg>
                </button>

                <button class="gallery-nav gallery-nav-prev" aria-label="Previous image">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M15 18l-6-6 6-6"></path>
                    </svg>
                </button>

                <div class="gallery-image-container">
                    <img src="${image.url}" alt="${image.description || ''}" class="gallery-main-image lazy-image">
                </div>

                <button class="gallery-nav gallery-nav-next" aria-label="Next image">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 18l6-6-6-6"></path>
                    </svg>
                </button>

                <div class="gallery-image-info">
                    <p class="gallery-image-description">${image.description || ''}</p>
                    <div class="gallery-image-meta">
                        ${image.location ? `<span class="gallery-image-location">${image.location}</span>` : ''}
                        ${image.date ? `<span class="gallery-image-date">${formatDate(image.date)}</span>` : ''}
                    </div>
                    <span class="gallery-image-counter">${currentImageIndex + 1} / ${currentCollection.images.length}</span>
                </div>
            </div>
        `;

        container.innerHTML = html;

        // Add event listeners
        container.querySelector('.gallery-nav-prev').addEventListener('click', prevImage);
        container.querySelector('.gallery-nav-next').addEventListener('click', nextImage);
        container.querySelector('.gallery-grid-toggle').addEventListener('click', renderGridView);

        // Process lazy loading
        processGalleryImages();
    }

    // Navigate to previous image (loops)
    function prevImage() {
        currentImageIndex = currentImageIndex === 0
            ? currentCollection.images.length - 1
            : currentImageIndex - 1;
        renderViewerView();
    }

    // Navigate to next image (loops)
    function nextImage() {
        currentImageIndex = currentImageIndex === currentCollection.images.length - 1
            ? 0
            : currentImageIndex + 1;
        renderViewerView();
    }

    // Render grid view of current collection
    function renderGridView() {
        currentView = 'grid';

        let html = `
            <div class="gallery-grid">
                <div class="gallery-grid-header">
                    <h2>${currentCollection.name}</h2>
                    <button class="gallery-back-to-viewer" aria-label="Back to viewer">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M19 12H5"></path>
                            <path d="M12 19l-7-7 7-7"></path>
                        </svg>
                        Back
                    </button>
                </div>
                <div class="gallery-grid-images">
        `;

        currentCollection.images.forEach((image, index) => {
            html += `
                <div class="gallery-grid-item" data-index="${index}">
                    <img src="${image.url}" alt="${image.description || ''}" loading="lazy" class="lazy-image">
                </div>
            `;
        });

        html += '</div></div>';
        container.innerHTML = html;

        // Add click handlers
        container.querySelectorAll('.gallery-grid-item').forEach(item => {
            item.addEventListener('click', () => {
                currentImageIndex = parseInt(item.dataset.index, 10);
                renderViewerView();
            });
        });

        container.querySelector('.gallery-back-to-viewer').addEventListener('click', renderViewerView);

        // Process lazy loading
        processGalleryImages();
    }

    // Format date for display
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }

    // Process images for lazy loading (reuse existing pattern)
    function processGalleryImages() {
        const images = container.querySelectorAll('img.lazy-image');

        images.forEach(img => {
            if (img.complete) {
                img.classList.add('loaded');
            } else {
                img.addEventListener('load', () => img.classList.add('loaded'));
                img.addEventListener('error', () => img.classList.add('error'));
            }
        });
    }

    // Handle back navigation (called by router)
    function handleBack() {
        if (currentView === 'grid') {
            renderViewerView();
            return true; // Handled internally
        } else if (currentView === 'viewer') {
            renderCollectionsView();
            return true; // Handled internally
        }
        return false; // Let router handle (go to homepage)
    }

    // Check if we're in a nested view
    function isInNestedView() {
        return currentView !== 'collections';
    }

    // Reset state
    function reset() {
        currentCollection = null;
        currentImageIndex = 0;
        currentView = 'collections';
    }

    return {
        render,
        handleBack,
        isInNestedView,
        reset
    };
})();
```

### Success Criteria:

#### Automated Verification:
- [x] JavaScript has no syntax errors: Load page in browser console shows no errors

#### Manual Verification:
- [ ] Module structure is correct and follows existing patterns

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation before proceeding to the next phase.

---

## Phase 3: Router Integration

### Overview
Modify the router to detect gallery ID and use the Gallery module instead of markdown rendering.

### Changes Required:

#### 3.1 Update index.html to include gallery.js

**File**: `index.html`
**Changes**: Add gallery.js script before router.js

```html
<script src="js/gallery.js"></script>
<script src="js/router.js"></script>
```

#### 3.2 Modify loadPostContent in router.js

**File**: `js/router.js`
**Changes**: Add gallery detection at the start of `loadPostContent()`

In the `loadPostContent` function, add this check at the beginning (after the loading message):

```javascript
// Load and render post content
async function loadPostContent(postId) {
    postContent.innerHTML = '<p class="loading">Loading...</p>';

    // Special handling for gallery
    if (postId === 'gallery') {
        document.title = 'Gallery - Stanyer.space';
        await Gallery.render(postContent);
        return;
    }

    try {
        // ... existing markdown loading code ...
    }
}
```

#### 3.3 Modify back button handling in router.js

**File**: `js/router.js`
**Changes**: Update `handleBackClick` to check Gallery state first

```javascript
// Handle back button click
function handleBackClick(e) {
    e.preventDefault();

    // Check if gallery handles the back action internally
    if (getPostIdFromUrl() === 'gallery' && Gallery.isInNestedView()) {
        if (Gallery.handleBack()) {
            return; // Gallery handled it
        }
    }

    navigateToHome();
}
```

#### 3.4 Reset gallery state when leaving

**File**: `js/router.js`
**Changes**: Call Gallery.reset() in `showHome()`

Add at the start of the `showHome` function:

```javascript
// Show home view with transition
async function showHome(pushState) {
    if (currentView === 'home') return;

    // Reset gallery state if we were viewing it
    if (typeof Gallery !== 'undefined') {
        Gallery.reset();
    }

    // ... rest of existing code ...
}
```

### Success Criteria:

#### Automated Verification:
- [x] No JavaScript errors in console when loading site
- [x] No JavaScript errors when navigating to gallery

#### Manual Verification:
- [ ] Clicking gallery link loads gallery (not markdown)
- [ ] Back button from collections view goes to homepage
- [ ] Back button from viewer goes to collections
- [ ] Back button from grid goes to viewer

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation before proceeding to the next phase.

---

## Phase 4: Gallery CSS Styling

### Overview
Add CSS for all three gallery views matching the site's design language.

### Changes Required:

#### 4.1 Create gallery.css

**File**: `css/gallery.css`
**Changes**: New file with all gallery styles

```css
/* ============================================
   Gallery - Collections View
   ============================================ */
.gallery-collections {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    padding: 2rem 0;
}

.gallery-collection-item {
    display: flex;
    gap: 2rem;
    cursor: pointer;
    padding: 1.5rem;
    border: var(--border-width) solid var(--border-color);
    transition: background-color 0.2s ease;
}

.gallery-collection-item:hover {
    background-color: var(--hover-bg);
}

.collection-cover {
    flex-shrink: 0;
    width: 300px;
    height: 200px;
    overflow: hidden;
}

.collection-cover img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.collection-info {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 0.5rem;
}

.collection-name {
    font-size: 1.5rem;
    font-weight: 400;
    margin: 0;
}

.collection-description {
    font-size: 1rem;
    opacity: 0.8;
    margin: 0;
    line-height: 1.5;
}

.collection-count {
    font-size: 0.875rem;
    opacity: 0.6;
}

/* ============================================
   Gallery - Image Viewer
   ============================================ */
.gallery-viewer {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-height: calc(100vh - 8rem);
    padding: 1rem;
    position: relative;
}

.gallery-grid-toggle {
    position: absolute;
    top: 0;
    right: 0;
    background: transparent;
    border: var(--border-width) solid var(--border-color);
    color: var(--text-color);
    padding: 0.5rem;
    cursor: pointer;
    transition: background-color 0.2s ease;
}

.gallery-grid-toggle:hover {
    background-color: var(--text-color);
    color: var(--bg-color);
}

.gallery-image-container {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    max-height: 70vh;
}

.gallery-main-image {
    max-width: 100%;
    max-height: 70vh;
    object-fit: contain;
    border: var(--border-width) solid var(--border-color);
}

.gallery-nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: transparent;
    border: var(--border-width) solid var(--border-color);
    color: var(--text-color);
    padding: 1rem 0.5rem;
    cursor: pointer;
    transition: background-color 0.2s ease;
}

.gallery-nav:hover {
    background-color: var(--text-color);
    color: var(--bg-color);
}

.gallery-nav-prev {
    left: 1rem;
}

.gallery-nav-next {
    right: 1rem;
}

.gallery-image-info {
    text-align: center;
    padding: 1.5rem 0;
    max-width: 600px;
}

.gallery-image-description {
    font-size: 1.1rem;
    margin: 0 0 0.75rem 0;
    line-height: 1.5;
}

.gallery-image-meta {
    display: flex;
    justify-content: center;
    gap: 1.5rem;
    margin-bottom: 0.5rem;
    opacity: 0.7;
    font-size: 0.9rem;
}

.gallery-image-location::before {
    content: '';
}

.gallery-image-date::before {
    content: '';
}

.gallery-image-counter {
    font-size: 0.875rem;
    opacity: 0.5;
}

/* ============================================
   Gallery - Grid View
   ============================================ */
.gallery-grid {
    padding: 1rem 0;
}

.gallery-grid-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: var(--border-width) solid var(--border-color);
}

.gallery-grid-header h2 {
    font-size: 1.5rem;
    font-weight: 400;
    margin: 0;
}

.gallery-back-to-viewer {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: transparent;
    border: var(--border-width) solid var(--border-color);
    color: var(--text-color);
    padding: 0.5rem 1rem;
    cursor: pointer;
    font-family: inherit;
    font-size: 0.9rem;
    transition: background-color 0.2s ease;
}

.gallery-back-to-viewer:hover {
    background-color: var(--text-color);
    color: var(--bg-color);
}

.gallery-grid-images {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
}

.gallery-grid-item {
    aspect-ratio: 1;
    overflow: hidden;
    cursor: pointer;
    border: var(--border-width) solid var(--border-color);
    transition: transform 0.2s ease, border-color 0.2s ease;
}

.gallery-grid-item:hover {
    transform: scale(1.02);
    border-color: var(--text-color);
}

.gallery-grid-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

/* ============================================
   Gallery - Lazy Loading (inherit from post)
   ============================================ */
.gallery-collections img.lazy-image,
.gallery-viewer img.lazy-image,
.gallery-grid img.lazy-image {
    opacity: 0;
    transform: translateY(10px);
    transition: opacity 0.4s ease, transform 0.4s ease;
    background-color: var(--hover-bg);
}

.gallery-collections img.lazy-image.loaded,
.gallery-viewer img.lazy-image.loaded,
.gallery-grid img.lazy-image.loaded {
    opacity: 1;
    transform: translateY(0);
}

/* ============================================
   Gallery - Error State
   ============================================ */
.gallery-error {
    text-align: center;
    padding: 3rem;
}

.gallery-error h2 {
    margin-bottom: 1rem;
}

/* ============================================
   Gallery - Mobile Responsive
   ============================================ */
@media (max-width: 768px) {
    .gallery-collection-item {
        flex-direction: column;
        gap: 1rem;
    }

    .collection-cover {
        width: 100%;
        height: 200px;
    }

    .gallery-nav {
        padding: 0.5rem;
    }

    .gallery-nav-prev {
        left: 0.5rem;
    }

    .gallery-nav-next {
        right: 0.5rem;
    }

    .gallery-image-container {
        max-height: 50vh;
    }

    .gallery-main-image {
        max-height: 50vh;
    }

    .gallery-grid-images {
        grid-template-columns: repeat(2, 1fr);
        gap: 0.5rem;
    }
}

@media (max-width: 480px) {
    .gallery-grid-header {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
    }

    .collection-cover {
        height: 150px;
    }
}
```

#### 4.2 Update index.html to include gallery.css

**File**: `index.html`
**Changes**: Add gallery.css link

```html
<link rel="stylesheet" href="css/style.css">
<link rel="stylesheet" href="css/post.css">
<link rel="stylesheet" href="css/gallery.css">
```

### Success Criteria:

#### Automated Verification:
- [x] CSS has no syntax errors (page loads without console CSS errors)

#### Manual Verification:
- [ ] Collections view displays correctly with cover image left, info right
- [ ] Viewer shows image centered with metadata below
- [ ] Navigation arrows are positioned correctly
- [ ] Grid view shows images in responsive grid
- [ ] Mobile layout works correctly
- [ ] Hover effects work on all interactive elements

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation before proceeding to the next phase.

---

## Phase 5: Cleanup & Final Testing

### Overview
Remove old gallery markdown file and verify everything works end-to-end.

### Changes Required:

#### 5.1 Remove gallery from posts.json

**File**: `posts.json`
**Changes**: Remove the gallery entry (it's now special-cased in router)

Note: Keep the gallery entry but change the file reference to indicate it's handled specially, OR remove it entirely since the router now handles it as a special case. Recommend keeping it so it still appears in search.

Actually, keep it in posts.json for searchability but the file path won't be used since router intercepts it.

#### 5.2 Delete old gallery.md

**File**: `posts/gallery.md`
**Changes**: Delete file (no longer needed)

#### 5.3 Create sample gallery.json with real structure

**File**: `gallery.json`
**Changes**: Update with at least 2 sample collections for testing

### Success Criteria:

#### Automated Verification:
- [x] Site loads without errors: Open browser console, no errors
- [x] Gallery JSON is valid: `python3 -m json.tool gallery.json`

#### Manual Verification:
- [ ] Navigate to homepage, click gallery link
- [ ] Collections view shows all collections with cover images
- [ ] Click a collection, see first image with description/location/date
- [ ] Click left arrow, loops to last image
- [ ] Click right arrow, goes to next image
- [ ] Click grid button (top right), see all images in grid
- [ ] Click image in grid, returns to viewer at that image
- [ ] Click back arrow in grid header, returns to viewer
- [ ] Press browser back button from viewer, returns to collections
- [ ] Press browser back button from collections, returns to homepage
- [ ] Search still finds gallery in results
- [ ] Mobile layout works correctly

---

## Testing Strategy

### Unit Tests:
- Not applicable (static site, no test framework)

### Integration Tests:
- Not applicable

### Manual Testing Steps:
1. Load homepage, verify gallery cell appears
2. Click gallery cell, verify collections load
3. Verify each collection shows cover image + name + description + count
4. Click a collection, verify image viewer loads
5. Verify image displays with description, location, date below
6. Click next arrow repeatedly, verify it loops
7. Click prev arrow repeatedly, verify it loops
8. Click grid button, verify grid displays
9. Click any grid image, verify viewer shows that image
10. Use back button to navigate: grid -> viewer -> collections -> home
11. Test on mobile viewport
12. Test with slow network (images should lazy load)
13. Test theme toggle (dark/light) in gallery views

## Performance Considerations

- All images use `loading="lazy"` for native lazy loading
- Images fade in when loaded (existing pattern)
- Gallery data loaded once and cached in memory
- No external dependencies beyond existing libraries

## Migration Notes

- Old `posts/gallery.md` can be deleted after deployment
- Gallery entry in `posts.json` should remain for search functionality
- Users with cached `gallery.md` will get new experience on next visit

## References

- Current router implementation: `js/router.js:170-205`
- Lazy loading pattern: `js/router.js:221-245`
- Existing CSS patterns: `css/style.css`, `css/post.css`
