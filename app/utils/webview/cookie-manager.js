// Copyright (C) 2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

import { isAndroid, isIOS } from '@nativescript/core';

/**
 * Clear all cookies from WebView
 * @returns {Promise<boolean>} Success status
 */
export async function clearWebViewCookies() {
  try {
    if (isAndroid) {
      return await clearAndroidCookies();
    } else if (isIOS) {
      return await clearIOSCookies();
    }
    return false;
  } catch (error) {
    console.error('[CookieManager] Error clearing cookies:', error);
    return false;
  }
}

/**
 * Clear cookies on Android
 */
async function clearAndroidCookies() {
  return new Promise(resolve => {
    try {
      const CookieManager = android.webkit.CookieManager.getInstance();
      CookieManager.removeAllCookies(
        new android.webkit.ValueCallback({
          onReceiveValue: success => {
            console.log('[Android] Cookies cleared:', success);
            resolve(success);
          },
        })
      );
    } catch (error) {
      console.error('[Android] Failed to clear cookies:', error);
      resolve(false);
    }
  });
}

/**
 * Clear cookies on iOS
 */
async function clearIOSCookies() {
  return new Promise(resolve => {
    try {
      const dataStore = WKWebsiteDataStore.defaultDataStore();
      const dataTypes = NSSet.setWithArray([WKWebsiteDataTypeCookies]);
      const dateFrom = NSDate.dateWithTimeIntervalSince1970(0);

      dataStore.removeDataOfTypesModifiedSinceCompletionHandler(dataTypes, dateFrom, () => {
        console.log('[iOS] Cookies cleared');
        resolve(true);
      });
    } catch (error) {
      console.error('[iOS] Failed to clear cookies:', error);
      resolve(false);
    }
  });
}
