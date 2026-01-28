/**
 * Theme toggle for Stanyer.space
 * Switches between dark and light mode
 */

(function() {
    'use strict';

    const STORAGE_KEY = 'stanyer-theme';

    // Initialize theme
    function init() {
        // Check for saved preference or default to dark
        const savedTheme = localStorage.getItem(STORAGE_KEY) || 'dark';
        setTheme(savedTheme);

        // Bind toggle button
        const toggleBtn = document.getElementById('themeToggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', toggleTheme);
        }
    }

    // Set theme
    function setTheme(theme) {
        if (theme === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
        localStorage.setItem(STORAGE_KEY, theme);
    }

    // Toggle between themes
    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        
        // Re-render mermaid diagrams if router is available
        if (typeof Router !== 'undefined' && Router.renderMermaidDiagrams) {
            Router.renderMermaidDiagrams();
        }
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
