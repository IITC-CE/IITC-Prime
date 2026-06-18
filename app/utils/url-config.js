// Copyright (C) 2024-2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

import store from '@/store';

export const INGRESS_INTEL_MAP = 'https://intel.ingress.com/intel';

export const INITIAL_INTERNAL_HOSTNAMES = [
  'intel.ingress.com',
  'signin.nianticlabs.com',
  'signin.nianticspatial.com',
];

// Schemes a WebView renders itself; anything else is an app/deep link
// (tg:, mailto:, geo:, ...) that must be handed to the OS instead of loaded.
const WEBVIEW_SCHEMES = new Set([
  'http',
  'https',
  'about',
  'file',
  'data',
  'blob',
  'javascript',
  'x-local',
]);

/**
 * True if the URL points at the Intel map host
 * @param {string} url
 * @returns {boolean}
 */
export const isIntelUrl = url => {
  if (!url) return false;
  try {
    return new URL(url).hostname === 'intel.ingress.com';
  } catch {
    return false;
  }
};

/**
 * True for URLs whose scheme points at an external app (deep link) rather than web
 * content the WebView can display.
 * @param {string} url
 * @returns {boolean}
 */
export const isExternalAppSchemeUrl = url => {
  if (!url) return false;
  const match = /^([a-zA-Z][a-zA-Z0-9+.-]*):/.exec(url);
  if (!match) return false;
  return !WEBVIEW_SCHEMES.has(match[1].toLowerCase());
};

/**
 * Add viewport parameter to URL for desktop/mobile mode switching
 * vp=f enables desktop mode, vp=m is the default mobile view
 * @param {string} url - The base URL
 * @returns {string} URL with viewport parameter based on current settings
 */
export const addViewportParam = url => {
  if (!url) return url;

  const desktopMode = store.getters['settings/isDesktopMode'];
  const viewportParam = desktopMode ? 'f' : 'm';

  const parsed = new URL(url);
  parsed.searchParams.set('vp', viewportParam);
  return parsed.toString();
};
