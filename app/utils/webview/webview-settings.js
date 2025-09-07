// Copyright (C) 2024 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

import { isAndroid, isIOS } from "@nativescript/core";
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
  } else if (isIOS) {
    // iOS WKWebView settings
    const webview_ios = webview.ios;

    if (webview_ios && webview_ios.configuration) {
      const configuration = webview_ios.configuration;
      const preferences = configuration.preferences;

      // Enable JavaScript popup windows for iOS popup support
      preferences.javaScriptCanOpenWindowsAutomatically = true;

      // Set required cookie for Niantic auth (from IITC-Mobile)
      try {
        const cookieStore = configuration.websiteDataStore.httpCookieStore;

        // Create NSHTTPCookie for _ncc
        const cookieProperties = NSMutableDictionary.alloc().init();
        cookieProperties.setObjectForKey("_ncc", NSHTTPCookieName);
        cookieProperties.setObjectForKey("0", NSHTTPCookieValue);
        cookieProperties.setObjectForKey("signin.nianticlabs.com", NSHTTPCookieDomain);
        cookieProperties.setObjectForKey("/", NSHTTPCookiePath);

        const nsCookie = NSHTTPCookie.cookieWithProperties(cookieProperties);

        if (nsCookie) {
          cookieStore.setCookieCompletionHandler(nsCookie, (error) => {
            if (error) {
              console.log('[iOS] Error setting auth cookie:', error.localizedDescription);
            } else {
              console.log('[iOS] Auth cookie _ncc set successfully for signin.nianticlabs.com');
            }
          });
        }
      } catch (error) {
        console.log('[iOS] Could not set auth cookie:', error.message);
      }

      // Apply User Agent if needed
      if (fakeUserAgent) {
        const customUserAgent = getDesktopUserAgent();
        webview_ios.customUserAgent = customUserAgent;

        return {
          originalUserAgent: webview_ios.customUserAgent,
          finalUserAgent: customUserAgent
        };
      }
    }

    return {
      originalUserAgent: null,
      finalUserAgent: null
    };
  }
  return null;
}
