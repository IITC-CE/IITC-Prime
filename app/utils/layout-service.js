//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

import { Observable, Screen } from '@nativescript/core';

/**
 * LayoutService - Manages application layout calculations based on actual measurements
 *
 * This service handles measuring the available screen space and
 * calculating various layout dimensions based on the current screen state.
 */
class LayoutService extends Observable {
    constructor(options = {}) {
        super();

        // Default configuration
        this.config = {
            defaultPanelWidth: 500,
            bottomPadding: 100,
            tabletWidthThreshold: 600,
            ...options
        };

        // Current screen dimensions
        this._dimensions = {
            availableWidth: 0,
            availableHeight: 0,
            bottomPadding: this.config.bottomPadding,
            panelWidth: 0,
            isTablet: false,
            isLandscape: false
        };

        this._initialized = false;
    }

    /**
     * Get the current layout dimensions
     * @returns {Object} All calculated layout dimensions
     */
    get dimensions() {
        return { ...this._dimensions };
    }

    /**
     * Check if the service has been initialized
     */
    get isInitialized() {
        return this._initialized;
    }

    /**
     * Initialize with default screen dimensions
     * Called when component is created but before rootLayout is available
     */
    initWithDefaults() {
        const { widthDIPs, heightDIPs } = Screen.mainScreen;
        this._updateDimensions(widthDIPs, heightDIPs);
    }

    /**
     * Measure the actual available size from the root container
     * Call this from the layoutChanged event of RootLayout
     *
     * @param {Object} rootView - Reference to the root NativeView element
     */
    measureLayout(rootView) {
        if (!rootView) {
            console.error("LayoutService: No rootView provided to measureLayout");
            return;
        }

        // Get the real dimensions of the container
        const measuredWidth = rootView.getMeasuredWidth();
        const measuredHeight = rootView.getMeasuredHeight();

        // Get screen scale from Screen.mainScreen
        const scale = Screen.mainScreen.scale;

        // Calculate available space in DIPs (device-independent pixels)
        const width = measuredWidth / scale;
        const height = measuredHeight / scale;

        // Update all layout calculations
        this._updateDimensions(width, height);
    }

    /**
     * Update all layout dimensions based on the available screen space
     *
     * @param {number} width - Available width in DIPs
     * @param {number} height - Available height in DIPs
     * @private
     */
    _updateDimensions(width, height) {
        // Store previous values for comparison
        const previousDimensions = { ...this._dimensions };

        // Determine orientation and device type
        const isLandscape = width > height;
        const isTablet = width > this.config.tabletWidthThreshold;

        // Calculate bottom padding based on orientation and device type
        const bottomPadding = this._calculateBottomPadding(width, height);

        // Calculate panel width
        const panelWidth = this._calculatePanelWidth(width, height);

        // Update dimensions
        this._dimensions = {
            availableWidth: width,
            availableHeight: height,
            bottomPadding,
            panelWidth,
            isTablet,
            isLandscape
        };

        // Mark as initialized
        if (!this._initialized) {
            this._initialized = true;
        }

        // Notify listeners if important dimensions have changed
        if (this._hasDimensionsChanged(previousDimensions, this._dimensions)) {
            this.notify({
                eventName: 'layoutChanged',
                object: this,
                dimensions: this._dimensions,
                previousDimensions
            });
        }
    }

    /**
     * Calculate bottom padding based on device orientation and size
     *
     * @param {number} width - Available width
     * @param {number} height - Available height
     * @returns {number} Calculated bottom padding
     * @private
     */
    _calculateBottomPadding(width, height) {
        if (width <= height) {
            // Portrait mode
            return this.config.bottomPadding;
        }

        // Landscape mode
        return width > this.config.tabletWidthThreshold ? 0 : this.config.bottomPadding;
    }

    /**
     * Calculate panel width based on device orientation and size
     *
     * @param {number} width - Available width
     * @param {number} height - Available height
     * @returns {number} Calculated panel width
     * @private
     */
    _calculatePanelWidth(width, height) {
        if (width <= height) {
            // Portrait mode - panel takes full width
            return width;
        }

        // Landscape mode - either use fixed width for tablets or available width
        return width > this.config.tabletWidthThreshold
            ? this.config.defaultPanelWidth
            : width;
    }

    /**
     * Check if important dimensions have changed
     *
     * @param {Object} prev - Previous dimensions
     * @param {Object} curr - Current dimensions
     * @returns {boolean} Whether important dimensions have changed
     * @private
     */
    _hasDimensionsChanged(prev, curr) {
        return (
            Math.abs(prev.availableWidth - curr.availableWidth) > 1 ||
            Math.abs(prev.availableHeight - curr.availableHeight) > 1 ||
            prev.bottomPadding !== curr.bottomPadding ||
            prev.panelWidth !== curr.panelWidth ||
            prev.isLandscape !== curr.isLandscape
        );
    }

    /**
     * Add a listener for layout change events
     *
     * @param {Function} callback - Function to call when layout changes
     * @returns {Function} Function to remove the listener
     */
    addLayoutChangeListener(callback) {
        this.on('layoutChanged', callback);
        return () => this.off('layoutChanged', callback);
    }

    /**
     * Reset the service state
     * Useful when navigating between pages
     */
    reset() {
        this._dimensions = {
            availableWidth: 0,
            availableHeight: 0,
            bottomPadding: this.config.bottomPadding,
            panelWidth: 0,
            isTablet: false,
            isLandscape: false
        };
        this._initialized = false;
    }
}

// Create a default instance with standard configuration
export const layoutService = new LayoutService();

// Also export the class for custom instances
export { LayoutService };
