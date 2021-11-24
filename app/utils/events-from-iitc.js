import store from "@/store";

/**
 * Returns the versionName of mobile app
 * @returns {string}
 */
export const getVersionName = () => {
  const appVersionName = require("@nativescript/appversion");
  return appVersionName.getVersionNameSync();
}

/**
 * Assigns the basemap and overlay layers.
 * @param {Array.Object.<string, number|string|boolean>} base_layers List of objects of map providers
 * @param {Array.Object.<string, number|string|boolean>} overlay_layer List of objects of overlay layers
 */
export const setLayers = (base_layers, overlay_layer) => {
  store.dispatch('setBaseLayers', base_layers);
  store.dispatch('setOverlayLayers', overlay_layer);
}
