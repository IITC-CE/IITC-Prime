// Copyright (C) 2024 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

import { isIOS } from '@nativescript/core';

export function getAndroidUserAgent(userAgent) {
  // Remove WebView marker
  let sanitized = userAgent.replace('; wv', '');

  // Find and replace Chrome version ending with .0.0.0
  const chromeVersionRegex = /Chrome\/(\d+)\.0\.0\.0/;
  const match = sanitized.match(chromeVersionRegex);

  if (match) {
    const versionNumber = match[1];
    sanitized = sanitized.replace(chromeVersionRegex, `Chrome/${versionNumber}.0.0.1`);
  }

  return sanitized;
}

export function getIOSUserAgent() {
  // Construct proper Safari User-Agent for iOS
  // WKWebView default UA is incomplete and causes Google GSI to reject with 403
  if (!isIOS) {
    return null;
  }

  const device = UIDevice.currentDevice;
  const osVersion = device.systemVersion;
  const model = device.model; // "iPhone", "iPad", etc.

  // Format: Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1
  return `Mozilla/5.0 (${model}; CPU ${model} OS ${osVersion.replace(/\./g, '_')} like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${osVersion.split('.')[0]}.0 Mobile/15E148 Safari/604.1`;
}

export function getFakeDesktopUserAgent() {
  // Desktop Firefox user agent - same as in IITC Mobile
  return 'Mozilla/5.0 (X11; Linux x86_64; rv:17.0) Gecko/20130810 Firefox/17.0 Iceweasel/17.0.8';
}
