// Copyright (C) 2025-2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

import {
  registerUniversalLinkCallback,
  getUniversalLink,
} from '@nativescript-community/universal-links';
import { deepLinkToIntelUrl, isPluginUrl } from '@/utils/url-config';
import { readFileFromUri } from '@/utils/platform/system';
import store from '@/store';

/**
 * Initialize deep link handling
 */
export const handleDeepLink = () => {
  try {
    // Set up universal links handler for future links (when app is running)
    registerUniversalLinkCallback(universalLink => {
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
 * Check whether a URL can be handled as a deep link.
 * @param {string} url
 * @returns {boolean}
 */
export const isSupportedDeepLinkUrl = url => {
  if (!url || typeof url !== 'string') return false;
  return isPluginUrl(url) || deepLinkToIntelUrl(url) !== null;
};

/**
 * Process any deep link URL - either a plugin file/URL or an intel map link
 * @param {string} url - The deep link URL
 */
export const processDeepLink = url => {
  if (!url) return;

  // Check if this is a plugin URL/file
  if (isPluginUrl(url)) {
    processPluginLink(url);
    return;
  }

  const intelUrl = deepLinkToIntelUrl(url);
  if (intelUrl) {
    store.dispatch('ui/setCurrentUrl', intelUrl);
  }
};

/**
 * Process a plugin link - either download URL or local file URI
 * @param {string} url
 */
const processPluginLink = url => {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    // Remote .user.js URL - pass to AddPluginSheet to download
    store.dispatch('ui/setPendingPlugin', { type: 'url', value: url });
  } else {
    // Local file (content:// or file://) - read immediately
    try {
      const { content, name } = readFileFromUri(url);
      if (content) {
        store.dispatch('ui/setPendingPlugin', { type: 'file', code: content, filename: name });
      }
    } catch (error) {
      console.error('Failed to read plugin file:', error);
    }
  }
};
