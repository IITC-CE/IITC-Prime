// Copyright (C) 2024 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

export function sanitizeUserAgent(userAgent) {
  // Remove WebView marker
  let sanitized = userAgent.replace('; wv', '');

  // Find and replace Chrome version ending with .0.0.0
  const chromeVersionRegex = /Chrome\/(\d+)\.0\.0\.0/;
  const match = sanitized.match(chromeVersionRegex);

  if (match) {
    const versionNumber = match[1];
    sanitized = sanitized.replace(
      chromeVersionRegex,
      `Chrome/${versionNumber}.0.0.1`
    );
  }

  return sanitized;
}

export function getDesktopUserAgent() {
  // Desktop Firefox user agent - same as in IITC Mobile
  return "Mozilla/5.0 (X11; Linux x86_64; rv:17.0) Gecko/20130810 Firefox/17.0 Iceweasel/17.0.8";
}
