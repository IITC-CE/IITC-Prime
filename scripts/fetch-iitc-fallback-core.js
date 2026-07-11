// Copyright (C) 2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

/**
 * Fetches the IITC core userscript from the release channel, for bundling as an offline fallback
 * (see webpack.config.js and app/utils/manager/manager-worker.js).
 *
 * Cached under node_modules/.cache so repeat local builds skip the network.
 *
 * Standalone usage: node scripts/fetch-iitc-fallback-core.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const IITC_CORE_URL = 'https://iitc.app/build/release/total-conversion-build.user.js';
const CACHE_PATH = path.join(
  __dirname,
  '..',
  'node_modules',
  '.cache',
  'total-conversion-build.user.js'
);

function fetchIitcFallbackCore() {
  try {
    return fs.readFileSync(CACHE_PATH, 'utf8');
  } catch {
    // No cache yet - fetch below.
  }

  try {
    const code = execSync(`curl -fsSL --max-time 15 "${IITC_CORE_URL}"`, {
      maxBuffer: 10 * 1024 * 1024,
    }).toString('utf8');

    if (!code.includes('==UserScript==')) {
      throw new Error('response does not look like a userscript');
    }

    fs.mkdirSync(path.dirname(CACHE_PATH), { recursive: true });
    fs.writeFileSync(CACHE_PATH, code);
    return code;
  } catch (error) {
    console.warn(`[fetch-iitc-fallback-core] Failed to fetch ${IITC_CORE_URL}: ${error.message}`);
    console.warn('[fetch-iitc-fallback-core] Building without an offline fallback core.');
    return '';
  }
}

module.exports = { fetchIitcFallbackCore, IITC_CORE_URL, CACHE_PATH };

if (require.main === module) {
  const code = fetchIitcFallbackCore();
  if (code) {
    const versionMatch = code.match(/@version\s+([^\r\n]+)/);
    console.log(`Fetched ${code.length} bytes from ${IITC_CORE_URL}`);
    console.log(`Version: ${versionMatch ? versionMatch[1].trim() : 'unknown'}`);
  } else {
    console.log('No fallback core fetched (see warnings above).');
    process.exitCode = 1;
  }
}
