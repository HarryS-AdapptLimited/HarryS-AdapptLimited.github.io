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

            // Add download button for CV page
            if (postId === 'cv') {
                addCvDownloadButton(contentEl);
            }

        } catch (error) {
            console.error('Error loading post:', error);
            showError(contentEl, 'Failed to load post');
        }
    }

    // Add CV download button
    function addCvDownloadButton(postContent) {
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
