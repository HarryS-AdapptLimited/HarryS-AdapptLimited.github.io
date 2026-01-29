/**
 * Map Module for Harry Stanyer
 * Interactive world map showing visited locations
 */

const MapView = (function() {
    'use strict';

    let locationsData = null;
    let container = null;
    let tooltip = null;
    let isRendering = false;  // Prevent concurrent renders

    // SVG viewBox dimensions (standard world map projection)
    // Increased size for better visibility
    const MAP_WIDTH = 1200;
    const MAP_HEIGHT = 600;

    // Coordinate adjustment offsets (stored in localStorage)
    let latOffset = parseFloat(localStorage.getItem('mapLatOffset') || '40');  // degrees
    let lngOffset = parseFloat(localStorage.getItem('mapLngOffset') || '0');    // degrees

    // Load locations data
    async function loadData() {
        if (locationsData) return locationsData;

        try {
            const response = await fetch('/locations.json');
            if (!response.ok) throw new Error('Failed to load locations data');
            locationsData = await response.json();
            return locationsData;
        } catch (error) {
            console.error('Error loading locations:', error);
            throw error;
        }
    }

    // Convert lat/lng to SVG coordinates
    // The map1.svg has viewBox "0 0 2000 1280" and is scaled uniformly by 0.6
    // Calculate coordinates in the ORIGINAL coordinate system, then scale them
    // This ensures perfect alignment with the scaled map paths
    function latLngToSvg(lat, lng) {
        const scale = MAP_WIDTH / 2000;  // Uniform scale: 1200/2000 = 0.6
        const originalWidth = 2000;
        const originalHeight = 1280;
        
        // Calculate coordinates in the ORIGINAL coordinate system (2000x1280)
        // Standard equirectangular projection:
        // X: longitude -180 to +180 maps to 0 to 2000
        // Y: latitude +90 (North) to -90 (South) maps to 0 to 1280
        const xOriginal = (lng + 180) * (originalWidth / 360);
        const yOriginal = (90 - lat) * (originalHeight / 180);
        
        // Scale coordinates to match the transformed map paths
        // The map paths are inside <g transform="scale(0.6)">, so we scale our coordinates too
        let x = xOriginal * scale;
        let y = yOriginal * scale;
        
        // Adjust Y coordinate: The map coordinate system appears to be offset
        // Apply latitude offset (adjustable via controls)
        const scaledMapHeight = originalHeight * scale;  // 768
        const yOffset = latOffset * (scaledMapHeight / 180);
        y = y + yOffset;
        
        // Adjust X coordinate: Apply longitude offset if needed
        const xOffset = lngOffset * (MAP_WIDTH / 360);
        x = x + xOffset;
        
        return { x, y };
    }

    // Main render function
    async function render(containerElement) {
        container = containerElement;

        try {
            await loadData();
            await renderMap();
        } catch (error) {
            container.innerHTML = `
                <div class="map-error">
                    <h2>Failed to load map</h2>
                    <p>Please try again later.</p>
                </div>
            `;
        }
    }

    // Render the map with locations
    async function renderMap() {
        // Prevent concurrent renders
        if (isRendering) {
            return;
        }
        
        try {
            isRendering = true;
            
            // Load world map paths
            const worldPaths = await loadWorldMapPaths();
            
            // Calculate the actual scaled dimensions
            const scale = MAP_WIDTH / 2000;  // 0.6 for 1200 width
            const scaledMapHeight = 1280 * scale;  // 768 for scale 0.6
            
            // Use the scaled height for viewBox to match the coordinate system
            const viewBoxHeight = scaledMapHeight;
            
            let html = `
            <div class="map-container">
                <svg class="world-map" viewBox="0 0 ${MAP_WIDTH} ${viewBoxHeight}" preserveAspectRatio="xMidYMid meet">
                    <!-- World outline paths from map1.svg -->
                    ${worldPaths}

                    <!-- Location pins -->
                    ${renderPins()}
                </svg>

                <!-- Tooltip -->
                <div class="map-tooltip" id="mapTooltip" hidden>
                    <div class="tooltip-content">
                        <h3 class="tooltip-name"></h3>
                        <p class="tooltip-description"></p>
                        <a class="tooltip-link" href="#">View content</a>
                    </div>
                </div>
            </div>
        `;

            container.innerHTML = html;
            tooltip = document.getElementById('mapTooltip');

            // Add event listeners for pins
            setupPinInteractions();
        } catch (error) {
            console.error('Error rendering map:', error);
            if (container) {
                container.innerHTML = `
                    <div class="map-error">
                        <h2>Failed to load map</h2>
                        <p>${error.message}</p>
                    </div>
                `;
            }
        } finally {
            isRendering = false;
        }
    }
    

    // Render location pins as SVG circles
    function renderPins() {
        return locationsData.locations.map(location => {
            // Use svgPosition from location data if available, otherwise calculate from lat/lng
            let x, y;
            if (location.svgPosition && location.svgPosition.x !== undefined && location.svgPosition.y !== undefined) {
                x = location.svgPosition.x;
                y = location.svgPosition.y;
            } else {
                const coords = latLngToSvg(location.coordinates.lat, location.coordinates.lng);
                x = coords.x;
                y = coords.y;
            }
            
            const hasLink = location.linkedContent !== null;

            return `
                <g class="map-pin${hasLink ? ' has-link' : ''}"
                   data-location-id="${location.id}"
                   data-x="${x}"
                   data-y="${y}"
                   transform="translate(${x}, ${y})">
                    <circle class="pin-outer" r="8" data-location-id="${location.id}" />
                    <circle class="pin-inner" r="4" />
                    <text class="pin-coords" x="15" y="5" fill="#ffff00" font-size="10" font-family="monospace">${x.toFixed(0)}, ${y.toFixed(0)}</text>
                </g>
            `;
        }).join('');
    }

    // Setup pin hover/click interactions
    function setupPinInteractions() {
        const pins = container.querySelectorAll('.map-pin');

        pins.forEach(pin => {
            // Attach hover events to show tooltips
            pin.addEventListener('mouseenter', handlePinHover);
            pin.addEventListener('mousemove', handlePinHover); // Update position as mouse moves
            pin.addEventListener('mouseleave', handlePinLeave);
        });
        
        // Also handle tooltip hover to keep it open
        if (tooltip) {
            tooltip.addEventListener('mouseenter', () => {
                tooltip.hidden = false;
            });
            tooltip.addEventListener('mouseleave', () => {
                tooltip.hidden = true;
            });
        }
    }
    
    // Handle pin hover
    function handlePinHover(e) {
        
        const pin = e.currentTarget;
        const locationId = pin.dataset.locationId;
        const location = locationsData.locations.find(l => l.id === locationId);

        if (!location || !tooltip) return;
        
        // Clear any pending timeout
        if (pin.hoverTimeout) {
            clearTimeout(pin.hoverTimeout);
            pin.hoverTimeout = null;
        }

        // Update tooltip content
        tooltip.querySelector('.tooltip-name').textContent = `${location.name}, ${location.country}`;
        tooltip.querySelector('.tooltip-description').textContent = location.description;

        const link = tooltip.querySelector('.tooltip-link');
        if (location.linkedContent) {
            link.hidden = false;
            if (location.linkedContent.type === 'collection') {
                link.href = `?id=${location.linkedContent.gallery}&collection=${location.linkedContent.id}`;
            } else if (location.linkedContent.type === 'post') {
                link.href = `?id=${location.linkedContent.id}`;
            }
            link.onclick = (e) => {
                e.preventDefault();
                if (typeof Router !== 'undefined') {
                    const url = link.href;
                    const params = new URLSearchParams(url.split('?')[1]);
                    const postId = params.get('id');
                    const collectionId = params.get('collection');
                    if (collectionId) {
                        history.pushState({}, '', `?id=${postId}&collection=${collectionId}`);
                    }
                    Router.navigateToPost(postId);
                }
            };
        } else {
            link.hidden = true;
        }

        // Position tooltip near mouse cursor
        // Get the map-container element (parent of tooltip)
        const mapContainer = container.querySelector('.map-container');
        if (!mapContainer) return;
        
        const containerRect = mapContainer.getBoundingClientRect();
        const mouseX = e.clientX - containerRect.left;
        const mouseY = e.clientY - containerRect.top;
        
        // Offset from cursor (to the right and slightly below)
        const offsetX = 15;
        const offsetY = 15;
        
        let left = mouseX + offsetX;
        let top = mouseY + offsetY;

        // Prevent tooltip from going off screen
        const tooltipWidth = 250; // Approximate tooltip width
        const tooltipHeight = 150; // Approximate tooltip height
        
        if (left + tooltipWidth > containerRect.width) {
            // Position to the left of cursor instead
            left = mouseX - tooltipWidth - offsetX;
        }
        
        if (top + tooltipHeight > containerRect.height) {
            // Position above cursor instead
            top = mouseY - tooltipHeight - offsetY;
        }
        
        // Ensure tooltip stays within bounds
        left = Math.max(10, Math.min(left, containerRect.width - tooltipWidth - 10));
        top = Math.max(10, Math.min(top, containerRect.height - tooltipHeight - 10));

        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
        tooltip.hidden = false;
    }

    // Handle pin leave
    function handlePinLeave(e) {
        
        const pin = e.currentTarget;
        
        // Clear any pending timeout
        if (pin.hoverTimeout) {
            clearTimeout(pin.hoverTimeout);
            pin.hoverTimeout = null;
        }
        
        // Small delay to allow moving to tooltip
        pin.hoverTimeout = setTimeout(() => {
            if (!tooltip.matches(':hover')) {
                tooltip.hidden = true;
            }
            pin.hoverTimeout = null;
        }, 100);
    }

    // Handle pin click
    function handlePinClick(e) {
        const pin = e.currentTarget;
        const locationId = pin.dataset.locationId;
        const location = locationsData.locations.find(l => l.id === locationId);

        if (location && location.linkedContent) {
            let url;
            if (location.linkedContent.type === 'collection') {
                url = `?id=${location.linkedContent.gallery}&collection=${location.linkedContent.id}`;
            } else if (location.linkedContent.type === 'post') {
                url = `?id=${location.linkedContent.id}`;
            }

            if (url && typeof Router !== 'undefined') {
                e.preventDefault();
                const params = new URLSearchParams(url.substring(1));
                const postId = params.get('id');
                const collectionId = params.get('collection');
                if (collectionId) {
                    history.pushState({}, '', `?id=${postId}&collection=${collectionId}`);
                }
                Router.navigateToPost(postId);
            }
        }
    }

    // Load world map paths from map1.svg
    // Original SVG viewBox: 0 0 2000 1280
    // Target viewBox: 0 0 1000 500 (equirectangular projection)
    // Scale map to fit width, then adjust for proper equirectangular projection
    async function loadWorldMapPaths() {
        try {
            const response = await fetch('/map1.svg');
            if (!response.ok) throw new Error('Failed to load world map');
            const svgText = await response.text();
            
            // Extract paths using regex
            const outlineMatch = svgText.match(/<path id="outline" d="([^"]+)"/);
            const boundariesMatch = svgText.match(/<path id="boundaries"[^>]*d="([^"]+)"/);
            
            if (outlineMatch && boundariesMatch) {
                // Use uniform scaling to match the coordinate conversion
                // Scale based on width to maintain aspect ratio
                const uniformScale = MAP_WIDTH / 2000;
                
                return `
                    <g transform="scale(${uniformScale})">
                        <path class="world-outline" d="${outlineMatch[1]}" />
                        <path class="world-boundaries" d="${boundariesMatch[1]}" />
                    </g>
                `;
            }
        } catch (error) {
            console.error('Error loading world map paths:', error);
        }
        return '';
    }

    return {
        render
    };
})();
