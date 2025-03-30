//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

/**
 * Shows or hides the basemap or overlay layer with id `id`.
 * @param {number} id The layer ID
 * @param {boolean} show Pass `false` to hide the layer
 */
export const showLayer = (id, show) => {
  return "window.layerChooser.showLayer(" + id + "," + show + "); true";
}

/**
 * Changes active portal highlighter
 * @param {string} name Highlighter name
 */
export const changePortalHighlights = (name) => {
  return "window.changePortalHighlights('" + name + "'); true";
}

/**
 * Switching the active panel.
 * @param {string} name Panel ID
 */
export const switchToPane = (name) => {
  return "window.show('" + name + "'); true";
}
