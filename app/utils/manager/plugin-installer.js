// Copyright (C) 2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

import { fetchResource, parseMeta } from 'lib-iitc-manager';
import { toRaw } from 'vue';
import store from '@/store';

/**
 * Download plugin code from URL
 * @param {string} url - Plugin URL
 * @returns {Promise<{ code: string, filename: string }>}
 */
export async function downloadPlugin(url) {
  const { data: code } = await fetchResource(url);
  if (!code) {
    throw new Error('Failed to download plugin. Check the URL and try again.');
  }
  const filename = url.substr(url.lastIndexOf('/') + 1);
  return { code, filename };
}

/**
 * Validate plugin code and extract metadata.
 * @param {string} code - Plugin JavaScript source code
 * @param {string} [filename] - Original filename
 * @returns {{ meta: Object, code: string }}
 * @throws {Error} if code is not a valid userscript
 */
export function parsePlugin(code, filename) {
  // Strip NUL bytes from FAT32/exFAT cluster-padding when reading files via Android ContentResolver
  code = code.replaceAll('\x00', '');

  const meta = parseMeta(code);
  if (!meta || !meta.name) {
    throw new Error('Invalid userscript. The file must contain a valid ==UserScript== header.');
  }

  if (filename) {
    meta.filename = filename;
  }

  return { meta, code };
}

/**
 * Install a previously parsed plugin into the store.
 * @param {Object} meta - Plugin metadata from parsePlugin
 * @param {string} code - Plugin source code from parsePlugin
 */
export async function installPlugin(meta, code) {
  await store.dispatch('manager/addUserScripts', [{ meta: toRaw(meta), code }]);
}
