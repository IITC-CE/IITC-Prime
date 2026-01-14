// Copyright (C) 2024 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

import { isAndroid, isIOS } from '@nativescript/core';
import {
  getAndroidUserAgent,
  getIOSUserAgent,
  getFakeDesktopUserAgent,
} from '~/utils/webview/user-agent';

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
      finalUserAgent = getFakeDesktopUserAgent();
    } else {
      finalUserAgent = getAndroidUserAgent(cachedOriginalUserAgent);
    }

    settings.setUserAgentString(finalUserAgent);

    // Set _ncc cookie to disable Niantic's cookie consent banner
    try {
      const CookieManager = android.webkit.CookieManager.getInstance();
      CookieManager.setAcceptCookie(true);
      CookieManager.setCookie(
        'https://signin.nianticspatial.com',
        '_ncc=0; Path=/; Domain=.nianticspatial.com'
      );
    } catch (error) {
      console.log('[Android] Could not set _ncc cookie:', error.message);
    }

    return {
      originalUserAgent: cachedOriginalUserAgent,
      finalUserAgent,
    };
  } else if (isIOS) {
    // iOS WKWebView settings
    const webview_ios = webview.ios;

    if (webview_ios && webview_ios.configuration) {
      const configuration = webview_ios.configuration;
      const preferences = configuration.preferences;

      // Enable JavaScript popup windows for iOS popup support
      preferences.javaScriptCanOpenWindowsAutomatically = true;

      if (!cachedOriginalUserAgent) {
        cachedOriginalUserAgent = getIOSUserAgent();
      }

      // Apply User Agent
      let finalUserAgent;

      if (fakeUserAgent) {
        finalUserAgent = getFakeDesktopUserAgent();
      } else {
        finalUserAgent = cachedOriginalUserAgent;
      }

      webview_ios.customUserAgent = finalUserAgent;

      // Set _ncc cookie to disable Niantic's cookie consent banner
      try {
        const cookieStore = configuration.websiteDataStore.httpCookieStore;

        const cookieProperties = NSMutableDictionary.alloc().init();
        cookieProperties.setObjectForKey('_ncc', NSHTTPCookieName);
        cookieProperties.setObjectForKey('0', NSHTTPCookieValue);
        cookieProperties.setObjectForKey('.nianticspatial.com', NSHTTPCookieDomain);
        cookieProperties.setObjectForKey('/', NSHTTPCookiePath);

        const nsCookie = NSHTTPCookie.cookieWithProperties(cookieProperties);

        if (nsCookie) {
          cookieStore.setCookieCompletionHandler(nsCookie, error => {
            if (error) {
              console.log('[iOS] Error setting auth cookie:', error.localizedDescription);
            }
          });
        }
      } catch (error) {
        console.log('[iOS] Could not set auth cookie:', error.message);
      }

      return {
        originalUserAgent: cachedOriginalUserAgent,
        finalUserAgent,
      };
    }

    return {
      originalUserAgent: null,
      finalUserAgent: null,
    };
  }
  return null;
}
