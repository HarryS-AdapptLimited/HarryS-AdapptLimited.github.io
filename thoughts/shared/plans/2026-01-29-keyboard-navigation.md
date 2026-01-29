# Keyboard Navigation Implementation Plan

**Created:** 2026-01-29
**Status:** Ready for Implementation

## Overview

Add full keyboard navigation across the site, enabling users to navigate with arrow keys, Enter, and Escape keys.

## Current State

- **Gallery Viewer**: Has ArrowLeft/Right for images, ArrowUp/Down for view switching
- **ESC Key**: Goes back through views
- **Homepage Grid**: Click only, no keyboard navigation
- **Gallery Collections**: Click only, no keyboard navigation
- **Gallery Grid View**: Click only, no keyboard navigation

## Implementation Phases

### Phase 1: Homepage Grid Keyboard Navigation

**Files to modify:**
- `js/main.js` - Add keyboard event handling
- `css/style.css` - Add focus indicator styles

**Changes:**
1. Track selected cell index in main.js
2. Add keydown handler for Arrow keys to move selection
3. Handle Enter key to navigate to selected post
4. Add `.keyboard-focus` CSS class for visual indicator
5. Clear selection on mouse interaction (return to hover-based UX)

**Grid navigation logic:**
- The grid has positions 0-11 (outer ring) and center (4 cells)
- Arrow navigation should follow visual layout (4 columns)
- Only navigate to cells with posts (have href attribute)

**Success criteria:**
- [x] Arrow keys move visual focus through grid cells
- [x] Enter opens the focused cell's post
- [x] ESC clears keyboard focus
- [x] Mouse interaction hides keyboard focus indicator
- [x] Visual focus indicator is clearly visible in both themes

### Phase 2: Gallery Collections Keyboard Navigation

**Files to modify:**
- `js/gallery.js` - Add collections view keyboard handling
- `css/gallery.css` - Add focus styles for collection items

**Changes:**
1. Track selected collection index when in collections view
2. Up/Down arrows move selection between collections
3. Enter opens selected collection
4. Add visual focus indicator for selected collection

**Success criteria:**
- [x] Up/Down arrows move through collections
- [x] Enter opens the selected collection
- [x] Visual focus indicator shows which collection is selected
- [x] Mouse hover still works as before

### Phase 3: Gallery Grid View Keyboard Navigation

**Files to modify:**
- `js/gallery.js` - Add grid view keyboard handling
- `css/gallery.css` - Add focus styles for grid thumbnails

**Changes:**
1. Track selected thumbnail index when in grid view
2. Arrow keys navigate the grid (respecting column layout)
3. Enter opens selected thumbnail in viewer
4. Add visual focus indicator for selected thumbnail

**Success criteria:**
- [x] Arrow keys navigate through grid thumbnails
- [x] Enter opens the selected image in viewer
- [x] Visual focus indicator shows which thumbnail is selected
- [x] ESC returns to viewer or collections view

## Testing Notes

- Test in both light and dark themes
- Verify focus indicators are visible and don't conflict with hover states
- Ensure Tab key still works for accessibility
- Test keyboard + mouse interaction switching
