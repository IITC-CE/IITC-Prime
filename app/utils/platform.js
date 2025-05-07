import {Application, isAndroid, isIOS, Utils} from "@nativescript/core";

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
 * Shares geographic location using native platform APIs
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {string} [title] - Optional location title
 * @param {boolean} [isPortal] - Whether this location is a portal, unused
 * @param {string} [guid] - Portal's globally unique identifier, unused
 * @returns {boolean} Success status
 */
export const shareGeoPosition = (lat, lng, title = '', isPortal = false, guid = '') => {
  try {
    if (isAndroid) {
      const activity = Application.android.foregroundActivity || Application.android.startActivity;
      if (!activity) return false;

      const intent = new android.content.Intent();
      // Creating geo URI with proper encoding of title if present
      const geoUri = `geo:${lat},${lng}?q=${lat},${lng}${title ? `(${encodeURIComponent(title)})` : ''}`;

      intent.setAction(android.content.Intent.ACTION_VIEW);
      intent.setData(android.net.Uri.parse(geoUri));

      // Show app chooser dialog for map applications
      const chooser = android.content.Intent.createChooser(intent, "Open coordinates in");
      activity.startActivity(chooser);

      return true;
    } else if (isIOS) {
      // Preparing an array of items to share
      const locationTitle = title || `${lat},${lng}`;
      const shareItems = [];

      // Add text description with coordinates
      shareItems.push(`${locationTitle}\nCoordinates: ${lat},${lng}`);

      // Add URLs for different map applications as strings
      // They will be automatically converted to clickable links in the share sheet
      shareItems.push(`maps://?ll=${lat},${lng}&q=${encodeURIComponent(locationTitle)}`);
      shareItems.push(`comgooglemaps://?q=${lat},${lng}`);
      shareItems.push(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);

      // Creating iOS activity view controller using NativeScript approach
      const controller = UIActivityViewController.alloc().initWithActivityItemsApplicationActivities(
        shareItems, null
      );

      // Getting the current view controller to present the share sheet
      const rootController = UIApplication.sharedApplication.keyWindow.rootViewController;

      // Present the share dialog
      rootController.presentViewControllerAnimatedCompletion(
        controller,
        true,
        null
      );

      return true;
    }

    return false;
  } catch (error) {
    console.error("Error sharing location:", error);
    return false;
  }
};
