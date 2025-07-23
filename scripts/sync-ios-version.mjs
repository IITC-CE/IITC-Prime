#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import plist from 'simple-plist';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Simple script to sync iOS version with package.json
 */

/**
 * Get version code based on git commit timestamp (same logic as Android)
 * Equivalent to Android's getVersionCodeTimeStamps function
 */
function getVersionCodeTimeStamps() {
  try {
    // Get git commit timestamp
    const unixtime = execSync('git log -1 --pretty=format:%ct', { encoding: 'utf8' }).trim();

    if (!unixtime || unixtime === '') {
      console.warn('Failed to get commit date, using current timestamp');
      return Math.floor(Date.now() / 1000 / 10);
    }

    return Math.floor(parseInt(unixtime) / 10);

  } catch (error) {
    console.warn('Failed to get git timestamp, using current timestamp:', error.message);
    return Math.floor(Date.now() / 1000 / 10);
  }
}

function updateIOSVersion() {
  try {
    const packagePath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const newVersion = packageJson.version;

    const versionCode = getVersionCodeTimeStamps();

    // Define Info.plist path
    const infoPlistPath = path.join(__dirname, '..', 'App_Resources', 'iOS', 'Info.plist');

    if (!fs.existsSync(infoPlistPath)) {
      throw new Error(`Info.plist not found at: ${infoPlistPath}`);
    }

    const plistData = plist.readFileSync(infoPlistPath);

    // CFBundleShortVersionString = user-facing version from package.json
    plistData.CFBundleShortVersionString = newVersion;

    // CFBundleVersion = build number from git timestamp
    plistData.CFBundleVersion = versionCode.toString();

    plist.writeFileSync(infoPlistPath, plistData);
  } catch (error) {
    console.error('❌ Error updating iOS version:', error.message);
    process.exit(1);
  }
}

updateIOSVersion();
