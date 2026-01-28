/**
 * Main JavaScript for Harry Stanyer homepage
 * Handles grid population from posts.json
 */

(function() {
    'use strict';

    // Fetch and populate grid with posts
    async function loadPosts() {
        try {
            const response = await fetch('/posts.json');
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
                cell.href = `?id=${post.id}`;
                cell.setAttribute('data-post-id', post.id);

                // Create title element
                const title = document.createElement('span');
                title.className = 'cell-title';
                title.textContent = post.title;
                cell.appendChild(title);

                // Create description element if excerpt exists
                if (post.excerpt) {
                    const desc = document.createElement('span');
                    desc.className = 'cell-description';
                    desc.textContent = post.excerpt;
                    cell.appendChild(desc);
                }

                // Add click handler for SPA navigation
                cell.addEventListener('click', handleCellClick);
            }
        });

        // Leave remaining cells empty (just border visible)
        for (let i = posts.length; i < cells.length; i++) {
            cells[i].removeAttribute('href');
            cells[i].style.pointerEvents = 'none';
        }
    }

    // Handle grid cell click for SPA navigation
    function handleCellClick(e) {
        e.preventDefault();
        e.stopPropagation();

        // Trigger wave effect from click position
        if (typeof GridTrail !== 'undefined' && GridTrail.triggerWave) {
            GridTrail.triggerWave(e.clientX, e.clientY);
        }

        const postId = this.dataset.postId || e.currentTarget.dataset.postId;
        if (postId && typeof Router !== 'undefined' && Router.navigateToPost) {
            Router.navigateToPost(postId);
        } else {
            // Fallback - navigate with query param
            window.location.href = `?id=${postId}`;
        }
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadPosts);
    } else {
        loadPosts();
    }
})();
