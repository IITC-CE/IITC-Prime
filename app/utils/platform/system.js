// Copyright (C) 2021-2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

import { Application, Utils, isAndroid, isIOS } from '@nativescript/core';
import { l } from '@nativescript-community/l';
import { INGRESS_INTEL_MAP } from '@/utils/url-config';

// Android TextClassifier confidence threshold for URL detection in clipboard.
// Empirical: Android does not document the scale, 0.7 leaves enough margin to
// avoid false positives while still matching plain-text URLs reliably.
const URL_CONFIDENCE_THRESHOLD = 0.7;

// iOS has no geo: intent, so map apps are opened through their own URL schemes.
// Custom schemes must be listed in LSApplicationQueriesSchemes for canOpenURL.
const IOS_MAP_APPS = [
  {
    name: 'Apple Maps',
    url: (lat, lng, title) =>
      `https://maps.apple.com/?ll=${lat},${lng}&q=${encodeURIComponent(title)}`,
  },
  {
    name: 'Google Maps',
    url: (lat, lng) => `comgooglemaps://?q=${lat},${lng}&center=${lat},${lng}&zoom=17`,
  },
  {
    name: 'Organic Maps',
    url: (lat, lng, title) => `om://map?v=1&ll=${lat},${lng}&n=${encodeURIComponent(title)}`,
  },
  {
    name: 'OsmAnd',
    url: (lat, lng, title) =>
      `osmandmaps://?lat=${lat}&lon=${lng}&z=17&title=${encodeURIComponent(title)}`,
  },
  {
    name: 'Yandex Maps',
    url: (lat, lng) => `yandexmaps://maps.yandex.ru/?pt=${lng},${lat}&z=17&l=map`,
  },
  { name: '2GIS', url: (lat, lng) => `dgis://2gis.ru/geo/${lng},${lat}` },
  { name: 'Waze', url: (lat, lng) => `waze://?ll=${lat},${lng}` },
  {
    name: 'Citymapper',
    url: (lat, lng, title) =>
      `citymapper://directions?endcoord=${lat},${lng}&endname=${encodeURIComponent(title)}`,
  },
  // Chinese map apps use GCJ-02 internally; the parameters below mark input as WGS-84
  {
    name: 'Amap',
    url: (lat, lng, title) =>
      `iosamap://viewMap?sourceApplication=IITC%20Prime&poiname=${encodeURIComponent(title)}&lat=${lat}&lon=${lng}&dev=1`,
  },
  {
    name: 'Baidu Maps',
    url: (lat, lng, title) =>
      `baidumap://map/marker?location=${lat},${lng}&title=${encodeURIComponent(title)}&content=&coord_type=wgs84&src=IITC%20Prime`,
  },
  {
    name: 'Tencent Maps',
    url: (lat, lng, title) =>
      `qqmap://map/marker?marker=coord:${lat},${lng};title:${encodeURIComponent(title)};addr:&coord_type=1&referer=IITC%20Prime`,
  },
];

const canOpenUrlIOS = url => UIApplication.sharedApplication.canOpenURL(NSURL.URLWithString(url));

/**
 * Map apps installed on this iOS device that can show the given location
 * @returns {{label: string, open: () => Promise<boolean>}[]}
 */
export const getMapAppsIOS = (lat, lng, title = '') => {
  const locationTitle = title || `${lat},${lng}`;
  return IOS_MAP_APPS.map(app => ({
    label: l('share.action.open_in', app.name),
    url: app.url(lat, lng, locationTitle),
  }))
    .filter(app => canOpenUrlIOS(app.url))
    .map(({ label, url }) => ({ label, open: () => Utils.openUrlAsync(url) }));
};

