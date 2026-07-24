// Copyright (C) 2024-2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

import { File, knownFolders, path } from '@nativescript/core';

// Runs on every page load (no per-URL matching),
// so it must no-op unless the sign-in dashboard is present
const buildDemoModeScript = () => `(function () {
  if (document.getElementById('iitc-demo-button')) return;
  var container = document.getElementById('dashboard_container');
  if (!container) return;

  var wrapper = document.createElement('div');
  wrapper.className = 'button unselectable';

  var link = document.createElement('a');
  link.id = 'iitc-demo-button';
  link.className = 'button_link';
  link.href = '#';
  link.textContent = 'Try demo (no sign-in required)';
  link.addEventListener('click', function (event) {
    event.preventDefault();
    if (window.app && window.app.openDemo) {
      window.app.openDemo();
    }
  });

  wrapper.appendChild(link);
  container.appendChild(wrapper);
})();
`;

const DEMO_MODE_FILENAME = 'iitc-demo-mode.js';

/**
 * Inject the demo-mode script directly via executeJavaScript.
 * Fallback for when the pre-registered script hasn't run yet.
 */
export const injectDemoMode = async webview => {
  await webview.executeJavaScript(buildDemoModeScript());
};

/**
 * Write the demo-mode script to a file for registration via autoLoadJavaScriptFile
 * @returns {Promise<string>} Absolute path to the written file
 */
export const writeDemoModeFile = async () => {
  const filePath = path.join(knownFolders.documents().path, DEMO_MODE_FILENAME);
  await File.fromPath(filePath).writeText(buildDemoModeScript());
  return filePath;
};
