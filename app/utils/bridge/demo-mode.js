// Copyright (C) 2024-2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

import { File, knownFolders, path } from '@nativescript/core';
import { DEMO_INTEL_HOST } from '@/utils/url-config';

// Runs on every page load (no per-URL matching), so each part guards its own
// preconditions. Runs at DOMContentLoaded, before IITC core is injected.
const buildDemoModeScript = () => `(function () {
  if (window.__iitcDemoModeRan) return;
  window.__iitcDemoModeRan = true;

  // On the demo host, suppress IITC's non-standard-domain warning before boot.
  // localStorage is per-origin, so the real intel domain is unaffected.
  if (location.hostname === '${DEMO_INTEL_HOST}') {
    try {
      localStorage['pass-checking-intel-url'] = 'true';
    } catch (e) {}
  }

  // On the sign-in dashboard, add a button that switches to the demo server.
  var container = document.getElementById('dashboard_container');
  if (!container || document.getElementById('iitc-demo-button')) return;

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
