//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

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

/**
 * Adding IITC panels. Panels allow to display some windows in full screen in mobile IITC.
 * @param {string} name Panel ID
 * @param {string} label Display name
 * @param {string} icon Icon name
 */
export const addPane = (name, label, icon) => {
  store.dispatch('addPane', {name: name, label: label, icon: icon});
}

/**
 * Sets the progress of loading page resources.
 * @param {number} progress Number from 0 to 1. If there is request, but it is impossible to determine progress, then -1.
 */
export const setProgress = (progress) => {
  if (progress !== -1) {
    // maximum for setProgress is 100
    store.dispatch('setProgress', Math.round(progress * 100));
  } else {
    store.dispatch('setProgress', 0);
  }
}
