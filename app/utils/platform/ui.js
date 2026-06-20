// Copyright (C) 2021-2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

import { Application, Frame, Utils, isAndroid, isIOS } from '@nativescript/core';

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
 * Set status bar icon contrast for content shown over the map.
 * The nav bar overlays the dark panel and is left untouched.
 * @param {boolean} isDark - Whether the underlying content is dark (use light icons)
 */
export const setStatusBarForMapTheme = isDark => {
  if (isAndroid) {
    const activity = Application.android.foregroundActivity || Application.android.startActivity;
    const window = activity?.getWindow();
    if (!window) return;
    const controller = androidx.core.view.WindowCompat.getInsetsController(
      window,
      window.getDecorView()
    );
    controller.setAppearanceLightStatusBars(!isDark);
  } else if (isIOS) {
    const page = Frame.topmost()?.currentPage;
    if (!page) return;
    page.statusBarStyle = isDark ? 'light' : 'dark';
    // Setting the property doesn't invalidate the status bar appearance; force it.
    page.updateStatusBar?.();
  }
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
 * Disable iOS UITableViewCell selection highlight on list items.
 * On iOS, cells flash white on tap by default (UITableViewCellSelectionStyleDefault).
 * Call from the `@itemLoading` event handler of the ListView.
 * @param {object} args - NativeScript itemLoading event args
 */
export const disableListItemHighlight = args => {
  if (isIOS && args.ios) {
    args.ios.selectionStyle = 0; // UITableViewCellSelectionStyleNone
  }
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
  view.style.placeholderColor = new NSColor('#71a0a6');
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
 * Collect the native view references needed for bottom sheet inset handling on Android 15+.
 * Returns null on API < 35 or when the expected hierarchy is not present.
 *
 * View hierarchy inside BottomSheetDialogFragment:
 *   StackLayout  ->  design_bottom_sheet (FrameLayout)  ->  CoordinatorLayout
 *
 * @param {object} args - NativeScript @loaded event args
 * @returns {{ coordinator: object, designBottomSheet: object, nativeView: object } | null}
 */
export const getBottomSheetInsetRefs = args => {
  if (!isAndroid || android.os.Build.VERSION.SDK_INT < 35) return null;
  const nativeView = args.object.android;
  if (!nativeView) return null;
  const designBottomSheet = nativeView.getParent();
  const coordinator = designBottomSheet ? designBottomSheet.getParent() : null;
  if (!coordinator) return null;
  return { coordinator, designBottomSheet, nativeView };
};

/**
 * Apply safe-zone insets to a bottom sheet panel on Android 15+.
 *
 * On Android 15+ edge-to-edge is mandatory and BottomSheetBehavior 1.8.0 no longer
 * applies system-bar padding to design_bottom_sheet. This function handles it manually:
 *
 * - Consumes all insets so inner views receive Insets.NONE and apply no padding themselves.
 * - Narrows design_bottom_sheet via CoordinatorLayout.LayoutParams margins (pixels) so the
 *   panel background does not extend behind camera notches or side nav bars.
 * - Optionally translates the CoordinatorLayout up when the keyboard is visible.
 *   SOFT_INPUT_ADJUST_RESIZE is broken on Android 15+ edge-to-edge; translating the
 *   coordinator (not design_bottom_sheet) avoids conflicting with BottomSheetBehavior which
 *   owns design_bottom_sheet.translationY.
 *
 * @param {object} args - NativeScript @androidOverflowInset event args
 * @param {{ coordinator, designBottomSheet, nativeView } | null} refs - from getBottomSheetInsetRefs
 * @param {{ translateForIme?: boolean }} [options]
 * @returns {{ insetTop: number, insetBottom: number } | null} DIP padding values for Vue reactive bindings
 */
export const applyBottomSheetInsets = (args, refs, options = {}) => {
  if (!isAndroid || !refs || android.os.Build.VERSION.SDK_INT < 35) return null;

  // Prevent inner views from auto-applying insets on top of ours.
  args.inset.topConsumed = true;
  args.inset.bottomConsumed = true;
  args.inset.leftConsumed = true;
  args.inset.rightConsumed = true;
  args.inset.imeBottomConsumed = true;
  args.inset.cutoutLeftConsumed = true;
  args.inset.cutoutTopConsumed = true;
  args.inset.cutoutRightConsumed = true;
  args.inset.cutoutBottomConsumed = true;

  if (options.translateForIme) {
    refs.coordinator.setTranslationY(-(args.inset.imeBottom || 0));
  }

  // Narrow design_bottom_sheet via layout param margins (pixels) so its background
  // does not bleed behind camera notches or side nav bars.
  const padLeftPx = Math.max(args.inset.left ?? 0, args.inset.cutoutLeft ?? 0);
  const padRightPx = Math.max(args.inset.right ?? 0, args.inset.cutoutRight ?? 0);
  const lp = refs.designBottomSheet.getLayoutParams();
  if (lp) {
    lp.leftMargin = padLeftPx;
    lp.rightMargin = padRightPx;
    refs.designBottomSheet.setLayoutParams(lp);
  }

  // Top padding only needed in landscape when the sheet fills the full coordinator
  // height and its upper edge overlaps the status bar.
  const sheetTopPx = refs.coordinator.getHeight() - refs.nativeView.getHeight();
  const topPad = Math.max(0, (args.inset.top ?? 0) - sheetTopPx);

  // When keyboard is visible the nav bar sits behind it - no bottom padding needed.
  const padBottom =
    options.translateForIme && args.inset.imeBottom > 0 ? 0 : (args.inset.bottom ?? 0);

  return {
    insetTop: Utils.layout.toDeviceIndependentPixels(topPad),
    insetBottom: Utils.layout.toDeviceIndependentPixels(padBottom),
  };
};
