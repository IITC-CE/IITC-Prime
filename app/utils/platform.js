import {Application, Utils} from "@nativescript/core";

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
