/**
 * Gallery Module for Stanyer.space
 * Handles photo/video collections with three views: collections, viewer, grid
 */

const Gallery = (function() {
    'use strict';

    let galleryData = null;
    let currentCollection = null;
    let currentImageIndex = 0;
    let currentView = 'collections'; // 'collections' | 'viewer' | 'grid'

    const TRANSITION_DURATION = 300;
    const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.ogg', '.mov'];

    // Check if a media item is a video
    function isVideo(item) {
        if (item.type === 'video') return true;
        const url = item.url.toLowerCase();
        return VIDEO_EXTENSIONS.some(ext => url.includes(ext));
    }

    // Check if a video is a YouTube embed
    function isYouTube(item) {
        if (!isVideo(item)) return false;
        const url = item.url.toLowerCase();
        return url.includes('youtube.com') || url.includes('youtu.be');
    }

    // Extract YouTube video ID from various URL formats
    function getYouTubeId(url) {
        // Handle embed URLs: youtube.com/embed/VIDEO_ID
        let match = url.match(/youtube\.com\/embed\/([^?&]+)/);
        if (match) return match[1];

        // Handle watch URLs: youtube.com/watch?v=VIDEO_ID
        match = url.match(/youtube\.com\/watch\?v=([^&]+)/);
        if (match) return match[1];

        // Handle short URLs: youtu.be/VIDEO_ID
        match = url.match(/youtu\.be\/([^?&]+)/);
        if (match) return match[1];

        return null;
    }

    // Get YouTube thumbnail URL
    function getYouTubeThumbnail(url) {
        const videoId = getYouTubeId(url);
        if (videoId) {
            return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        }
        return '';
    }

    // Get thumbnail URL for an item (use thumbnail property or fall back to url for images)
    function getThumbnail(item) {
        if (item.thumbnail) return item.thumbnail;
        if (isYouTube(item)) return getYouTubeThumbnail(item.url);
        if (isVideo(item)) return item.thumbnail || '';
        return item.url;
    }

    // DOM references (set during render)
    let container = null;

    // Load gallery data
    async function loadData() {
        if (galleryData) return galleryData;

        try {
            const response = await fetch('/gallery.json');
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

    // Count media types in a collection
    function getMediaCount(collection) {
        const videos = collection.images.filter(isVideo).length;
        const photos = collection.images.length - videos;
        const parts = [];
        if (photos > 0) parts.push(`${photos} photo${photos !== 1 ? 's' : ''}`);
        if (videos > 0) parts.push(`${videos} video${videos !== 1 ? 's' : ''}`);
        return parts.join(', ');
    }

    // Render collections list view
    function renderCollectionsView() {
        currentView = 'collections';
        currentCollection = null;

        let html = '<div class="gallery-collections">';

        galleryData.collections.forEach(collection => {
            const coverItem = collection.images[0];
            const thumbnailUrl = getThumbnail(coverItem);
            const isVideoItem = isVideo(coverItem);

            html += `
                <div class="gallery-collection-item" data-collection-id="${collection.id}">
                    <div class="collection-cover${isVideoItem ? ' is-video' : ''}">
                        ${thumbnailUrl
                            ? `<img src="${thumbnailUrl}" alt="${collection.name}" loading="lazy" class="lazy-image">`
                            : `<div class="collection-cover-placeholder">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                </svg>
                               </div>`
                        }
                        ${isVideoItem ? `<div class="video-indicator">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polygon points="5 3 19 12 5 21 5 3"></polygon>
                            </svg>
                        </div>` : ''}
                    </div>
                    <div class="collection-info">
                        <h2 class="collection-name">${collection.name}</h2>
                        <p class="collection-description">${collection.description}</p>
                        <span class="collection-count">${getMediaCount(collection)}</span>
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

    // Render single image/video viewer
    function renderViewerView() {
        currentView = 'viewer';
        const item = currentCollection.images[currentImageIndex];
        const isVideoItem = isVideo(item);
        const isYouTubeItem = isYouTube(item);

        // Render media element (image, video, or YouTube embed)
        let mediaHtml;
        if (isYouTubeItem) {
            const videoId = getYouTubeId(item.url);
            mediaHtml = `
                <iframe
                    class="gallery-youtube-embed"
                    src="https://www.youtube.com/embed/${videoId}?rel=0"
                    frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen
                ></iframe>
            `;
        } else if (isVideoItem) {
            mediaHtml = `
                <video
                    src="${item.url}"
                    class="gallery-main-video"
                    controls
                    playsinline
                    ${item.poster ? `poster="${item.poster}"` : ''}
                >
                    Your browser does not support the video tag.
                </video>
            `;
        } else {
            mediaHtml = `<img src="${item.url}" alt="${item.description || ''}" class="gallery-main-image lazy-image">`;
        }

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

                <button class="gallery-nav gallery-nav-prev" aria-label="Previous">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M15 18l-6-6 6-6"></path>
                    </svg>
                </button>

                <button class="gallery-nav gallery-nav-next" aria-label="Next">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 18l6-6-6-6"></path>
                    </svg>
                </button>

                <div class="gallery-viewer-main">
                    <div class="gallery-media-container">
                        ${mediaHtml}
                    </div>

                    <div class="gallery-image-info">
                        <p class="gallery-image-description">${item.description || ''}</p>
                        <div class="gallery-image-meta">
                            ${item.location ? `<span class="gallery-image-location">${item.location}</span>` : ''}
                            ${item.date ? `<span class="gallery-image-date">${formatDate(item.date)}</span>` : ''}
                        </div>
                        <span class="gallery-image-counter">${currentImageIndex + 1} / ${currentCollection.images.length}</span>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;

        // Add event listeners
        container.querySelector('.gallery-nav-prev').addEventListener('click', prevImage);
        container.querySelector('.gallery-nav-next').addEventListener('click', nextImage);
        container.querySelector('.gallery-grid-toggle').addEventListener('click', renderGridView);

        // Process lazy loading for images
        processGalleryImages();

        // Process video elements
        processGalleryVideos();
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

        currentCollection.images.forEach((item, index) => {
            const isVideoItem = isVideo(item);
            const thumbnailUrl = getThumbnail(item);

            html += `
                <div class="gallery-grid-item${isVideoItem ? ' is-video' : ''}" data-index="${index}">
                    ${thumbnailUrl
                        ? `<img src="${thumbnailUrl}" alt="${item.description || ''}" loading="lazy" class="lazy-image">`
                        : `<div class="grid-item-placeholder">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <polygon points="5 3 19 12 5 21 5 3"></polygon>
                            </svg>
                           </div>`
                    }
                    ${isVideoItem ? `<div class="video-indicator">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                        </svg>
                    </div>` : ''}
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

    // Process video elements
    function processGalleryVideos() {
        const videos = container.querySelectorAll('video.gallery-main-video');

        videos.forEach(video => {
            // Add loaded class when video is ready
            video.addEventListener('loadeddata', () => {
                video.classList.add('loaded');
            });

            video.addEventListener('error', () => {
                video.classList.add('error');
            });

            // If already loaded
            if (video.readyState >= 2) {
                video.classList.add('loaded');
            }
        });
    }

    // Handle keyboard navigation
    function handleKeyDown(e) {
        // Only handle keys when gallery is active
        const params = new URLSearchParams(window.location.search);
        if (params.get('id') !== 'gallery') return;

        switch (e.key) {
            case 'ArrowLeft':
                if (currentView === 'viewer') {
                    e.preventDefault();
                    prevImage();
                }
                break;
            case 'ArrowRight':
                if (currentView === 'viewer') {
                    e.preventDefault();
                    nextImage();
                }
                break;
            case 'ArrowUp':
                e.preventDefault();
                if (currentView === 'viewer') {
                    renderGridView();
                } else if (currentView === 'grid') {
                    renderViewerView();
                }
                break;
            case 'ArrowDown':
                e.preventDefault();
                if (currentView === 'grid') {
                    renderViewerView();
                } else if (currentView === 'viewer') {
                    renderCollectionsView();
                }
                break;
            case 'Escape':
                e.preventDefault();
                handleBack();
                break;
        }
    }

    // Initialize keyboard listener
    document.addEventListener('keydown', handleKeyDown);

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
