//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

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
