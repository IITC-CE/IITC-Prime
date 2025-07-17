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
