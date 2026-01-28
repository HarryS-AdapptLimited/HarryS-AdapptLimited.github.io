/**
 * SPA Router for Harry Stanyer
 * Handles page transitions and History API
 */

const Router = (function() {
    'use strict';

    const TRANSITION_DURATION = 300; // ms, matches CSS transition

    let homeView, postView, postContent, backButton;
    let currentView = 'home';
    let postsData = [];
    let lastCollectionId = null; // Track last collection ID to detect changes

    // Initialize router
    function init() {
        homeView = document.getElementById('homeView');
        postView = document.getElementById('postView');
        postContent = document.getElementById('postContent');
        backButton = document.getElementById('backButton');

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
        // Check if gallery handles the back action internally
        if (getPostIdFromUrl() === 'gallery' && typeof Gallery !== 'undefined' && Gallery.isInNestedView()) {
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

            // If we're in gallery, check if gallery is in nested view
            // Only skip if gallery is handling it (nested view), otherwise handle it
            if (getPostIdFromUrl() === 'gallery' && typeof Gallery !== 'undefined') {
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

        // Special handling for gallery
        if (postId === 'gallery') {
            document.title = 'Gallery - Harry Stanyer';
            // Check for collection parameter in URL
            const params = new URLSearchParams(window.location.search);
            const collectionId = params.get('collection');
            await Gallery.render(postContent, collectionId);
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
