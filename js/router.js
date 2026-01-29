/**
 * SPA Router for Harry Stanyer
 * Handles page transitions and History API
 */

const Router = (function() {
    'use strict';

    const TRANSITION_DURATION = 300; // ms, matches CSS transition

    let homeView, postView, postContent, backButton, breadcrumbs;
    let currentView = 'home';
    let postsData = [];
    let lastCollectionId = null; // Track last collection ID to detect changes

    // Initialize router
    function init() {
        homeView = document.getElementById('homeView');
        postView = document.getElementById('postView');
        postContent = document.getElementById('postContent');
        backButton = document.getElementById('backButton');
        breadcrumbs = document.getElementById('breadcrumbs');

        // Load posts data
        loadPostsData();

        // Handle browser back/forward
        window.addEventListener('popstate', handlePopState);

        // Handle back button click
        backButton.addEventListener('click', handleBackClick);

        // Handle ESC key to go back when not on homepage
        document.addEventListener('keydown', handleKeyDown);

        // Check initial URL for post ID
        const postId = getPostIdFromUrl();
        if (postId) {
            showPost(postId, false); // false = don't push state (already in URL)
        }
    }

    // Load posts.json data
    async function loadPostsData() {
        try {
            const response = await fetch('/posts.json');
            if (response.ok) {
                const data = await response.json();
                postsData = data.posts;
            }
        } catch (error) {
            console.error('Error loading posts data:', error);
        }
    }

    // Get post ID from current URL
    function getPostIdFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get('id');
    }

    // Navigate to a post
    function navigateToPost(postId) {
        return showPost(postId, true); // true = push state
    }

    // Navigate back to home
    function navigateToHome() {
        showHome(true); // true = push state
    }

    // Handle back button click
    function handleBackClick(e) {
        e.preventDefault();
        performBackNavigation();
    }

    // Perform back navigation (shared by click and ESC key)
    function performBackNavigation() {
        const postId = getPostIdFromUrl();
        // Check if gallery handles the back action internally (for gallery, photography, or videography views)
        if ((postId === 'gallery' || postId === 'photography' || postId === 'videography') && typeof Gallery !== 'undefined' && Gallery.isInNestedView()) {
            if (Gallery.handleBack()) {
                return; // Gallery handled it
            }
        }

        navigateToHome();
    }

    // Handle keyboard events
    function handleKeyDown(e) {
        // Only handle ESC when back button is visible (not on homepage)
        if (e.key === 'Escape' && !backButton.hidden) {
            // Don't interfere if search modal is open
            const searchModal = document.getElementById('searchModal');
            if (searchModal && !searchModal.hidden) {
                return; // Let search handle ESC
            }

            // If we're in gallery view, check if gallery is in nested view
            // Only skip if gallery is handling it (nested view), otherwise handle it
            const currentPostId = getPostIdFromUrl();
            if ((currentPostId === 'gallery' || currentPostId === 'photography' || currentPostId === 'videography') && typeof Gallery !== 'undefined') {
                // If gallery is in nested view (viewer/grid), let it handle ESC
                // If in collections view, router should handle ESC to go back to homepage
                if (Gallery.isInNestedView()) {
                    return; // Gallery will handle it
                }
                // Otherwise, continue to handle ESC (go back to homepage)
            }

            e.preventDefault();
            performBackNavigation();
        }
    }

    // Handle browser back/forward
    function handlePopState(e) {
        const postId = getPostIdFromUrl();
        if (postId) {
            showPost(postId, false);
        } else {
            showHome(false);
        }
    }

    // Update breadcrumbs based on current navigation
    function updateBreadcrumbs(postId, collectionName = null) {
        if (!breadcrumbs) return;

        let html = '<a href="/" class="breadcrumb-item" onclick="event.preventDefault(); Router.navigateToHome();">Home</a>';

        if (postId) {
            // Find post title
            const post = postsData.find(p => p.id === postId || p.id.startsWith(postId));
            const postTitle = post ? post.title : postId.charAt(0).toUpperCase() + postId.slice(1);

            html += '<span class="breadcrumb-separator">/</span>';

            if (collectionName) {
                // Post with collection: Home / Gallery / Collection
                html += `<a href="?id=${postId}" class="breadcrumb-item" onclick="event.preventDefault(); Router.navigateToPost('${postId}');">${postTitle}</a>`;
                html += '<span class="breadcrumb-separator">/</span>';
                html += `<span class="breadcrumb-current">${collectionName}</span>`;
            } else {
                // Just post: Home / Post Title
                html += `<span class="breadcrumb-current">${postTitle}</span>`;
            }
        }

        breadcrumbs.innerHTML = html;
    }

    // Show breadcrumbs
    function showBreadcrumbs() {
        if (breadcrumbs) breadcrumbs.hidden = false;
    }

    // Hide breadcrumbs
    function hideBreadcrumbs() {
        if (breadcrumbs) breadcrumbs.hidden = true;
    }

    // Show post view with transition
    async function showPost(postId, pushState) {
        const currentPostId = getPostIdFromUrl();
        const params = new URLSearchParams(window.location.search);
        const newCollectionId = params.get('collection');
        
        // Don't re-render if we're already viewing the same post and collection
        if (currentView === 'post' && currentPostId === postId) {
            // Check if collection parameter changed
            if (newCollectionId === lastCollectionId) {
                return; // Same collection, no need to re-render
            }
            // Collection changed - update tracking and continue to re-render
            lastCollectionId = newCollectionId;
        } else {
            // Update tracking for new navigation
            lastCollectionId = newCollectionId;
        }

        // Update URL if needed
        if (pushState) {
            // Preserve collection parameter if it exists in current URL
            const collectionId = params.get('collection');
            // Only update URL if it's different from current
            const newUrl = collectionId ? `?id=${postId}&collection=${collectionId}` : `?id=${postId}`;
            const currentUrl = window.location.search;
            if (currentUrl !== `?${newUrl.split('?')[1] || newUrl}`) {
                history.pushState({ postId, collectionId }, '', newUrl);
            }
            // Update tracking
            lastCollectionId = collectionId;
        }

        // Fade out home view
        homeView.classList.add('fade-out');

        await delay(TRANSITION_DURATION);

        // Hide home, show post
        homeView.hidden = true;
        homeView.classList.remove('fade-out');

        postView.hidden = false;
        postView.classList.add('fade-out');

        // Load post content
        await loadPostContent(postId);

        // Show back button
        backButton.hidden = false;

        // Show and update breadcrumbs
        showBreadcrumbs();
        const breadcrumbParams = new URLSearchParams(window.location.search);
        const breadcrumbCollectionId = breadcrumbParams.get('collection');
        if (breadcrumbCollectionId && typeof Gallery !== 'undefined' && Gallery.getCollectionName) {
            // Get collection name from gallery data
            Gallery.getCollectionName(breadcrumbCollectionId).then(name => {
                updateBreadcrumbs(postId, name);
            });
        } else {
            updateBreadcrumbs(postId);
        }

        // Allow body scroll for post
        document.body.style.overflow = 'auto';

        // Fade in post view
        requestAnimationFrame(() => {
            postView.classList.remove('fade-out');
            postView.classList.add('fade-in');
        });

        await delay(TRANSITION_DURATION);
        postView.classList.remove('fade-in');

        currentView = 'post';
    }

    // Show home view with transition
    async function showHome(pushState) {
        if (currentView === 'home') return;

        // Reset gallery state if we were viewing it
        if (typeof Gallery !== 'undefined') {
            Gallery.reset();
        }
        
        // Reset collection tracking
        lastCollectionId = null;

        // Update URL if needed
        if (pushState) {
            history.pushState({}, '', window.location.pathname);
        }

        // Fade out post view
        postView.classList.add('fade-out');

        await delay(TRANSITION_DURATION);

        // Hide post, show home
        postView.hidden = true;
        postView.classList.remove('fade-out');

        homeView.hidden = false;
        homeView.classList.add('fade-out');

        // Hide back button
        backButton.hidden = true;

        // Hide breadcrumbs
        hideBreadcrumbs();

        // Reset page title
        document.title = 'Harry Stanyer';

        // Restore body scroll behavior
        document.body.style.overflow = '';

        // Scroll to top
        window.scrollTo(0, 0);

        // Fade in home view
        requestAnimationFrame(() => {
            homeView.classList.remove('fade-out');
            homeView.classList.add('fade-in');
        });

        await delay(TRANSITION_DURATION);
        homeView.classList.remove('fade-in');

        currentView = 'home';
    }

    // Load and render post content
    async function loadPostContent(postId) {
        postContent.innerHTML = '<p class="loading">Loading...</p>';

        // Special handling for map
        if (postId === 'map') {
            document.title = 'Map - Harry Stanyer';
            await MapView.render(postContent);
            return;
        }

        // Special handling for gallery views (photography/videography)
        if (postId === 'gallery' || postId === 'photography' || postId === 'videography') {
            const category = postId === 'photography' ? 'photography' :
                             postId === 'videography' ? 'videography' : null;
            const displayTitle = postId === 'photography' ? 'Photography' :
                                 postId === 'videography' ? 'Videography' : 'Gallery';
            document.title = `${displayTitle} - Harry Stanyer`;
            // Check for collection parameter in URL
            const params = new URLSearchParams(window.location.search);
            const collectionId = params.get('collection');
            await Gallery.render(postContent, collectionId, category);
            return;
        }

        try {
            // Find post metadata
            const postMeta = postsData.find(post => post.id === postId);

            if (!postMeta) {
                showError('Post not found');
                return;
            }

            // Update page title
            document.title = `${postMeta.title} - Harry Stanyer`;

            // Fetch markdown content (ensure absolute path)
            const filePath = postMeta.file.startsWith('/') ? postMeta.file : '/' + postMeta.file;
            const response = await fetch(filePath);
            if (!response.ok) throw new Error('Failed to load post content');

            const markdown = await response.text();

            // Render markdown to HTML
            postContent.innerHTML = marked.parse(markdown);

            // Add download button for CV page
            if (postId === 'cv') {
                addCvDownloadButton();
            }

            // Process images for lazy loading
            processImages();

            // Process any Mermaid diagrams
            await renderMermaidDiagrams();

        } catch (error) {
            console.error('Error loading post:', error);
            showError('Failed to load post');
        }
    }

    // Show error message
    function showError(message) {
        postContent.innerHTML = `
            <div class="post-error">
                <h1>Oops!</h1>
                <p>${message}</p>
                <p><a href="/" onclick="event.preventDefault(); Router.navigateToHome();">Return home</a></p>
            </div>
        `;
        document.title = 'Error - Harry Stanyer';
    }

    // Helper: delay promise
    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Process images for lazy loading with fade-in effect
    function processImages() {
        const images = postContent.querySelectorAll('img');

        images.forEach(img => {
            // Add lazy loading attribute
            img.loading = 'lazy';

            // Add class for styling
            img.classList.add('lazy-image');

            // Handle load event for fade-in
            if (img.complete) {
                img.classList.add('loaded');
            } else {
                img.addEventListener('load', () => {
                    img.classList.add('loaded');
                });

                img.addEventListener('error', () => {
                    img.classList.add('error');
                });
            }
        });
    }

    // Add CV download button
    function addCvDownloadButton() {
        // Check if button already exists
        if (postContent.querySelector('.cv-download-button')) {
            return;
        }

        // Create download button as a link
        const downloadButton = document.createElement('a');
        downloadButton.href = '/Harry Stanyer CV.pdf';
        downloadButton.download = 'Harry Stanyer CV.pdf';
        downloadButton.className = 'cv-download-button';
        downloadButton.setAttribute('aria-label', 'Download CV as PDF');

        // Add download icon SVG
        downloadButton.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>Download as PDF</span>
        `;

        // Insert button at the beginning of the post content (after h1)
        const firstHeading = postContent.querySelector('h1');
        if (firstHeading) {
            firstHeading.insertAdjacentElement('afterend', downloadButton);
        } else {
            // If no h1, insert at the beginning
            postContent.insertBefore(downloadButton, postContent.firstChild);
        }
    }

    // Render Mermaid diagrams in post content
    async function renderMermaidDiagrams() {
        // Find all code blocks with language-mermaid class OR already rendered diagrams
        const mermaidBlocks = postContent.querySelectorAll('code.language-mermaid');
        const existingDiagrams = postContent.querySelectorAll('.mermaid-diagram[data-mermaid-definition]');

        // If we have existing diagrams, re-render them (theme change)
        if (existingDiagrams.length > 0) {
            // Initialize mermaid with theme based on current mode
            const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
            mermaid.initialize({
                startOnLoad: false,
                theme: isDark ? 'dark' : 'default'
            });

            // Re-render existing diagrams
            for (let i = 0; i < existingDiagrams.length; i++) {
                const container = existingDiagrams[i];
                const graphDefinition = container.getAttribute('data-mermaid-definition');

                try {
                    const { svg } = await mermaid.render(`mermaid-${Date.now()}-${i}`, graphDefinition);
                    container.innerHTML = svg;
                } catch (error) {
                    console.error('Mermaid rendering error:', error);
                }
            }
            return;
        }

        // Otherwise, render new diagrams from code blocks
        if (mermaidBlocks.length === 0) return;

        // Initialize mermaid with theme based on current mode
        const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
        mermaid.initialize({
            startOnLoad: false,
            theme: isDark ? 'dark' : 'default'
        });

        // Process each mermaid block
        for (let i = 0; i < mermaidBlocks.length; i++) {
            const codeBlock = mermaidBlocks[i];
            const pre = codeBlock.parentElement;
            const graphDefinition = codeBlock.textContent;

            try {
                const { svg } = await mermaid.render(`mermaid-${i}`, graphDefinition);

                // Create a container for the rendered diagram
                const container = document.createElement('div');
                container.className = 'mermaid-diagram';
                container.setAttribute('data-mermaid-definition', graphDefinition);
                container.innerHTML = svg;

                // Replace the pre/code block with the rendered diagram
                pre.replaceWith(container);
            } catch (error) {
                console.error('Mermaid rendering error:', error);
            }
        }
    }

    // Public API
    return {
        init,
        navigateToPost,
        navigateToHome,
        loadPostsData,
        renderMermaidDiagrams
    };
})();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', Router.init);
} else {
    Router.init();
}
