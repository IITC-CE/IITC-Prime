// Copyright (C) 2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

import { File, knownFolders, path } from '@nativescript/core';
import { sanitizeFileName } from 'lib-iitc-manager';

const PLUGINS_DIR = 'iitc-plugins';
const MARKER_FILENAME = 'iitc-plugins-ready.js';

// Registered last, after all plugin scripts, so the load-finish fallback can
// tell whether the pre-registered plugins ran (skips live inject to avoid
// double-injecting the non-idempotent IITC core).
export const PLUGINS_MARKER_NAME = 'iitcPluginsReady';
export const PLUGINS_READY_FLAG = '__iitcPluginsReady';

const pluginsFolder = () => knownFolders.documents().getFolder(PLUGINS_DIR);
const pluginFilePath = uid => path.join(pluginsFolder().path, `${sanitizeFileName(uid)}.js`);

export const pluginScriptName = uid => `iitcPlugin:${uid}`;

export const writePluginScriptFile = async (uid, code) => {
  const filePath = pluginFilePath(uid);
  await File.fromPath(filePath).writeText(code);
  return filePath;
};

export const readPluginScriptCode = async filePath => File.fromPath(filePath).readText();

export const deletePluginScriptFile = async uid => {
  const filePath = pluginFilePath(uid);
  if (File.exists(filePath)) {
    await File.fromPath(filePath).remove();
  }
};

export const writePluginsMarkerFile = async () => {
  const filePath = path.join(knownFolders.documents().path, MARKER_FILENAME);
  await File.fromPath(filePath).writeText(`window.${PLUGINS_READY_FLAG} = true;`);
  return filePath;
};
