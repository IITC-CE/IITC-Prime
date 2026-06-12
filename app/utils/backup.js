// Copyright (C) 2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

/**
 * Backup ZIP packing/unpacking.
 *
 * ZIP layout: `iitc.json` holds the data object, and external plugins are
 * stored as `<group>/<filename>` (group is `shared`, or a legacy channel).
 */

import JSZip from 'jszip';

export const BACKUP_JSON_NAME = 'iitc.json';

// `shared` is the current format; channel names are kept to read older backups.
const EXTERNAL_GROUPS = ['shared', 'release', 'beta', 'custom'];

const pad = n => (n < 10 ? `0${n}` : `${n}`);

/**
 * Formats a date as `YYYY-MM-DD_HH.MM.SS` for backup filenames.
 * @param {Date} date
 * @returns {string}
 */
export const formatDate = date =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_` +
  `${pad(date.getHours())}.${pad(date.getMinutes())}.${pad(date.getSeconds())}`;

/**
 * Default filename for a freshly created backup.
 * @returns {string}
 */
export const backupFilename = () => `iitc-backup_${formatDate(new Date())}.zip`;

/**
 * Packs a backup object (as produced by manager.getBackupData) into a zip,
 * returned as base64 for native file writing (see exportBackup in the worker).
 * @param {{ data: object, external_plugins: object }} backup
 * @returns {Promise<string>}
 */
export const createBackupZip = async backup => {
  const zip = new JSZip();

  zip.file(BACKUP_JSON_NAME, JSON.stringify(backup.data ?? {}));

  const external = backup.external_plugins ?? {};
  for (const group in external) {
    for (const filename in external[group]) {
      zip.file(`${group}/${filename}`, external[group][filename]);
    }
  }

  return zip.generateAsync({ type: 'base64' });
};

/**
 * Parses a backup zip into the object shape expected by manager.setBackupData.
 * @param {ArrayBuffer} arrayBuffer
 * @returns {Promise<{ data: object, external_plugins: object }>}
 */
export const parseBackupZip = async arrayBuffer => {
  const backup = {
    external_plugins: {},
    data: {},
  };

  const zip = await JSZip.loadAsync(arrayBuffer);

  for (const zipName in zip.files) {
    const entry = zip.files[zipName];
    if (entry.dir) continue;

    const filename = entry.name;

    if (filename === BACKUP_JSON_NAME) {
      backup.data = JSON.parse(await entry.async('string'));
      continue;
    }

    const parts = filename.split('/');
    if (parts.length > 1 && EXTERNAL_GROUPS.includes(parts[0])) {
      const group = parts[0];
      const pluginFilename = parts.slice(1).join('/');
      if (!backup.external_plugins[group]) {
        backup.external_plugins[group] = {};
      }
      backup.external_plugins[group][pluginFilename] = await entry.async('string');
    }
  }

  return backup;
};

const isNonEmptyObject = value =>
  typeof value === 'object' && value !== null && Object.keys(value).length !== 0;

/**
 * Reports which sections a parsed backup actually contains, so the UI can
 * enable only the relevant import options.
 * @param {{ data: object, external_plugins: object }} backup
 * @returns {{ has_settings: boolean, has_data: boolean, has_external: boolean }}
 */
export const getBackupInfo = backup => {
  const data = backup?.data ?? {};
  const external = backup?.external_plugins ?? {};

  return {
    has_settings: isNonEmptyObject(data.iitc_settings),
    has_data: isNonEmptyObject(data.plugins_data) || isNonEmptyObject(data.webview_storage),
    has_external: Object.keys(external).some(group => isNonEmptyObject(external[group])),
  };
};
