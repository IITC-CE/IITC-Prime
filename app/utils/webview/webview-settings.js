// Copyright (C) 2024 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

import { isAndroid } from "@nativescript/core";
import { sanitizeUserAgent, getDesktopUserAgent } from "~/utils/webview/user-agent";

// Store original user agent to avoid losing it when switching modes
let cachedOriginalUserAgent = null;

export function applyWebViewSettings(webview, fakeUserAgent = false) {
  if (isAndroid) {
    const settings = webview.android.getSettings();

    // Basic settings
    settings.setJavaScriptEnabled(true);
    settings.setDomStorageEnabled(true);
    settings.setSupportMultipleWindows(true);

    // Additional settings for auth popup
    settings.setAllowFileAccess(true);
    settings.setMixedContentMode(android.webkit.WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);

    if (!cachedOriginalUserAgent) {
      cachedOriginalUserAgent = settings.getUserAgentString();
    }

    // Apply User Agent
    let finalUserAgent;

    if (fakeUserAgent) {
      finalUserAgent = getDesktopUserAgent();
    } else {
      finalUserAgent = sanitizeUserAgent(cachedOriginalUserAgent);
    }

    settings.setUserAgentString(finalUserAgent);

    return {
      originalUserAgent: cachedOriginalUserAgent,
      finalUserAgent
    };
  }
  return null;
}
