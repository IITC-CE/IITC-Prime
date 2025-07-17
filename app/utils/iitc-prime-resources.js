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
}
