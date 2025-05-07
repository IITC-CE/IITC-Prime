//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

import { Dialogs } from "@nativescript/core";
import { shareContent } from "~/utils/platform";

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
    return Dialogs.action(options).then(result => {
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
            const primeUrl = `https://link.ingress.com/?link=https%3A%2F%2Fintel.ingress.com%2Fportal%2F${guid || ''}&apn=com.nianticproject.ingress&isi=576505181&ibi=com.google.ingress&ifl=https%3A%2F%2Fapps.apple.com%2Fapp%2Fingress%2Fid576505181&ofl=https%3A%2F%2Fintel.ingress.com%2Fintel%3Fpll%3D${lat}%2C${lng}`;
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
