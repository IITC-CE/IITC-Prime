// Copyright (C) 2021-2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

import { Application, Utils, isAndroid, isIOS } from '@nativescript/core';
import { INGRESS_INTEL_MAP } from './url-config';

// Back button handler management
let currentBackHandler = null;

// Android TextClassifier confidence threshold for URL detection in clipboard.
// Empirical: Android does not document the scale, 0.7 leaves enough margin to
// avoid false positives while still matching plain-text URLs reliably.
const URL_CONFIDENCE_THRESHOLD = 0.7;

/**
 * Get status bar height in DIP (Android only, fallback for when insets not yet dispatched)
 * @returns {number}
 */
export const getStatusBarHeight = () => {
  if (!isAndroid) return 0;
  const activity = Application.android.foregroundActivity || Application.android.startActivity;
  if (!activity) return 0;
  const resourceId = activity.getResources().getIdentifier('status_bar_height', 'dimen', 'android');
  if (!resourceId) return 0;
  return Utils.layout.toDeviceIndependentPixels(
    activity.getResources().getDimensionPixelSize(resourceId)
  );
};

/**
 * Get navigation bar height in DIP (Android only, fallback for when insets not yet dispatched)
 * @returns {number}
 */
export const getNavigationBarHeight = () => {
  if (!isAndroid) return 0;
  const activity = Application.android.foregroundActivity || Application.android.startActivity;
  if (!activity) return 0;
  const resourceId = activity
    .getResources()
    .getIdentifier('navigation_bar_height', 'dimen', 'android');
  if (!resourceId) return 0;
  return Utils.layout.toDeviceIndependentPixels(
    activity.getResources().getDimensionPixelSize(resourceId)
  );
};

/**
 * Enable edge-to-edge scrolling for a ListView or CollectionView on Android.
 * Allows items to draw behind the navigation bar while scrolling.
 * Call from the `@loaded` event handler of the list component.
 * @param {object} listView - The NativeScript ListView/CollectionView instance (args.object)
 */
export const enableListEdgeToEdge = listView => {
  if (isAndroid && listView?.android) {
    listView.android.setClipToPadding(false);
  }
};

/**
 * Universal sharing function for different content types
 * @param {any} content - Content to share (object for geo, string for text/url)
 * @param {string} contentType - Type of content ('geo', 'text', 'url', 'prime')
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
          geo: 'Open in maps',
          url: 'Open URL',
          text: 'Share text',
          prime: 'Open in Ingress Prime',
        }[contentType] || 'Share via';

      const chooser = android.content.Intent.createChooser(intent, chooserTitle);
      activity.startActivity(chooser);

      return true;
    } else if (isIOS) {
      const shareItems = [];

      if (contentType === 'geo') {
        // Share as geo location with URL schemes
        const lat = content.lat;
        const lng = content.lng;
        const locationTitle = title || `${lat},${lng}`;

        // Add text and multiple URL schemes for map apps
        shareItems.push(`${locationTitle}\nCoordinates: ${lat},${lng}`);
        shareItems.push(`maps://?ll=${lat},${lng}&q=${encodeURIComponent(locationTitle)}`);
        shareItems.push(`comgooglemaps://?q=${lat},${lng}`);
        shareItems.push(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
      } else if (contentType === 'url' || contentType === 'text') {
        // Share as text or URL
        shareItems.push(content);
      } else if (contentType === 'prime') {
        // Open directly in Ingress Prime
        const url = NSURL.URLWithString(content);
        UIApplication.sharedApplication.openURL(url);
        return true;
      }

      // Create and show UIActivityViewController
      const controller =
        UIActivityViewController.alloc().initWithActivityItemsApplicationActivities(
          shareItems,
          null
        );

      const rootController = UIApplication.sharedApplication.keyWindow.rootViewController;
      rootController.presentViewControllerAnimatedCompletion(controller, true, null);

      return true;
    }

    return false;
  } catch (error) {
    console.error('Error sharing content:', error);
    return false;
  }
};

/**
 * Attach back button handler (Android only)
 * @param {Function} callback - Function to call when back button is pressed
 * @returns {boolean} Success status
 */
export const attachBackHandler = callback => {
  if (!isAndroid) return false;

  // Remove existing handler first to prevent accumulation
  detachBackHandler();

  // Create and store new handler
  currentBackHandler = args => {
    args.cancel = true;
    callback();
  };

  Application.android.on(Application.android.activityBackPressedEvent, currentBackHandler);

  return true;
};

/**
 * Detach current back button handler
 * @returns {boolean} Success status
 */
export const detachBackHandler = () => {
  if (!isAndroid || !currentBackHandler) return false;

  Application.android.off(Application.android.activityBackPressedEvent, currentBackHandler);

  currentBackHandler = null;
  return true;
};

/**
 * Fix text input colors for system dark mode.
 * Use as @loaded handler on TextField/TextView components.
 * @param {object} args - NativeScript loaded event args
 */
export const fixTextInputColors = args => {
  const view = args.object;
  const { Color: NSColor } = require('@nativescript/core');
  view.style.color = new NSColor('#ffffff');
  view.style.placeholderColor = new NSColor('#aaaaaa');
  if (isAndroid) {
    // Center text vertically for single-line appearance
    const nativeView = view.nativeViewProtected;
    const gravity = nativeView.getGravity();
    const horizontalGravity = gravity & android.view.Gravity.HORIZONTAL_GRAVITY_MASK;
    nativeView.setGravity(horizontalGravity | android.view.Gravity.CENTER_VERTICAL);
  }
};

/**
 * Parse Android window insets into DIP values including display cutouts
 * @param {object} inset - NativeScript inset object from @androidOverflowInset
 * @returns {{ top: number, bottom: number, left: number, right: number }}
 */
export const parseAndroidInsets = inset => {
  const toDIP = px => Utils.layout.toDeviceIndependentPixels(px);
  return {
    top: toDIP(inset.top ?? 0),
    bottom: toDIP(inset.bottom ?? 0),
    // Horizontal insets include display cutout (camera notch in landscape)
    left: toDIP(Math.max(inset.left ?? 0, inset.cutoutLeft ?? 0)),
    right: toDIP(Math.max(inset.right ?? 0, inset.cutoutRight ?? 0)),
  };
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
 * iOS 14+: UIPasteboard.detectPatterns (no paste prompt).
 * Android 12+ (API 31): ClipDescription.getConfidenceScore(TYPE_URL) (no toast).
 *
 * @returns {Promise<boolean|null>}
 */
export const detectClipboardUrl = () => {
  return new Promise(resolve => {
    try {
      if (isIOS) {
        const osVersion = parseFloat(UIDevice.currentDevice.systemVersion);
        if (osVersion < 14.0) {
          resolve(null);
          return;
        }
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
 * Read raw and trimmed text from clipboard. On iOS 14+/Android 12+, this is what
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
      const context = Application.android.context;
      const appInfo = context.getApplicationInfo();
      const packageManager = context.getPackageManager();
      return appInfo.loadLabel(packageManager).toString();
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
