// Copyright (C) 2025 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

import { registerUniversalLinkCallback, getUniversalLink } from '@nativescript-community/universal-links';
import { INGRESS_INTEL_MAP } from './url-config';
import store from '@/store';



/**
 * Convert deep link URL to intel.ingress.com URL
 * @param {string} url - The incoming deep link URL
 * @returns {string|null} Intel map URL
 */
const convertDeepLinkToIntelUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return null;
  }

  if (url.includes('://intel.ingress.com')) {
    return url;
  }

  // For iitc:// scheme, convert to ingress intel map page
  if (url.startsWith('iitc://')) {
    return url.replace('iitc://', INGRESS_INTEL_MAP);
  }

  return null;
};

/**
 * Initialize deep link handling
 */
export const handleDeepLink = () => {
  try {
    // Set up universal links handler for future links (when app is running)
    registerUniversalLinkCallback((universalLink) => {
      const url = universalLink?.href || universalLink;
      processDeepLink(url);
    });

    // Check if app was launched with a deep link
    const initialLink = getUniversalLink();
    if (initialLink) {
      const url = initialLink?.href || initialLink;
      processDeepLink(url);
    }
  } catch (error) {
    console.error('Failed to initialize deep link handler:', error);
  }
};

/**
 * Process any deep link URL and update currentUrl
 * @param {string} url - The deep link URL
 */
const processDeepLink = (url) => {
  if (!url) return;

  const intelUrl = convertDeepLinkToIntelUrl(url);
  if (intelUrl) {
    store.dispatch('ui/setCurrentUrl', intelUrl);
  }
};

