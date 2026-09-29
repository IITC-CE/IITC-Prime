// Copyright (C) 2025-2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

import { action } from '~/utils/dialogs';
import { l } from '@nativescript-community/l';
import { isIOS } from '@nativescript/core';
import { shareContent, getMapAppsIOS } from '~/utils/platform/system';
import { copyToClipboard } from '~/utils/clipboard';

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
    link: `https://intel.ingress.com/portal/${guid || ''}`,
  };
  const android = {
    apn: 'com.nianticproject.ingress',
  };
  const ios = {
    isi: '576505181',
    ibi: 'com.google.ingress',
    ifl: 'https://apps.apple.com/app/ingress/id576505181',
  };
  const other = {
    ofl: `https://intel.ingress.com/intel?pll=${lat},${lng}`,
  };

  // Construct URL with all parameters
  const url = new URL(base);
  for (const [key, value] of Object.entries({ ...link, ...android, ...ios, ...other })) {
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
    // Android lets the system chooser pick a map app; iOS has no equivalent,
    // so each installed map app gets its own entry
    const mapActions = isIOS
      ? getMapAppsIOS(lat, lng, title)
      : [
          {
            label: l('share.action.maps'),
            open: () => shareContent({ lat, lng }, 'geo', title),
          },
        ];

    const shareActions = [
      {
        label: l('share.action.text'),
        open: () => {
          const textContent = `${title ? title + '\n' : ''}Location: ${lat},${lng}`;
          return shareContent(textContent, 'text', title || 'Location');
        },
      },
      {
        label: l('share.action.link'),
        open: () => {
          const url = `https://intel.ingress.com/?ll=${lat},${lng}&z=17${isPortal ? `&pll=${lat},${lng}` : ''}`;
          return shareContent(url, 'url', title || 'Intel Map');
        },
      },
      {
        label: l('share.action.coordinates'),
        open: () =>
          copyToClipboard(`${lat},${lng}`, l('share.toast.coordinates_copied')).then(() => true),
      },
      ...mapActions,
    ];

    if (isPortal || guid) {
      shareActions.push({
        label: l('share.action.ingress_prime'),
        open: () => shareContent(makePrimeLink(guid, lat, lng), 'prime'),
      });
    }

    return action({
      title: l('share.title'),
      message: l('share.message'),
      cancelButtonText: l('dialog.cancel'),
      actions: shareActions.map(item => item.label),
    }).then(result => {
      const selected = shareActions.find(item => item.label === result);
      return selected ? selected.open() : false;
    });
  } catch (error) {
    console.error('Error showing location share options:', error);
    return Promise.resolve(false);
  }
};
