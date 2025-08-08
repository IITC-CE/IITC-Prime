// Copyright (C) 2021-2025 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

import { knownFolders, path } from "@nativescript/core";
import * as fs from "@nativescript/core";

const resolveLocalResourceFilePath = (filepath) => {
  return path.normalize(knownFolders.currentApp().path + filepath.substr(1));
}

const getResource = async (filepath) => {
  const sourceCode = await fs.File.fromPath(resolveLocalResourceFilePath(filepath)).readText();
  return JSON.stringify(sourceCode);
}

export const injectIITCPrimeResources = async (webview) => {
  const cssPath = "~/assets/css/iitc-prime.css";
  const fullPath = resolveLocalResourceFilePath(cssPath);

  await webview.loadStyleSheetFile("iitcprimecss", fullPath, false);

  // Install file chooser override after IITC boot is finished
  await installFileChooserOverride(webview);
}

const installFileChooserOverride = async (webview) => {
  const fileImportOverride = `
// Override L.FileReader._chooseFiles to use native file picker
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
`;

  await webview.executeJavaScript(fileImportOverride);
}
