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
