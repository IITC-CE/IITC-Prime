// Copyright (C) 2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

import { isAndroid, isIOS } from '@nativescript/core';

/**
 * Clears the WebView HTTP cache. Cookies and web storage are kept.
 * @param {object} webview WebView component instance
 */
export async function clearWebViewCache(webview) {
  try {
    if (isAndroid) {
      // The cache is per-application, so this clears it for every WebView
      webview.android.clearCache(true);
    } else if (isIOS) {
      const dataStore = webview.ios.configuration.websiteDataStore;
      const dataTypes = NSSet.setWithArray([
        WKWebsiteDataTypeDiskCache,
        WKWebsiteDataTypeMemoryCache,
      ]);
      const dateFrom = NSDate.dateWithTimeIntervalSince1970(0);
      await new Promise(resolve => {
        dataStore.removeDataOfTypesModifiedSinceCompletionHandler(dataTypes, dateFrom, resolve);
      });
    }
  } catch (error) {
    console.error('[WebViewCache] Failed to clear cache:', error);
  }
}
