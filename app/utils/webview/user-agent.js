//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

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
