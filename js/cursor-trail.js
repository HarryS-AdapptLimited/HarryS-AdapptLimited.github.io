/**
 * Grid trail effect for Harry Stanyer
 * Creates a grid of cells that light up when the mouse passes over them
 */

const GridTrail = (function() {
    'use strict';

    const CELL_SIZE = 50; // Size of each grid cell in pixels
    const FADE_DURATION = 600; // How long cells stay visible (ms)
    const NEIGHBOR_CHANCE = 0.4; // Chance for each neighboring cell to light up
    const WAVE_DELAY = 15; // Delay between each ring of the wave (ms)
    const WAVE_FADE_DURATION = 300; // How long wave cells stay visible (ms)

    let gridContainer = null;
    let cells = [];
    let cols = 0;
    let rows = 0;
    let lastCellKey = null;

    // Create the grid container and cells
    function createGrid() {
        gridContainer = document.createElement('div');
        gridContainer.className = 'grid-trail-container';
        document.body.appendChild(gridContainer);

        // Calculate grid dimensions based on viewport
        updateGridSize();

        // Listen for resize
        window.addEventListener('resize', debounce(updateGridSize, 150));
    }

    // Update grid size on resize
    function updateGridSize() {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        cols = Math.ceil(viewportWidth / CELL_SIZE) + 1;
        rows = Math.ceil(viewportHeight / CELL_SIZE) + 1;

        // Clear existing cells and their timeouts
        cells.forEach(cell => {
            if (cell.timeoutId) clearTimeout(cell.timeoutId);
        });

        gridContainer.innerHTML = '';
        cells = [];

        // Set grid template
        gridContainer.style.gridTemplateColumns = `repeat(${cols}, ${CELL_SIZE}px)`;
        gridContainer.style.gridTemplateRows = `repeat(${rows}, ${CELL_SIZE}px)`;

        // Create cells
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const cell = document.createElement('div');
                cell.className = 'grid-trail-cell';
                gridContainer.appendChild(cell);
                cells.push({
                    element: cell,
                    row: row,
                    col: col,
                    timeoutId: null
                });
            }
        }
    }

    // Get cell at specific row/col
    function getCell(row, col) {
        if (row < 0 || row >= rows || col < 0 || col >= cols) return null;
        const index = row * cols + col;
        return cells[index] || null;
    }

    // Light up a cell
    function activateCell(cell) {
        if (!cell) return;

        // Clear any existing timeout for this cell
        if (cell.timeoutId) {
            clearTimeout(cell.timeoutId);
        }

        // Add active class immediately
        cell.element.classList.add('active');

        // Set timeout to remove active class
        cell.timeoutId = setTimeout(() => {
            cell.element.classList.remove('active');
            cell.timeoutId = null;
        }, FADE_DURATION);
    }

    // Get random neighbors from the surrounding 8 cells
    function getRandomNeighbors(row, col) {
        const neighbors = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],          [0, 1],
            [1, -1],  [1, 0], [1, 1]
        ];

        return neighbors
            .filter(() => Math.random() < NEIGHBOR_CHANCE)
            .map(([dRow, dCol]) => getCell(row + dRow, col + dCol))
            .filter(c => c !== null);
    }

    // Handle mouse movement
    function handleMouseMove(e) {
        const col = Math.floor(e.clientX / CELL_SIZE);
        const row = Math.floor(e.clientY / CELL_SIZE);
        const cellKey = `${row}-${col}`;

        // Only activate if we've moved to a new cell
        if (cellKey !== lastCellKey) {
            lastCellKey = cellKey;

            // Get and activate the cell under the cursor
            const currentCell = getCell(row, col);
            if (currentCell) {
                activateCell(currentCell);

                // Activate random neighbors
                const neighbors = getRandomNeighbors(row, col);
                neighbors.forEach(neighbor => activateCell(neighbor));
            }
        }
    }

    // Debounce helper
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Trigger a wave effect from a specific point
    function triggerWave(clientX, clientY) {
        if (!gridContainer || cells.length === 0) return;

        const centerCol = Math.floor(clientX / CELL_SIZE);
        const centerRow = Math.floor(clientY / CELL_SIZE);

        // Calculate max distance to determine number of rings
        const maxDistance = Math.max(
            Math.sqrt(Math.pow(centerCol, 2) + Math.pow(centerRow, 2)),
            Math.sqrt(Math.pow(cols - centerCol, 2) + Math.pow(centerRow, 2)),
            Math.sqrt(Math.pow(centerCol, 2) + Math.pow(rows - centerRow, 2)),
            Math.sqrt(Math.pow(cols - centerCol, 2) + Math.pow(rows - centerRow, 2))
        );

        // Activate cells in rings expanding outward
        cells.forEach(cell => {
            const distance = Math.sqrt(
                Math.pow(cell.col - centerCol, 2) +
                Math.pow(cell.row - centerRow, 2)
            );

            // Calculate delay based on distance
            const delay = distance * WAVE_DELAY;

            // Clear any existing timeout
            if (cell.timeoutId) {
                clearTimeout(cell.timeoutId);
            }

            // Schedule activation
            setTimeout(() => {
                cell.element.classList.add('active');

                // Schedule deactivation
                cell.timeoutId = setTimeout(() => {
                    cell.element.classList.remove('active');
                    cell.timeoutId = null;
                }, WAVE_FADE_DURATION);
            }, delay);
        });
    }

    // Check if we're currently viewing the gallery
    function isInGallery() {
        const params = new URLSearchParams(window.location.search);
        return params.get('id') === 'gallery';
    }

    // Check if we're currently viewing the map
    function isInMap() {
        const params = new URLSearchParams(window.location.search);
        return params.get('id') === 'map';
    }

    // Handle click to trigger wave
    function handleClick(e) {
        // Disable wave effect when in gallery or map
        if (isInGallery() || isInMap()) return;

        triggerWave(e.clientX, e.clientY);
    }

    // Handle mouse movement
    function handleMouseMoveWithCheck(e) {
        // Disable trail effect when in map
        if (isInMap()) return;
        
        handleMouseMove(e);
    }

    // Initialize
    function init() {
        // Skip on touch-only devices
        if (window.matchMedia('(hover: none)').matches) {
            return;
        }

        createGrid();
        document.addEventListener('mousemove', handleMouseMoveWithCheck);
        document.addEventListener('click', handleClick);
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Public API
    return {
        triggerWave
    };
})();
