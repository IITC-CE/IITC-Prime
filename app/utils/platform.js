// Copyright (C) 2021-2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

import { Application, Utils, isAndroid, isIOS } from '@nativescript/core';
import { INGRESS_INTEL_MAP } from './url-config';

// Back button handler management
let currentBackHandler = null;

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
 * Read clipboard text if it matches a pattern.
 *
 * iOS 14+: uses UIPasteboard.detectPatterns to check for URL presence
 * Only reads the actual content (which shows the dialog on iOS 16+)
 * if a URL pattern is detected.
 *
 * Android: reads clipboard directly.
 *
 * @param {RegExp} pattern - RegExp to test against clipboard text
 * @returns {Promise<string|null>} Matching clipboard text or null
 */
export const getClipboardTextIfMatches = async pattern => {
  try {
    if (isIOS) {
      return await _readClipboardIOS(pattern);
    } else {
      return _readClipboardAndroid(pattern);
    }
  } catch (e) {
    console.error('Error reading clipboard:', e);
    return null;
  }
};

function _readClipboardIOS(pattern) {
  return new Promise(resolve => {
    const pasteboard = UIPasteboard.generalPasteboard;

    // iOS 14+: detect patterns without triggering paste permission dialog
    const osVersion = parseFloat(UIDevice.currentDevice.systemVersion);
    if (osVersion >= 14.0) {
      const patterns = NSSet.setWithObject(UIPasteboardDetectionPatternProbableWebURL);

      pasteboard.detectPatternsForPatternsCompletionHandler(patterns, (detected, error) => {
        if (error || !detected || detected.count === 0) {
          resolve(null);
          return;
        }

        // URL detected - now read content
        const text = pasteboard.string;
        resolve(text && pattern.test(text) ? text.trim() : null);
      });
    } else {
      // iOS < 14: no paste dialog, read directly
      const text = pasteboard.string;
      resolve(text && pattern.test(text) ? text.trim() : null);
    }
  });
}

function _readClipboardAndroid(pattern) {
  const context = Utils.android.getApplicationContext();
  const clipboard = context.getSystemService(android.content.Context.CLIPBOARD_SERVICE);

  const description = clipboard.getPrimaryClipDescription();
  if (!description) return null;

  if (
    !description.hasMimeType(android.content.ClipDescription.MIMETYPE_TEXT_PLAIN) &&
    !description.hasMimeType(android.content.ClipDescription.MIMETYPE_TEXT_HTML)
  ) {
    return null;
  }

  const clip = clipboard.getPrimaryClip();
  if (!clip || clip.getItemCount() === 0) return null;

  const text = clip.getItemAt(0).getText()?.toString();
  return text && pattern.test(text) ? text.trim() : null;
}

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
