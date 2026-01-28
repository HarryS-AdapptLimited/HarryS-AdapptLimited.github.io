/**
 * Search functionality for Harry Stanyer
 * Client-side search with modal overlay
 */

(function() {
    'use strict';

    let posts = [];
    let collections = [];
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
            const response = await fetch('/posts.json');
            if (response.ok) {
                const data = await response.json();
                posts = data.posts;
            }
        } catch (error) {
            console.error('Error loading posts for search:', error);
        }

        // Load gallery collections data
        try {
            const response = await fetch('/gallery.json');
            if (response.ok) {
                const data = await response.json();
                collections = data.collections || [];
            }
        } catch (error) {
            console.error('Error loading gallery collections for search:', error);
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
        searchModal.classList.remove('fade-out'); // Remove fade-out class if present
        // Force reflow to ensure transition works
        requestAnimationFrame(() => {
            searchModal.style.opacity = '1';
        });
        searchInput.value = '';
        searchResults.innerHTML = '';
        searchInput.focus();
        document.body.style.overflow = 'hidden';
    }

    // Close search modal with fade-out animation
    function closeSearch() {
        // Add fade-out class
        searchModal.classList.add('fade-out');
        
        // Hide after animation completes
        setTimeout(() => {
            searchModal.hidden = true;
            searchModal.classList.remove('fade-out');
            document.body.style.overflow = '';
        }, 400); // Match CSS transition duration (400ms)
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
        const postMatches = posts.filter(post => {
            const titleMatch = post.title.toLowerCase().includes(query);
            const excerptMatch = post.excerpt?.toLowerCase().includes(query);
            return titleMatch || excerptMatch;
        });

        // Filter collections
        const collectionMatches = collections.filter(collection => {
            const nameMatch = collection.name.toLowerCase().includes(query);
            const descMatch = collection.description?.toLowerCase().includes(query);
            return nameMatch || descMatch;
        });

        const totalMatches = postMatches.length + collectionMatches.length;

        // Render results
        if (totalMatches === 0) {
            searchResults.innerHTML = '<p class="search-no-results">No results found</p>';
        } else {
            let html = '';

            // Render post results
            if (postMatches.length > 0) {
                html += postMatches.map(post => `
                    <a href="?id=${post.id}" class="search-result-item" data-post-id="${post.id}" data-type="post">
                        <h3>${escapeHtml(post.title)}</h3>
                        ${post.excerpt ? `<p>${escapeHtml(post.excerpt)}</p>` : ''}
                    </a>
                `).join('');
            }

            // Render collection results
            if (collectionMatches.length > 0) {
                html += collectionMatches.map(collection => `
                    <a href="?id=gallery" class="search-result-item" data-collection-id="${collection.id}" data-type="collection">
                        <h3>${escapeHtml(collection.name)}</h3>
                        ${collection.description ? `<p>${escapeHtml(collection.description)}</p>` : ''}
                        <span class="search-result-type">Gallery Collection</span>
                    </a>
                `).join('');
            }

            searchResults.innerHTML = html;

            // Add click handlers for SPA navigation
            searchResults.querySelectorAll('.search-result-item').forEach(link => {
                link.addEventListener('click', handleResultClick);
            });
        }
    }

    // Handle search result click for SPA navigation
    function handleResultClick(e) {
        e.preventDefault();
        const resultType = e.currentTarget.dataset.type;
        const postId = e.currentTarget.dataset.postId;
        const collectionId = e.currentTarget.dataset.collectionId;
        
        // Start fade-out immediately for smooth transition
        searchModal.classList.add('fade-out');
        
        if (resultType === 'collection') {
            // Navigate to gallery with collection parameter to open directly
            if (typeof Router !== 'undefined' && Router.navigateToPost) {
                // Check if we're already on gallery - if so, open collection directly
                const currentParams = new URLSearchParams(window.location.search);
                const currentPostId = currentParams.get('id');
                
                if (currentPostId === 'gallery' && typeof Gallery !== 'undefined' && Gallery.openCollection) {
                    // Already on gallery - open collection directly without router
                    Gallery.openCollection(collectionId);
                    // Update URL to include collection parameter
                    const url = new URL(window.location);
                    url.searchParams.set('collection', collectionId);
                    history.pushState({ postId: 'gallery', collectionId: collectionId }, '', url);
                    // Close search after fade completes
                    setTimeout(() => {
                        searchModal.hidden = true;
                        searchModal.classList.remove('fade-out');
                        document.body.style.overflow = '';
                    }, 450);
                } else {
                    // Not on gallery - navigate normally
                    const url = new URL(window.location);
                    url.searchParams.set('id', 'gallery');
                    url.searchParams.set('collection', collectionId);
                    // Use replaceState to set URL parameters
                    history.replaceState(history.state, '', url);
                    
                    // Now navigate to gallery (router will read collection from URL and preserve it)
                    const promise = Router.navigateToPost('gallery');
                    if (promise && promise.then) {
                        promise.then(() => {
                            // Close search after transition completes (after fade-out and content load)
                            // Fade-out is 400ms, wait a bit more for content to start loading
                            setTimeout(() => {
                                searchModal.hidden = true;
                                searchModal.classList.remove('fade-out');
                                document.body.style.overflow = '';
                            }, 450);
                        }).catch(() => {
                            // Handle any errors, but still close search
                            closeSearch();
                        });
                    } else {
                        // If not a promise, close after fade completes
                        setTimeout(() => {
                            searchModal.hidden = true;
                            searchModal.classList.remove('fade-out');
                            document.body.style.overflow = '';
                        }, 450);
                    }
                }
            } else {
                // Fallback for standalone post.html
                closeSearch();
                window.location.href = `post.html?id=gallery&collection=${collectionId}`;
            }
        } else if (resultType === 'post') {
            if (typeof Router !== 'undefined' && Router.navigateToPost) {
                const promise = Router.navigateToPost(postId);
                if (promise && promise.then) {
                    promise.then(() => {
                        // Close search after transition completes
                        // Fade-out is 400ms, wait a bit more for content to start loading
                        setTimeout(() => {
                            searchModal.hidden = true;
                            searchModal.classList.remove('fade-out');
                            document.body.style.overflow = '';
                        }, 450);
                    }).catch(() => {
                        closeSearch();
                    });
                } else {
                    // If not a promise, close after fade completes
                    setTimeout(() => {
                        searchModal.hidden = true;
                        searchModal.classList.remove('fade-out');
                        document.body.style.overflow = '';
                    }, 450);
                }
            } else {
                // Fallback for standalone post.html
                closeSearch();
                window.location.href = `post.html?id=${postId}`;
            }
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
