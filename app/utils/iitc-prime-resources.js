// Copyright (C) 2021-2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

import { knownFolders, path } from '@nativescript/core';
import * as fs from '@nativescript/core';

const CUSTOM_STYLES_FILENAME = 'iitc-prime-styles.js';

const resolveLocalResourceFilePath = filepath => {
  return path.normalize(knownFolders.currentApp().path + filepath.substr(1));
};

/**
 * Read resource file content
 * @param {string} filepath - Path to resource file (e.g., '~/assets/css/iitc-prime.css')
 * @returns {Promise<string>} File content as string
 */
const getResourceContent = async filepath => {
  const fullPath = resolveLocalResourceFilePath(filepath);
  return await fs.File.fromPath(fullPath).readText();
};

// loadStyleSheetFile is unreliable; injectStyleSheet is idempotent by element id,
// so this is safe to call again after IITC replaces document.head on boot.
const buildCustomStylesScript = async () => {
  const cssContent = await getResourceContent('~/assets/css/iitc-prime.css');
  return `window.nsWebViewBridge.injectStyleSheet('iitcprimecss', ${JSON.stringify(cssContent)}, false);`;
};

/**
 * Inject custom CSS styles directly via executeJavaScript.
 * Fallback for when the pre-registered script hasn't run yet.
 */
export const injectCustomStyles = async webview => {
  try {
    await webview.executeJavaScript(await buildCustomStylesScript());
  } catch (error) {
    console.error('[injectCustomStyles] Failed to inject CSS:', error);
  }
};

/**
 * Write the custom styles script to a file for registration via autoLoadJavaScriptFile,
 * so styling applies from document-start even if IITC never boots.
 * @returns {Promise<string>} Absolute path to the written file
 */
export const writeCustomStylesFile = async () => {
  const filePath = path.join(knownFolders.documents().path, CUSTOM_STYLES_FILENAME);
  await fs.File.fromPath(filePath).writeText(await buildCustomStylesScript());
  return filePath;
};
