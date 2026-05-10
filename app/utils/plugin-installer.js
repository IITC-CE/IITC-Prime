// Copyright (C) 2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

import { fetchResource, parseMeta } from 'lib-iitc-manager';
import { confirm } from '@/utils/dialogs';
import store from '@/store';

/**
 * Format plugin metadata into a human-readable message string.
 * @param {Object} plugin - Plugin metadata object
 * @returns {string}
 */
export function formatPluginInfo(plugin) {
  return [
    plugin.description ? `${plugin.description}\n` : null,
    plugin.version ? `Version: ${plugin.version}` : null,
    `Category: ${plugin.category || 'Misc'}`,
    plugin.author ? `Author: ${plugin.author}` : null,
  ]
    .filter(Boolean)
    .join('\n');
}

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
 * Validate plugin code, show confirmation dialog, and install.
 * @param {string} code - Plugin JavaScript source code
 * @param {string} [filename] - Original filename
 * @returns {Promise<boolean>} true if installed, false if cancelled
 * @throws {Error} if code is not a valid userscript
 */
export async function confirmAndInstallPlugin(code, filename) {
  // Strip NUL bytes from FAT32/exFAT cluster-padding when reading files via Android ContentResolver
  code = code.replaceAll('\x00', '');

  const meta = parseMeta(code);
  if (!meta || !meta.name) {
    throw new Error('Invalid userscript. The file must contain a valid ==UserScript== header.');
  }

  if (filename) {
    meta.filename = filename;
  }

  const confirmed = await confirm({
    title: meta.name,
    message: formatPluginInfo(meta),
    okButtonText: 'Add',
    cancelButtonText: 'Cancel',
  });

  if (!confirmed) return false;

  await store.dispatch('manager/addUserScripts', [{ meta, code }]);
  return true;
}
