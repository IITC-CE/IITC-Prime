// Copyright (C) 2024-2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

import { isAndroid, isIOS } from '@nativescript/core';

export function applyWebViewSettings(webview) {
  if (isAndroid) {
    const settings = webview.android.getSettings();

    // Basic settings
    settings.setJavaScriptEnabled(true);
    settings.setDomStorageEnabled(true);
    settings.setSupportMultipleWindows(true);
    settings.setUseWideViewPort(false);

    // Additional settings for auth popup
    settings.setAllowFileAccess(true);
    settings.setMixedContentMode(android.webkit.WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);

    // Enable third-party cookies so cross-origin OAuth iframes (e.g. Google gapi) can
    // access their own cookies without needing requestStorageAccess, which Android WebView
    // denies by default in API 33+
    try {
      const CookieManager = android.webkit.CookieManager.getInstance();
      CookieManager.setAcceptThirdPartyCookies(webview.android, true);
    } catch (error) {
      console.log('[Android] Could not enable third-party cookies:', error.message);
    }

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
  } else if (isIOS) {
    // iOS WKWebView settings
    const webview_ios = webview.ios;

    if (webview_ios && webview_ios.configuration) {
      const configuration = webview_ios.configuration;
      configuration.preferences.javaScriptCanOpenWindowsAutomatically = true;

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
    }
  }
}
