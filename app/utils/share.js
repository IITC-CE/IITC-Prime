// Copyright (C) 2025 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

import { action } from "@nativescript-community/ui-material-dialogs";
import { shareContent } from "~/utils/platform";

/**
 * Creates a link to open a specific portal in Ingress Prime.
 * Uses Firebase's Dynamic Links feature.
 * https://firebase.google.com/docs/dynamic-links/create-manually
 *
 * Based on approach from:
 * https://github.com/IITC-CE/ingress-intel-total-conversion/pull/817
 *
 * @param {string} guid - Portal's globally unique identifier
 * @param {number} lat - Latitude of the portal
 * @param {number} lng - Longitude of the portal
 * @returns {string} URL that opens Ingress Prime with portal details
 */
const makePrimeLink = (guid, lat, lng) => {
  const base = 'https://link.ingress.com/';

  // Define URL components
  const link = {
    'link': `https://intel.ingress.com/portal/${guid || ''}`
  };
  const android = {
    'apn': 'com.nianticproject.ingress'
  };
  const ios = {
    'isi': '576505181',
    'ibi': 'com.google.ingress',
    'ifl': 'https://apps.apple.com/app/ingress/id576505181'
  };
  const other = {
    'ofl': `https://intel.ingress.com/intel?pll=${lat},${lng}`
  };

  // Construct URL with all parameters
  const url = new URL(base);
  for (const [key, value] of Object.entries({...link, ...android, ...ios, ...other})) {
    url.searchParams.set(key, value);
  }

  return url.toString();
};

/**
 * Shows a dialog with location sharing options
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {string} title - Optional location title
 * @param {boolean} isPortal - Whether this location is a portal
 * @param {string} guid - Portal's globally unique identifier
 * @returns {Promise<boolean>} Success status
 */
export const showLocationShareOptions = (lat, lng, title = '', isPortal = false, guid = '') => {
  try {
    // Prepare options for the dialog
    const options = {
      title: "Share Location",
      message: "Choose how to share",
      cancelButtonText: "Cancel",
      actions: ["Share as text", "Open in maps", "Share link"]
    };

    // Add Ingress Prime option if it's a portal or has guid
    if (isPortal || guid) {
      options.actions.push("Open in Ingress Prime");
    }

    // Show dialog with options
    return action(options).then(result => {
      // User cancelled if result is undefined or equals cancelButtonText
      if (!result || result === options.cancelButtonText) return false;

      const index = options.actions.indexOf(result);
      if (index === -1) return false;

      switch (index) {
        case 0: // Share as text
          const textContent = `${title ? title + '\n' : ''}Location: ${lat},${lng}`;
          return shareContent(textContent, "text", title || "Location");

        case 1: // Open in maps
          return shareContent({lat, lng}, "geo", title);

        case 2: // Share link
          const url = `https://intel.ingress.com/?ll=${lat},${lng}&z=17${isPortal ? `&pll=${lat},${lng}` : ''}`;
          return shareContent(url, "url", title || "Intel Map");

        case 3: // Open in Ingress Prime (if available)
          if (options.actions.length > 3) {
            const primeUrl = makePrimeLink(guid, lat, lng);
            return shareContent(primeUrl, "prime");
          }
          return false;
      }

      return false;
    });
  } catch (error) {
    console.error("Error showing location share options:", error);
    return Promise.resolve(false);
  }
};
