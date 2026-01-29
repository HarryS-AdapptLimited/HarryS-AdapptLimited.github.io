/**
 * Main JavaScript for Harry Stanyer homepage
 * Handles grid population from posts.json and keyboard navigation
 */

(function() {
    'use strict';

    // Keyboard navigation state
    let selectedCellIndex = -1;
    let navigableCells = [];
    let usingKeyboard = false;

    // Grid layout mapping: visual position to data-position
    // The grid is 4x4 with center cells (positions don't exist for center)
    // Layout: 0  1  2  3
    //         4  [center]  5
    //         6  [center]  7
    //         8  9  10 11
    const gridNavMap = [
        [0, 1, 2, 3],      // Row 0
        [4, -1, -1, 5],    // Row 1 (-1 = center, skip)
        [6, -1, -1, 7],    // Row 2
        [8, 9, 10, 11]     // Row 3
    ];

    // Fetch and populate grid with posts
    async function loadPosts() {
        try {
            const response = await fetch('/posts.json');
            if (!response.ok) throw new Error('Failed to load posts');

            const data = await response.json();
            populateGrid(data.posts);
            // Initialize keyboard navigation after posts are loaded
            initKeyboardNav();
        } catch (error) {
            console.error('Error loading posts:', error);
            // Still initialize keyboard nav even if posts fail to load
            initKeyboardNav();
        }
    }

    // Populate grid cells with post data
    function populateGrid(posts) {
        const cells = document.querySelectorAll('.grid-cell[data-position]');

        posts.forEach((post, index) => {
            if (index < cells.length) {
                const cell = cells[index];
                // Handle collection-type posts with separate collection property
                if (post.collection) {
                    cell.href = `?id=${post.id}&collection=${post.collection}`;
                    cell.setAttribute('data-post-id', post.id);
                    cell.setAttribute('data-collection-id', post.collection);
                } else {
                    cell.href = `?id=${post.id}`;
                    cell.setAttribute('data-post-id', post.id);
                }

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
        const collectionId = this.dataset.collectionId || e.currentTarget.dataset.collectionId;

        if (postId && typeof Router !== 'undefined' && Router.navigateToPost) {
            // If there's a collection, update URL with collection param before navigating
            if (collectionId) {
                history.pushState({}, '', `?id=${postId}&collection=${collectionId}`);
            }
            Router.navigateToPost(postId);
        } else {
            // Fallback - navigate with query param
            const url = collectionId ? `?id=${postId}&collection=${collectionId}` : `?id=${postId}`;
            window.location.href = url;
        }
    }

    // Build list of navigable cells (cells with posts)
    function buildNavigableCells() {
        navigableCells = Array.from(document.querySelectorAll('.grid-cell[data-position][href]'))
            .filter(cell => cell.getAttribute('href') !== '#');
    }

    // Get cell by data-position
    function getCellByPosition(pos) {
        return document.querySelector(`.grid-cell[data-position="${pos}"]`);
    }

    // Get grid row/col from position
    function getGridCoords(pos) {
        for (let row = 0; row < gridNavMap.length; row++) {
            const col = gridNavMap[row].indexOf(pos);
            if (col !== -1) return { row, col };
        }
        return null;
    }

    // Find next valid position in a direction
    function findNextPosition(currentPos, direction) {
        const coords = getGridCoords(currentPos);
        if (!coords) return currentPos;

        let { row, col } = coords;

        switch (direction) {
            case 'up':
                row = Math.max(0, row - 1);
                break;
            case 'down':
                row = Math.min(3, row + 1);
                break;
            case 'left':
                col = Math.max(0, col - 1);
                break;
            case 'right':
                col = Math.min(3, col + 1);
                break;
        }

        let newPos = gridNavMap[row][col];

        // Skip center cells (-1) by continuing in the same direction
        if (newPos === -1) {
            // For center cells, try to skip over them
            if (direction === 'left' || direction === 'right') {
                // Skip across center horizontally
                if (direction === 'left') col = 0;
                if (direction === 'right') col = 3;
            } else {
                // Skip across center vertically
                if (direction === 'up') row = 0;
                if (direction === 'down') row = 3;
            }
            newPos = gridNavMap[row][col];
        }

        return newPos;
    }

    // Update visual selection
    function updateSelection(newIndex) {
        // Remove previous selection
        document.querySelectorAll('.grid-cell.keyboard-focus').forEach(cell => {
            cell.classList.remove('keyboard-focus');
        });

        if (newIndex >= 0 && newIndex < navigableCells.length) {
            selectedCellIndex = newIndex;
            navigableCells[selectedCellIndex].classList.add('keyboard-focus');
            // Ensure it's visible (for mobile scrolling)
            navigableCells[selectedCellIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        } else {
            selectedCellIndex = -1;
        }
    }

    // Select cell by data-position
    function selectByPosition(pos) {
        const cell = getCellByPosition(pos);
        if (!cell) return;

        const index = navigableCells.indexOf(cell);
        if (index !== -1) {
            updateSelection(index);
        }
    }

    // Handle keyboard navigation
    function handleKeyDown(e) {
        // Only handle when homepage is visible
        const homeView = document.getElementById('homeView');
        if (!homeView || homeView.hidden) return;

        // Don't handle if search modal is open
        const searchModal = document.getElementById('searchModal');
        if (searchModal && !searchModal.hidden) return;

        // Don't handle if we're in an input field
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        // Ensure navigable cells are built (in case posts loaded after listener attached)
        if (navigableCells.length === 0) {
            buildNavigableCells();
            // If still no cells, don't handle
            if (navigableCells.length === 0) return;
        }

        const key = e.key;

        // Arrow keys, Enter, Escape
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Escape'].includes(key)) {
            // Mark that we're using keyboard
            usingKeyboard = true;

            if (key === 'Escape') {
                // Clear selection
                updateSelection(-1);
                e.preventDefault();
                return;
            }

            if (key === 'Enter' && selectedCellIndex >= 0) {
                // Activate selected cell
                const cell = navigableCells[selectedCellIndex];
                if (cell) {
                    e.preventDefault();
                    cell.click();
                }
                return;
            }

            // Arrow key navigation
            if (key.startsWith('Arrow')) {
                e.preventDefault();

                // If nothing selected, select first cell
                if (selectedCellIndex < 0) {
                    if (navigableCells.length > 0) {
                        updateSelection(0);
                    }
                    return;
                }

                // Get current position and find next
                const currentCell = navigableCells[selectedCellIndex];
                if (!currentCell) {
                    // Cell no longer exists, rebuild and select first
                    buildNavigableCells();
                    if (navigableCells.length > 0) {
                        updateSelection(0);
                    }
                    return;
                }

                const currentPos = parseInt(currentCell.dataset.position, 10);
                const direction = key.replace('Arrow', '').toLowerCase();
                const newPos = findNextPosition(currentPos, direction);

                if (newPos !== currentPos) {
                    selectByPosition(newPos);
                }
            }
        }
    }

    // Handle mouse movement - switch back to mouse mode
    function handleMouseMove() {
        if (usingKeyboard) {
            usingKeyboard = false;
            updateSelection(-1);
        }
    }

    // Initialize keyboard navigation (rebuilds navigable cells)
    function initKeyboardNav() {
        buildNavigableCells();
    }

    // Typing animation for "Harry Stanyer"
    function initTypingAnimation() {
        const typedTextElement = document.getElementById('typedText');
        if (!typedTextElement) return;

        const text = 'Harry Stanyer';
        const typingSpeed = 100; // milliseconds per character
        let index = 0;

        function typeCharacter() {
            if (index < text.length) {
                typedTextElement.textContent += text[index];
                index++;
                setTimeout(typeCharacter, typingSpeed);
            }
        }

        // Start typing animation after a short delay
        setTimeout(typeCharacter, 300);
    }

    // Initialize keyboard navigation listeners early (before posts load)
    // This ensures keyboard events are captured even if posts take time to load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // Attach listeners immediately
            document.addEventListener('keydown', handleKeyDown);
            document.addEventListener('mousemove', handleMouseMove, { passive: true });
            // Initialize typing animation
            initTypingAnimation();
            // Then load posts and build navigable cells
            loadPosts();
        });
    } else {
        // Attach listeners immediately
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('mousemove', handleMouseMove, { passive: true });
        // Initialize typing animation
        initTypingAnimation();
        // Then load posts and build navigable cells
        loadPosts();
    }
})();
