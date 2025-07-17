// Copyright (C) 2021-2025 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

import store from "@/store";
import { showLocationShareOptions } from "./share";


/**
 * Handles request to share geographic position
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} zoom - Map zoom level
 * @param {string} title - Location title
 * @param {boolean} isPortal - Whether this is a portal location
 * @param {string} guid - Portal's globally unique identifier
 * @returns {Promise<boolean>} Success status
 */
export const sharePosition = (lat, lng, zoom, title, isPortal, guid) => {
  return showLocationShareOptions(lat, lng, title, isPortal, guid);
}

/**
 * Returns the versionName of mobile app
 * @returns {string}
 */
export const getVersionName = () => {
  const appVersionName = require("@nativescript/appversion");
  return appVersionName.getVersionNameSync();
}

/**
 * Fires when IITC completes its initialization process
 */
export const bootFinished = async (name) => {
  await store.dispatch('ui/iitcBootFinished');
}

/**
 * Switching the active panel, if required.
 * @param {string} name Panel ID
 */
export const switchToPane = async (name) => {
  if (store.state.navigation.currentPane !== name) {
    await store.dispatch('navigation/setCurrentPane', name);
  }
}

/**
 * Assigns the basemap and overlay layers.
 * @param {Array.Object.<string, number|string|boolean>} base_layers List of objects of map providers
 * @param {Array.Object.<string, number|string|boolean>} overlay_layer List of objects of overlay layers
 */
export const setLayers = async (base_layers, overlay_layer) => {
  await store.dispatch('map/setBaseLayers', base_layers);
  await store.dispatch('map/setOverlayLayers', overlay_layer);
}

/**
 * Adds a new portal highlighter to the available list
 * @param {string} name Highlighter name
 */
export const addPortalHighlighter = async (name) => {
  await store.dispatch('map/addHighlighter', name);
}

/**
 * Sets the active portal highlighter
 * @param {string} name Highlighter name
 */
export const setActiveHighlighter = async (name) => {
  await store.dispatch('map/setActiveHighlighter', name);
}

/**
 * Adding IITC panels. Panels allow to display some windows in full screen in mobile IITC.
 * @param {string} name Panel ID
 * @param {string} label Display name
 * @param {string} icon Icon name
 */
export const addPane = async (name, label, icon) => {
  if (!store.state.navigation.panes.find(o => o.name === name)) {
    await store.dispatch('navigation/addPane', {name: name, label: label, icon: icon});
  }
}

/**
 * Handles portal status data from IITC
 * @param {string} guid - Portal's globally unique identifier
 * @param {string} team - Portal's team (faction)
 * @param {number} level - Portal's level
 * @param {string} title - Portal's name/title
 * @param {number} health - Portal's health percentage
 * @param {Array} resonators - Portal's resonators data
 * @param {string} levelColor - Portal's level color
 */
export const setPortalStatus = async (guid, team, level, title, health, resonators, levelColor) => {
  const data = {
    guid,
    team,
    level,
    isNeutral: team === 'N' || team === 'NEUTRAL',
    title,
    health,
    resonators: resonators || [],
    levelColor,
  };
  await store.dispatch('map/setPortalStatus', data);
}

/**
 * Handles map status data from IITC
 * @param {Object} portalLevels - Information about visible portal levels and link lengths
 * @param {Object} mapStatus - Current map loading status and progress
 * @param {Object} requests - Active and failed request counts
 */
export const setMapStatus = async (portalLevels, mapStatus, requests) => {
  const data = {
    portalLevels,
    mapStatus,
    requests
  };
  await store.dispatch('map/setMapStatus', data);
}

/**
 * Sets the progress of loading page resources.
 * @param {number} progress Number from 0 to 1. If there is request, but it is impossible to determine progress, then -1.
 */
export const setProgress = async (progress) => {
  if (progress !== -1) {
    // maximum for setProgress is 100
    await store.dispatch('ui/setProgress', Math.round(progress * 100));
  } else {
    await store.dispatch('ui/setProgress', 0);
  }
}

/**
 * Adds a new domain to the allowed domains list
 * @param {string} domain Domain name to add
 */
export const addInternalHostname = async (domain) => {
  await store.dispatch('map/addInternalHostname', domain);
}

/**
 * Handles follow mode state changes from IITC user location plugin
 * @param {boolean} follow - Whether follow mode is active
 */
export const setFollowMode = async (follow) => {
  await store.dispatch('map/setFollowingUser', follow);
}
