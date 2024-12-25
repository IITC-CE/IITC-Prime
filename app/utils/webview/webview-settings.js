//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

import { isAndroid } from "@nativescript/core";
import { sanitizeUserAgent } from "~/utils/webview/user-agent";

export function applyWebViewSettings(webview) {
  if (isAndroid) {
    const settings = webview.android.getSettings();

    // Basic settings
    settings.setJavaScriptEnabled(true);
    settings.setDomStorageEnabled(true);
    settings.setSupportMultipleWindows(true);

    // Additional settings for auth popup
    settings.setAllowFileAccess(true);
    settings.setMixedContentMode(android.webkit.WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);

    // Apply sanitized User Agent
    const originalUserAgent = settings.getUserAgentString();
    const sanitizedUserAgent = sanitizeUserAgent(originalUserAgent);
    settings.setUserAgentString(sanitizedUserAgent);

    return {
      originalUserAgent,
      sanitizedUserAgent
    };
  }
  return null;
}
