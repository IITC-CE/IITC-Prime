// Copyright (C) 2021-2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

import { knownFolders, path } from '@nativescript/core';
import * as fs from '@nativescript/core';

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

/**
 * Inject custom CSS styles for IITC Prime
 * @remarks Page load (onLoadFinished), before IITC boot
 */
export const injectCustomStyles = async webview => {
  try {
    const cssContent = await getResourceContent('~/assets/css/iitc-prime.css');

    // Use nsWebViewBridge.injectStyleSheet directly
    // loadStyleSheetFile doesn't work reliably, so we call the bridge method directly
    const injectCssCode = `window.nsWebViewBridge.injectStyleSheet('iitcprimecss', ${JSON.stringify(cssContent)}, false);`;

    await webview.executeJavaScript(injectCssCode);
  } catch (error) {
    console.error('[injectCustomStyles] Failed to inject CSS:', error);
  }
};

/**
 * Override IITC's file chooser to use native file picker
 * @remarks After IITC boot (ui/iitcBootFinished)
 */
export const installFileChooserOverride = async webview => {
  const fileImportOverride = `(function() {
  if (typeof L !== 'undefined' && L.FileReader && L.FileReader._chooseFiles) {
    var originalChooseFiles = L.FileReader._chooseFiles;
    L.FileReader._chooseFiles = function(callback, options) {
      try {
        window.app.chooseFiles(
          options.multiple || false,
          options.accept ? [options.accept] : ['*/*'],
          callback
        );
      } catch (error) {
        console.error('IITC-Prime: File chooser error', error);
        if (callback) callback([]);
      }
    };
  } else {
    console.log('IITC-Prime: L.FileReader._chooseFiles not available yet');
  }
})();`;

  await webview.executeJavaScript(fileImportOverride);
};