const presentActivityControllerIOS = items => {
  const controller = UIActivityViewController.alloc().initWithActivityItemsApplicationActivities(
    items,
    null
  );

  let topController = UIApplication.sharedApplication.keyWindow.rootViewController;
  while (topController.presentedViewController) {
    topController = topController.presentedViewController;
  }

  const popover = controller.popoverPresentationController;
  if (popover) {
    const bounds = topController.view.bounds;
    popover.sourceView = topController.view;
    popover.sourceRect = CGRectMake(bounds.size.width / 2, bounds.size.height / 2, 0, 0);
    popover.permittedArrowDirections = 0;
  }

  topController.presentViewControllerAnimatedCompletion(controller, true, null);
};

/**
 * Universal sharing function for different content types
 * @param {any} content - Content to share (object for geo, string for text/url)
 * @param {string} contentType - Type of content ('geo' (Android only), 'text', 'url', 'prime')
 * @param {string} title - Optional title or description
 * @returns {boolean} Success status
 */
export const shareContent = (content, contentType, title = '') => {
  try {
    if (isAndroid) {
      const activity = Application.android.foregroundActivity || Application.android.startActivity;
      if (!activity) return false;

      const intent = new android.content.Intent();

      if (contentType === 'geo') {
        // Share as geo-coordinates
        const lat = content.lat;
        const lng = content.lng;
        const geoUri = `geo:${lat},${lng}?q=${lat},${lng}${title ? `(${encodeURIComponent(title)})` : ''}`;

        intent.setAction(android.content.Intent.ACTION_VIEW);
        intent.setData(android.net.Uri.parse(geoUri));
      } else if (contentType === 'url' || contentType === 'text') {
        // Share as text or URL
        intent.setAction(android.content.Intent.ACTION_SEND);
        intent.setType('text/plain');
        intent.putExtra(android.content.Intent.EXTRA_TEXT, content);
        if (title) {
          intent.putExtra(android.content.Intent.EXTRA_SUBJECT, title);
        }
      } else if (contentType === 'prime') {
        // Open in Ingress Prime
        intent.setAction(android.content.Intent.ACTION_VIEW);
        intent.setData(android.net.Uri.parse(content));
      }

      // Show app chooser dialog
      const chooserTitle =
        {
          geo: l('share.action.maps'),
          url: l('share.chooser.open_url'),
          text: l('share.chooser.share_text'),
          prime: l('share.action.ingress_prime'),
        }[contentType] || l('share.chooser.fallback');

      const chooser = android.content.Intent.createChooser(intent, chooserTitle);
      activity.startActivity(chooser);

      return true;
    } else if (isIOS) {
      if (contentType === 'prime') {
        return Utils.openUrl(content);
      } else if (contentType === 'url' || contentType === 'text') {
        presentActivityControllerIOS([content]);
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Error sharing content:', error);
    return false;
  }
};

/**
 * Check if the app is the default handler for Intel Map links (Android only)
 * Requires <queries> section in AndroidManifest.xml for Android 11+
 * @returns {boolean|null} True if app is default handler, false if not, null if not Android or can't check
 */
export const isDefaultLinkHandler = () => {
  if (!isAndroid) return null;

  // Only show deep link permission button on Android 12+ where system can reset the setting
  if (android.os.Build.VERSION.SDK_INT < 31) {
    // Android 12 = API 31
    return null; // Hide button on older Android - system doesn't reset deep link settings
  }

  try {
    const activity = Application.android.foregroundActivity || Application.android.startActivity;
    if (!activity) return null;

    const packageManager = activity.getPackageManager();
    const currentPackageName = activity.getPackageName();

    const intent = new android.content.Intent(
      android.content.Intent.ACTION_VIEW,
      android.net.Uri.parse(INGRESS_INTEL_MAP)
    );

    const resolveInfo = packageManager.resolveActivity(
      intent,
      android.content.pm.PackageManager.MATCH_DEFAULT_ONLY
    );

    if (!resolveInfo || !resolveInfo.activityInfo) return false;

    return resolveInfo.activityInfo.packageName === currentPackageName;
  } catch (error) {
    console.error('Error checking default link handler:', error);
    return null;
  }
};

/**
 * Open app link settings for the current app (Android only)
 * @returns {boolean} Success status
 */
export const openAppLinkSettings = () => {
  if (!isAndroid) return false;

  try {
    const activity = Application.android.foregroundActivity || Application.android.startActivity;
    if (!activity) return false;

    const packageName = activity.getPackageName();
    const intent = new android.content.Intent(
      android.provider.Settings.ACTION_APP_OPEN_BY_DEFAULT_SETTINGS
    );
    intent.setData(android.net.Uri.parse(`package:${packageName}`));

    activity.startActivity(intent);
    return true;
  } catch (error) {
    console.error('Error opening app link settings:', error);
    return false;
  }
};

/**
 * Detect whether the clipboard probably contains a URL WITHOUT reading content
 * when the OS supports it.
 *
 * Returns:
 *  - true  - URL definitely detected (no content read)
 *  - false - no URL present
 *  - null  - detection unavailable on this OS version; caller must read content
 *
 * iOS: UIPasteboard.detectPatterns (no paste prompt).
 * Android 12+ (API 31): ClipDescription.getConfidenceScore(TYPE_URL) (no toast).
 *
 * @returns {Promise<boolean|null>}
 */
export const detectClipboardUrl = () => {
  return new Promise(resolve => {
    try {
      if (isIOS) {
        const patterns = NSSet.setWithObject(UIPasteboardDetectionPatternProbableWebURL);
        UIPasteboard.generalPasteboard.detectPatternsForPatternsCompletionHandler(
          patterns,
          (detected, error) => {
            const result = !error && !!detected && detected.count > 0;
            resolve(result);
          }
        );
        return;
      } else if (isAndroid) {
        const sdk = android.os.Build.VERSION.SDK_INT;
        if (sdk < 31) {
          resolve(null);
          return;
        }

        const context = Utils.android.getApplicationContext();
        const clipboard = context.getSystemService(android.content.Context.CLIPBOARD_SERVICE);
        const description = clipboard?.getPrimaryClipDescription();

        if (!description) {
          resolve(null);
          return;
        }

        const mimePlain = description.hasMimeType(
          android.content.ClipDescription.MIMETYPE_TEXT_PLAIN
        );
        const mimeHtml = description.hasMimeType(
          android.content.ClipDescription.MIMETYPE_TEXT_HTML
        );

        if (!mimePlain && !mimeHtml) {
          resolve(false);
          return;
        }

        const status = description.getClassificationStatus();
        if (status === android.content.ClipDescription.CLASSIFICATION_COMPLETE) {
          const score = description.getConfidenceScore(
            android.view.textclassifier.TextClassifier.TYPE_URL
          );
          if (__DEV__) {
            console.log(`[Clipboard] Android URL detection score: ${score}`);
          }
          resolve(score > URL_CONFIDENCE_THRESHOLD);
          return;
        }

        resolve(null);
      } else {
        resolve(null);
      }
    } catch (e) {
      console.error('[Clipboard] Error detecting clipboard URL:', e);
      resolve(false);
    }
  });
};

/**
 * Read raw and trimmed text from clipboard. On iOS and Android 12+, this is what
 * triggers the paste banner/toast. Only call after user-initiated action or as
 * fallback when detection is not available.
 *
 * @returns {string|null}
 */
export const readClipboardText = () => {
  try {
    if (isIOS) {
      const text = UIPasteboard.generalPasteboard.string;
      return text ? text.toString().trim() : null;
    } else if (isAndroid) {
      const context = Utils.android.getApplicationContext();
      const clipboard = context.getSystemService(android.content.Context.CLIPBOARD_SERVICE);
      // Try reading directly - works when app has clipboard focus (foreground).
      // On Android 10+ getPrimaryClip() returns null if access is denied, same as description.
      const clip = clipboard?.getPrimaryClip();
      if (!clip || clip.getItemCount() === 0) {
        return null;
      }
      const text = clip.getItemAt(0).getText();
      return text ? text.toString().trim() : null;
    } else {
      return null;
    }
  } catch (e) {
    console.error('[Clipboard] Error reading clipboard:', e);
    return null;
  }
};

/**
 * Read file content from a URI string (content://, file://).
 * Android: handles content:// URIs via ContentResolver.
 * iOS: handles file:// URLs.
 * @param {string} uri - The URI to read from
 * @returns {{ content: string, name: string }} File content and display name
 */
export const readFileFromUri = uri => {
  if (isAndroid && uri.startsWith('content://')) {
    const context = Utils.android.getApplicationContext();
    const contentUri = android.net.Uri.parse(uri);
    const contentResolver = context.getContentResolver();

    // Read content
    const inputStream = contentResolver.openInputStream(contentUri);
    const reader = new java.io.BufferedReader(new java.io.InputStreamReader(inputStream, 'UTF-8'));
    const sb = new java.lang.StringBuilder();
    let line;
    while ((line = reader.readLine()) !== null) {
      sb.append(line);
      sb.append('\n');
    }
    reader.close();
    inputStream.close();
    const content = sb.toString();

    // Get filename from cursor
    let name = 'plugin.user.js';
    try {
      const cursor = contentResolver.query(contentUri, null, null, null, null);
      if (cursor && cursor.moveToFirst()) {
        const nameIndex = cursor.getColumnIndex(android.provider.OpenableColumns.DISPLAY_NAME);
        if (nameIndex >= 0) {
          name = cursor.getString(nameIndex);
        }
        cursor.close();
      }
    } catch (e) {
      // Fallback filename is fine
    }

    return { content, name };
  }

  // iOS: use NSURL with security-scoped access (required for iCloud, Files app, etc.)
  if (isIOS) {
    const nsUrl = NSURL.URLWithString(uri);
    const accessing = nsUrl.startAccessingSecurityScopedResource();
    try {
      const data = NSData.dataWithContentsOfURL(nsUrl);
      if (!data) {
        throw new Error('Failed to read file data from URL: ' + uri);
      }
      const content = NSString.alloc().initWithDataEncoding(data, NSUTF8StringEncoding).toString();
      const name = nsUrl.lastPathComponent || 'plugin.user.js';
      return { content, name };
    } finally {
      if (accessing) {
        nsUrl.stopAccessingSecurityScopedResource();
      }
    }
  }

  // file:// URI or plain path (Android fallback)
  let filePath = uri;
  if (uri.startsWith('file://')) {
    filePath = uri.replace('file://', '');
    try {
      filePath = decodeURIComponent(filePath);
    } catch (e) {
      // Keep as-is if decoding fails
    }
  }

  const { File } = require('@nativescript/core');
  const file = File.fromPath(filePath);
  const content = file.readTextSync();
  const name = filePath.split('/').pop() || 'plugin.user.js';

  return { content, name };
};

/**
 * Get application display name from native resources
 * @returns {string} Application name
 */
export const getAppName = () => {
  try {
    if (isAndroid) {
      const context = Utils.android.getApplicationContext();
      return context.getApplicationInfo().loadLabel(context.getPackageManager()).toString();
    } else if (isIOS) {
      return (
        NSBundle.mainBundle.objectForInfoDictionaryKey('CFBundleDisplayName') ||
        NSBundle.mainBundle.objectForInfoDictionaryKey('CFBundleName')
      );
    }
  } catch (e) {
    console.error('Error getting app name:', e);
  }

  return 'IITC-CE Prime';
};

/**
 * Whether precise (FINE) location is actually granted.
 * Android only distinguishes COARSE/FINE at runtime on API 23+; on iOS and
 * older Android there is no such split, so precise is assumed available.
 * @returns {boolean}
 */
export const isFineLocationGranted = () => {
  if (!isAndroid) return true;
  if (android.os.Build.VERSION.SDK_INT < 23) return true;
  const context = Utils.android.getApplicationContext();
  return (
    context.checkSelfPermission('android.permission.ACCESS_FINE_LOCATION') ===
    android.content.pm.PackageManager.PERMISSION_GRANTED
  );
};
