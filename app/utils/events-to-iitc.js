// Copyright (C) 2021-2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

/**
 * Shows or hides the basemap or overlay layer with id `id`.
 * @param {number} id The layer ID
 * @param {boolean} show Pass `false` to hide the layer
 */
export const showLayer = (id, show) => {
  return 'window.layerChooser.showLayer(' + id + ',' + show + '); true';
};

/**
 * Changes active portal highlighter
 * @param {string} name Highlighter name
 */
export const changePortalHighlights = name => {
  return "window.changePortalHighlights('" + name + "'); true";
};

/**
 * Switching the active panel.
 * @param {string} name Panel ID
 */
export const switchToPane = name => {
  return "window.show('" + name + "'); true";
};

/**
 * Trigger locate action in `user-location` plugin
 * @param {number} lat Latitude
 * @param {number} lng Longitude
 * @param {number} accuracy Accuracy in meters
 * @param {boolean} persistentZoom Keep current zoom level
 */
export const userLocationLocate = (lat, lng, accuracy, persistentZoom) => {
  return `window.plugin?.userLocation?.locate(${lat}, ${lng}, ${accuracy}, ${persistentZoom}); true`;
};

/**
 * Update user location in `user-location` plugin
 * @param {number} lat Latitude
 * @param {number} lng Longitude
 */
export const userLocationUpdate = (lat, lng) => {
  return `window.plugin?.userLocation?.onLocationChange(${lat}, ${lng}); true`;
};

/**
 * Update user orientation in `user-location` plugin
 * @param {number|null} direction Direction in degrees (null to show circle)
 */
export const userLocationOrientation = direction => {
  return `window.plugin?.userLocation?.onOrientationChange(${direction}); true`;
};

/**
 * Sets the view of the map
 * @param {number} lat Latitude
 * @param {number} lng Longitude
 * @param {boolean} persistentZoom Keep current zoom level
 */
export const setView = (lat, lng, persistentZoom) => {
  const zoom = persistentZoom ? 'window.map.getZoom()' : 'window.DEFAULT_ZOOM';
  return `window.map.setView([${lat}, ${lng}], ${zoom}); true`;
};

/**
 * Sets CSS safe area insets for all four sides.
 * Values are in DIPs, which are numerically equivalent to CSS px in a WebView.
 * @param {number} top Top inset in DIPs
 * @param {number} bottom Bottom inset in DIPs
 * @param {number} left Left inset in DIPs
 * @param {number} right Right inset in DIPs
 */
export const setSafeAreaInsets = (top = 0, bottom = 0, left = 0, right = 0) => {
  return `
    document.documentElement.style.setProperty('--safe-area-inset-top', '${top}px');
    document.documentElement.style.setProperty('--safe-area-inset-bottom', '${bottom}px');
    document.documentElement.style.setProperty('--safe-area-inset-left', '${left}px');
    document.documentElement.style.setProperty('--safe-area-inset-right', '${right}px');
    true
  `;
};
