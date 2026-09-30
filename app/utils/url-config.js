// Copyright (C) 2024-2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

import store from '@/store';

export const INGRESS_INTEL_MAP = 'https://intel.ingress.com/intel';

// Public demo server serving sample data without an Ingress sign-in.
export const DEMO_INTEL_HOST = 'demo.iitc.app';
export const DEMO_INTEL_MAP = `https://${DEMO_INTEL_HOST}/intel`;

export const INITIAL_INTERNAL_HOSTNAMES = [
  'intel.ingress.com',
  'signin.nianticlabs.com',
  'signin.nianticspatial.com',
  DEMO_INTEL_HOST,
];

const INTEL_HOSTS = new Set(['intel.ingress.com', DEMO_INTEL_HOST]);

// Hosts a Google or Apple sign-in flow passes through; Google may use a country domain
const LOGIN_HOST_PATTERNS = [
  /^(accounts|myaccount|appengine|gds)\.google\.(com|[a-z]{2}|com?\.[a-z]{2})$/,
  /^accounts\.youtube\.com$/,
  /^appleid\.apple\.com$/,
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

const hostnameOf = url => {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
};

/**
 * True if the URL points at the Intel map host
 * @param {string} url
 * @returns {boolean}
 */
export const isIntelUrl = url => INTEL_HOSTS.has(hostnameOf(url));

/**
 * True if the URL points at the public demo server host
 * @param {string} url
 * @returns {boolean}
 */
export const isDemoUrl = url => hostnameOf(url) === DEMO_INTEL_HOST;

/**
 * True if the URL points at a sign-in provider page
 * @param {string} url
 * @returns {boolean}
 */
export const isLoginUrl = url => {
  const hostname = hostnameOf(url);
  return LOGIN_HOST_PATTERNS.some(pattern => pattern.test(hostname));
};

/**
 * True if the URL host is one of the hostnames or their subdomain
 * @param {string} url
 * @param {string[]} hostnames
 * @returns {boolean}
 */
export const isUrlOnHostnames = (url, hostnames) => {
  const hostname = hostnameOf(url);
  return hostnames.some(domain => hostname === domain || hostname.endsWith('.' + domain));
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
