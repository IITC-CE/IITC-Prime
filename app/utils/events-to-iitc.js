/**
 * Shows or hides the basemap or overlay layer with id `id`.
 * @param {number} id The layer ID
 * @param {boolean} show Pass `false` to hide the layer
 */
export const showLayer = (id, show) => {
  return "window.layerChooser.showLayer(" + id + "," + show + ");";
}
