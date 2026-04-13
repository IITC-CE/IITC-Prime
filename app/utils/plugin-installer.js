// Copyright (C) 2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

import { fetchResource, parseMeta } from 'lib-iitc-manager';
import { confirm } from '@/utils/dialogs';
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
 * Validate plugin code, show confirmation dialog, and install.
 * @param {string} code - Plugin JavaScript source code
 * @param {string} [filename] - Original filename
 * @returns {Promise<boolean>} true if installed, false if cancelled
 * @throws {Error} if code is not a valid userscript
 */
export async function confirmAndInstallPlugin(code, filename) {
  const meta = parseMeta(code);
  if (!meta || !meta.name) {
    throw new Error('Invalid userscript. The file must contain a valid ==UserScript== header.');
  }

  if (filename) {
    meta.filename = filename;
  }

  const message = [
    `Name: ${meta.name}`,
    meta.description ? `Description: ${meta.description}` : null,
    meta.version ? `Version: ${meta.version}` : null,
    `Category: ${meta.category || 'Misc'}`,
  ]
    .filter(Boolean)
    .join('\n');

  const confirmed = await confirm({
    title: 'Add plugin?',
    message,
    okButtonText: 'Add',
    cancelButtonText: 'Cancel',
  });

  if (!confirmed) return false;

  await store.dispatch('manager/addUserScripts', [{ meta, code }]);
  return true;
}
