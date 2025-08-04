// Copyright (C) 2021-2025 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

import {Application, Utils, isAndroid, isIOS, Dialogs} from "@nativescript/core";
import { INGRESS_INTEL_MAP } from './url-config';

// Back button handler management
let currentBackHandler = null;

export const getStatusBarHeight = () => {
  let result = 0;
  if (Application.android) {
    const activity = Application.android.foregroundActivity || Application.android.startActivity;
    if(!activity) return 0;
    const resourceId = activity.getResources().getIdentifier('status_bar_height', 'dimen', 'android');
    if(!resourceId) return 0;
    result = activity.getResources().getDimensionPixelSize(resourceId);
    result = Utils.layout.toDeviceIndependentPixels(result);
  }
  return result;
}

export const getNavigationBarHeight = () => {
  let result = 0;
  if (Application.android) {
    const activity = Application.android.foregroundActivity || Application.android.startActivity;
    if(!activity) return 0;
    const resourceId = activity.getResources().getIdentifier('navigation_bar_height', 'dimen', 'android');
    if(!resourceId) return 0;
    result = activity.getResources().getDimensionPixelSize(resourceId);
    result = Utils.layout.toDeviceIndependentPixels(result);
  }
  return result;
}

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

      if (contentType === "geo") {
        // Share as geo-coordinates
        const lat = content.lat;
        const lng = content.lng;
        const geoUri = `geo:${lat},${lng}?q=${lat},${lng}${title ? `(${encodeURIComponent(title)})` : ''}`;

        intent.setAction(android.content.Intent.ACTION_VIEW);
        intent.setData(android.net.Uri.parse(geoUri));
      }
      else if (contentType === "url" || contentType === "text") {
        // Share as text or URL
        intent.setAction(android.content.Intent.ACTION_SEND);
        intent.setType("text/plain");
        intent.putExtra(android.content.Intent.EXTRA_TEXT, content);
        if (title) {
          intent.putExtra(android.content.Intent.EXTRA_SUBJECT, title);
        }
      }
      else if (contentType === "prime") {
        // Open in Ingress Prime
        intent.setAction(android.content.Intent.ACTION_VIEW);
        intent.setData(android.net.Uri.parse(content));
      }

      // Show app chooser dialog
      const chooserTitle = {
        geo: "Open in maps",
        url: "Open URL",
        text: "Share text",
        prime: "Open in Ingress Prime"
      }[contentType] || "Share via";

      const chooser = android.content.Intent.createChooser(intent, chooserTitle);
      activity.startActivity(chooser);

      return true;
    }
    else if (isIOS) {
      const shareItems = [];

      if (contentType === "geo") {
        // Share as geo location with URL schemes
        const lat = content.lat;
        const lng = content.lng;
        const locationTitle = title || `${lat},${lng}`;

        // Add text and multiple URL schemes for map apps
        shareItems.push(`${locationTitle}\nCoordinates: ${lat},${lng}`);
        shareItems.push(`maps://?ll=${lat},${lng}&q=${encodeURIComponent(locationTitle)}`);
        shareItems.push(`comgooglemaps://?q=${lat},${lng}`);
        shareItems.push(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
      }
      else if (contentType === "url" || contentType === "text") {
        // Share as text or URL
        shareItems.push(content);
      }
      else if (contentType === "prime") {
        // Open directly in Ingress Prime
        const url = NSURL.URLWithString(content);
        UIApplication.sharedApplication.openURL(url);
        return true;
      }

      // Create and show UIActivityViewController
      const controller = UIActivityViewController.alloc().initWithActivityItemsApplicationActivities(
        shareItems, null
      );

      const rootController = UIApplication.sharedApplication.keyWindow.rootViewController;
      rootController.presentViewControllerAnimatedCompletion(controller, true, null);

      return true;
    }

    return false;
  } catch (error) {
    console.error("Error sharing content:", error);
    return false;
  }
};

/**
 * Attach back button handler (Android only)
 * @param {Function} callback - Function to call when back button is pressed
 * @returns {boolean} Success status
 */
export const attachBackHandler = (callback) => {
  if (!isAndroid) return false;

  // Remove existing handler first to prevent accumulation
  detachBackHandler();

  // Create and store new handler
  currentBackHandler = (args) => {
    args.cancel = true;
    callback();
  };

  Application.android.on(
    Application.android.activityBackPressedEvent,
    currentBackHandler
  );

  return true;
};

/**
 * Detach current back button handler
 * @returns {boolean} Success status
 */
export const detachBackHandler = () => {
  if (!isAndroid || !currentBackHandler) return false;

  Application.android.off(
    Application.android.activityBackPressedEvent,
    currentBackHandler
  );

  currentBackHandler = null;
  return true;
};

/**
 * Check if the app is the default handler for Intel Map links (Android only)
 * Requires <queries> section in AndroidManifest.xml for Android 11+
 * @returns {boolean|null} True if app is default handler, false if not, null if not Android or can't check
 */
export const isDefaultLinkHandler = () => {
  if (!isAndroid) return null;

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
    const intent = new android.content.Intent(android.provider.Settings.ACTION_APP_OPEN_BY_DEFAULT_SETTINGS);
    intent.setData(android.net.Uri.parse(`package:${packageName}`));

    activity.startActivity(intent);
    return true;
  } catch (error) {
    console.error('Error opening app link settings:', error);
    return false;
  }
};
