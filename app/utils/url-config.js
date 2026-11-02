// Copyright (C) 2024-2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

export const INGRESS_INTEL_MAP = 'https://intel.ingress.com/intel';

// Public demo server serving sample data without an Ingress sign-in.
export const DEMO_INTEL_HOST = 'demo.iitc.app';
export const DEMO_INTEL_MAP = `https://${DEMO_INTEL_HOST}/intel`;

export const INITIAL_INTERNAL_HOSTNAMES = [
  'intel.ingress.com',
  'login.ingress.com',
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
 * Where a URL opened from or inside a popup belongs
 * @param {string} url
 * @param {string[]} internalHostnames
 * @returns {'main'|'popup'|'external'}
 */
export const popupUrlTarget = (url, internalHostnames) => {
  if (isIntelUrl(url)) return 'main';
  if (isExternalAppSchemeUrl(url)) return 'external';
  // about:blank, data:, blob:, file:// are the popup's own content
  if (!/^https?:/i.test(url)) return 'popup';
  if (isUrlOnHostnames(url, internalHostnames) || isLoginUrl(url)) return 'popup';
  return 'external';
};

/**
 * True if the main WebView may load the URL; others open in the system browser
 * @param {string} url
 * @param {string[]} internalHostnames
 * @returns {boolean}
 */
export const isMainWebViewUrlAllowed = (url, internalHostnames) => {
  if (!internalHostnames.length) return true;

  // Allow internal/system URLs
  if (url === 'about:blank' || url?.startsWith('file://')) return true;

  // The Intel sign-in page redirects the main frame to the provider
  return isUrlOnHostnames(url, internalHostnames) || isLoginUrl(url);
};

/**
 * True if the URL points to a userscript plugin: a remote .user.js or a local file
 * @param {string} url
 * @returns {boolean}
 */
export const isPluginUrl = url => {
  if (!url || typeof url !== 'string') return false;
  if (/^https?:\/\/.+\.user\.js(\?.*)?$/i.test(url)) return true;
  return url.startsWith('content://') || url.startsWith('file://');
};

/**
 * Convert a deep link to the Intel map URL
 * @param {string} url - iitc:// link or an intel.ingress.com URL
 * @returns {string|null} Intel map URL, or null if the link is not for Intel or unparseable
 */
export const deepLinkToIntelUrl = url => {
  if (!url || typeof url !== 'string') return null;

  try {
    // Only the query is used, so iitc://intel?pll=… and iitc://intel.ingress.com/?pll=… both work
    if (url.startsWith('iitc://')) {
      return new URL(INGRESS_INTEL_MAP + new URL(url).search).toString();
    }

    if (url.includes('://intel.ingress.com')) {
      return new URL(url).toString();
    }
  } catch {
    return null;
  }

  return null;
};

/**
 * Add viewport parameter to URL for desktop/mobile mode switching
 * vp=f enables desktop mode, vp=m is the default mobile view
 * @param {string} url - The base URL
 * @param {boolean} desktopMode
 * @returns {string} URL with the viewport parameter
 */
export const addViewportParam = (url, desktopMode) => {
  if (!url) return url;

  const parsed = new URL(url);
  parsed.searchParams.set('vp', desktopMode ? 'f' : 'm');
  return parsed.toString();
};
