// Copyright (C) 2024 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

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
