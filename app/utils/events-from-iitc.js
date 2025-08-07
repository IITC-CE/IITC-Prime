// Copyright (C) 2021-2025 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

import store from "@/store";
import { showLocationShareOptions } from "./share";
import { shareFile, selectFiles, readFileContent } from '@/utils/file-manager';
import { copyToClipboard } from '@/utils/clipboard';


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
 * @param {Array|null} resonators - Portal's resonators data
 * @param {string} levelColor - Portal's level color
 * @param {boolean} isLoading - Boolean indicating if portal details are still loading
 */
export const setPortalStatus = async (guid, team, level, title, health, resonators, levelColor, isLoading) => {
  const data = {
    guid,
    team,
    level,
    isNeutral: team === 'N' || team === 'NEUTRAL',
    title,
    health,
    resonators,
    levelColor,
    isLoading,
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

/**
 * Handles file save requests from IITC
 * @param {string} filename - Name of the file to save
 * @param {string} dataType - MIME type of the file
 * @param {string} content - File content (text only)
 * @returns {Promise<Object>} Result object with success status
 */
export const saveFile = async (filename, dataType, content) => {
  try {
    await shareFile(filename, content);
    return { success: true };
  } catch (error) {
    console.error('Bridge saveFile error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Handles file selection requests from IITC
 * @param {boolean} allowsMultipleSelection - Whether multiple file selection is allowed
 * @param {Array<string>} acceptTypes - Array of accepted MIME types
 * @param {string} callbackId - Callback ID for response
 * @returns {Promise<void>} Calls callback with File objects
 */
export const chooseFiles = async (allowsMultipleSelection, acceptTypes, callbackId) => {
  try {
    const files = await selectFiles({
      allowsMultipleSelection: allowsMultipleSelection || false,
      acceptTypes: acceptTypes || ['*/*']
    });

    // Read file contents
    const fileContents = await Promise.all(
      files.map(async (file) => {
        try {
          const content = await readFileContent(file.path);
          return {
            name: content.name,
            content: content.content,
            type: content.type
          };
        } catch (error) {
          console.error('Failed to read file:', file.path, error);
          return null;
        }
      })
    );

    // Filter out failed reads
    const validFiles = fileContents.filter(f => f !== null);

    // Execute callback with File objects
    if (callbackId) {
      const callbackCode = `
        if (window.app._executeCallback) {
          var fileObjects = [];
          ${validFiles.map((file, index) => `
          var blob${index} = new Blob([${JSON.stringify(file.content)}], { type: '${file.type}' });
          var file${index} = new File([blob${index}], '${file.name}', {
            type: '${file.type}',
            lastModified: Date.now()
          });
          fileObjects.push(file${index});
          `).join('')}
          window.nsWebViewBridge._executeCallback('${callbackId}', fileObjects);
        }
      `;

      await store.dispatch('map/executeJavaScript', callbackCode);
    }

  } catch (error) {
    console.error('Bridge chooseFiles error:', error);

    // Execute callback with empty array on error
    if (callbackId) {
      await store.dispatch('map/executeJavaScript', `
        if (window.nsWebViewBridge._executeCallback) {
          window.nsWebViewBridge._executeCallback('${callbackId}', []);
        }
      `);
    }
  }
};

/**
 * Handles copy to clipboard requests from IITC
 * @param {string} text - Text to copy to clipboard
 * @returns {Promise<void>}
 */
export const copyToClipboardBridge = async (text) => {
  await copyToClipboard(text, "Copied to clipboard");
};
