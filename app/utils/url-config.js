// Copyright (C) 2024-2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

import store from '@/store';

export const INGRESS_INTEL_MAP = 'https://intel.ingress.com/';

export const INITIAL_INTERNAL_HOSTNAMES = [
  'intel.ingress.com',
  'signin.nianticlabs.com',
  'signin.nianticspatial.com',
];

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
