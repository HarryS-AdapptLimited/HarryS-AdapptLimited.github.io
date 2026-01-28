/**
 * Post page JavaScript for Harry Stanyer
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
        const response = await fetch('/posts.json');
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
            document.title = `${postMeta.title} - Harry Stanyer`;

            // Fetch markdown content (ensure absolute path)
            const filePath = postMeta.file.startsWith('/') ? postMeta.file : '/' + postMeta.file;
            const response = await fetch(filePath);
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
        document.title = 'Error - Harry Stanyer';
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadPost);
    } else {
        loadPost();
    }
})();
