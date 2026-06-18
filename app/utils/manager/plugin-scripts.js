// Copyright (C) 2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

import { File, knownFolders, path } from '@nativescript/core';
import { sanitizeFileName } from 'lib-iitc-manager';

const PLUGINS_DIR = 'iitc-plugins';

// Per-document map of uids already run; AppWebView reads it to skip re-injecting.
export const PLUGINS_INJECTED_MAP = '__iitcInjected';

const pluginsFolder = () => knownFolders.documents().getFolder(PLUGINS_DIR);
const pluginFilePath = uid => path.join(pluginsFolder().path, `${sanitizeFileName(uid)}.js`);

export const pluginScriptName = uid => `iitcPlugin:${uid}`;

// Idempotency guard so an injection-timing race can't run a userscript twice:
// the first injection path to run claims the uid, the other no-ops.
// Block-wrapping is safe - injected code is always an IIFE/expression.
const guard = uid => {
  const key = JSON.stringify(uid);
  const map = `window.${PLUGINS_INJECTED_MAP}`;
  return {
    open: `${map}=${map}||{};if(!${map}[${key}]){${map}[${key}]=true;\n`,
    close: '\n}',
  };
};

export const writePluginScriptFile = async (uid, code) => {
  const filePath = pluginFilePath(uid);
  const { open, close } = guard(uid);
  await File.fromPath(filePath).writeText(open + code + close);
  return filePath;
};

export const readPluginScriptCode = async filePath => File.fromPath(filePath).readText();

export const deletePluginScriptFile = async uid => {
  const filePath = pluginFilePath(uid);
  if (File.exists(filePath)) {
    await File.fromPath(filePath).remove();
  }
};
