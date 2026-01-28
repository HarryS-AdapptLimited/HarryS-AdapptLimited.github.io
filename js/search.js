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
                <a href="?id=${post.id}" class="search-result-item" data-post-id="${post.id}">
                    <h3>${escapeHtml(post.title)}</h3>
                    ${post.excerpt ? `<p>${escapeHtml(post.excerpt)}</p>` : ''}
                </a>
            `).join('');

            // Add click handlers for SPA navigation
            searchResults.querySelectorAll('.search-result-item').forEach(link => {
                link.addEventListener('click', handleResultClick);
            });
        }
    }

    // Handle search result click for SPA navigation
    function handleResultClick(e) {
        e.preventDefault();
        const postId = e.currentTarget.dataset.postId;
        closeSearch();
        if (typeof Router !== 'undefined' && Router.navigateToPost) {
            Router.navigateToPost(postId);
        } else {
            // Fallback for standalone post.html
            window.location.href = `post.html?id=${postId}`;
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
