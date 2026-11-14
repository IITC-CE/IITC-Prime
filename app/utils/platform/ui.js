// Copyright (C) 2021-2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

import { Application, Color, Frame, Utils, isAndroid, isIOS } from '@nativescript/core';

// $accent in app.scss
export const ACCENT_COLOR = '#26a69a';

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

let SearchResultsUpdater;

/**
 * Attach a native UISearchController to a page's navigation item (iOS only).
 * The caller must keep the returned object: the controller holds the updater weakly.
 * @param {object} page - NativeScript Page
 * @param {{ hint: string, text: string, onTextChange: (text: string) => void,
 *   onActiveChange: (active: boolean) => void }} options
 * @returns {{ controller: UISearchController, updater: NSObject } | null}
 */
export const attachIosSearchController = (page, { hint, text, onTextChange, onActiveChange }) => {
  if (!isIOS || !page?.ios) return null;

  if (!SearchResultsUpdater) {
    SearchResultsUpdater = NSObject.extend(
      {
        updateSearchResultsForSearchController(controller) {
          const text = controller.searchBar.text || '';
          // The dismissal clears the text; that waits for didDismissSearchController
          if (this.dismissing) return;
          this.onTextChange?.(text);
        },
        willPresentSearchController() {
          this.onActiveChange?.(true);
        },
        willDismissSearchController() {
          this.dismissing = true;
        },
        // The page goes back to its full list once the search is gone, not under its animation
        didDismissSearchController(controller) {
          this.dismissing = false;
          this.onTextChange?.(controller.searchBar.text || '');
          this.onActiveChange?.(false);
        },
      },
      { protocols: [UISearchResultsUpdating, UISearchControllerDelegate] }
    );
  }

  const updater = SearchResultsUpdater.new();
  updater.onTextChange = onTextChange;
  updater.onActiveChange = onActiveChange;

  const controller = UISearchController.alloc().initWithSearchResultsController(null);
  controller.searchResultsUpdater = updater;
  controller.delegate = updater;
  controller.obscuresBackgroundDuringPresentation = false;
  controller.searchBar.placeholder = hint;
  controller.searchBar.text = text;
  controller.searchBar.overrideUserInterfaceStyle = UIUserInterfaceStyle.Dark;
  controller.searchBar.autocapitalizationType = UITextAutocapitalizationType.None;
  controller.searchBar.autocorrectionType = UITextAutocorrectionType.No;
  // Cancel and the cursor, matching the bar's actions (iOS 26 has a glass close button instead)
  if (Utils.SDK_VERSION < 26) {
    controller.searchBar.tintColor = new Color(ACCENT_COLOR).ios;
  }

  const navigationItem = page.ios.navigationItem;
  navigationItem.searchController = controller;
  navigationItem.hidesSearchBarWhenScrolling = false;
  // Automatic placement on iOS 26 moves the field from under the title to the toolbar after the
  // push, the taller bar covering the page meanwhile; a button in the bar doesn't jump
  if (Utils.SDK_VERSION >= 26) {
    navigationItem.preferredSearchBarPlacement =
      UINavigationItemSearchBarPlacement.IntegratedButton;
    navigationItem.searchBarPlacementAllowsToolbarIntegration = false;
  }
  page.ios.definesPresentationContext = true;

  return { controller, updater };
};

/**
 * Style the navigation bar of a settings page (iOS only). The bar stays dark: the app is always
 * dark, while the bar would otherwise follow the system light mode.
 * @param {object} page - NativeScript Page
 */
export const styleIosNavigationBar = page => {
  const navBar = page?.frame?.ios?.controller?.navigationBar;
  if (!navBar) return;
  navBar.overrideUserInterfaceStyle = UIUserInterfaceStyle.Dark;

  // Before iOS 26 the actions are bare text in the title's color; the accent sets them apart, as
  // on Android. The back button keeps the color of its chevron, which follows the bar's tint.
  // ActionBar resets that tint on every update but keeps the appearance.
  if (Utils.SDK_VERSION < 26) {
    const textColor = color =>
      NSDictionary.dictionaryWithObjectForKey(new Color(color).ios, NSForegroundColorAttributeName);
    const buttons = UIBarButtonItemAppearance.alloc().initWithStyle(UIBarButtonItemStyle.Plain);
    buttons.normal.titleTextAttributes = textColor(ACCENT_COLOR);
    const back = UIBarButtonItemAppearance.alloc().initWithStyle(UIBarButtonItemStyle.Plain);
    back.normal.titleTextAttributes = textColor('#ffffff');
    const appearance = navBar.standardAppearance;
    appearance.buttonAppearance = buttons;
    appearance.backButtonAppearance = back;
    navBar.standardAppearance = appearance;
    navBar.compactAppearance = appearance;
    navBar.scrollEdgeAppearance = appearance;
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
 * Loaded handler for a layout whose children are moved into its padding by a transform: Android
 * clips them at the padding edge, iOS doesn't.
 * @param {object} args - NativeScript loaded event args
 */
export const drawOverPadding = args => {
  if (isAndroid) {
    args.object.nativeViewProtected.setClipToPadding(false);
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
 * Loaded handler for a ListView whose rows draw their own lines: a table keeps a pixel under
 * each row for its separator, even a transparent one.
 * @param {object} args - NativeScript loaded event args
 */
export const hideListSeparators = args => {
  if (isIOS) {
    args.object.nativeViewProtected.separatorStyle = UITableViewCellSeparatorStyle.None;
  }
};

// UIKit drops a cell's highlight once the touch turns into a scroll or a drag
const TOUCH_SLOP = 10;

const highlightOnTouch = args => {
  const view = args.object;
  if (args.action === 'down') {
    view._touchStart = { x: args.getX(), y: args.getY() };
    view.addPseudoClass('highlighted');
  } else if (args.action === 'move') {
    const { x, y } = view._touchStart;
    if (Math.hypot(args.getX() - x, args.getY() - y) > TOUCH_SLOP)
      view.deletePseudoClass('highlighted');
  } else {
    view.deletePseudoClass('highlighted');
  }
};

const themeDrawable = (view, attr) => {
  const attrs = Array.create('int', 1);
  attrs[0] = attr;
  const values = view.getContext().obtainStyledAttributes(attrs);
  const drawable = values.getDrawable(0);
  values.recycle();
  return drawable;
};

const addRipple = args => {
  const view = args.object.nativeViewProtected;
  if (view.getForeground()) return;
  const layers = Array.create(android.graphics.drawable.Drawable, 1);
  layers[0] = themeDrawable(view, android.R.attr.selectableItemBackground);
  // Shaped by fitRipple: before Android 13 the outline clips only when all corners are equal
  const mask = new android.graphics.drawable.GradientDrawable();
  mask.setColor(android.graphics.Color.WHITE);
  layers[0].setDrawableByLayerId(android.R.id.mask, mask);
  // In a layer, which fitRipple insets
  view.setForeground(new android.graphics.drawable.LayerDrawable(layers));
};

// Keeps the ripple inside the corners and off the borders, such as the gap between list rows.
// Set on each touch: a list reuses rows with other classes
const fitRipple = args => {
  if (args.action !== 'down') return;
  const view = args.object;
  const layers = view.nativeViewProtected.getForeground();
  const px = Math.round;
  layers.setLayerInset(
    0,
    px(view.effectiveBorderLeftWidth),
    px(view.effectiveBorderTopWidth),
    px(view.effectiveBorderRightWidth),
    px(view.effectiveBorderBottomWidth)
  );
  const bg = view.style.backgroundInternal;
  const radii = Array.create('float', 8);
  [
    bg.borderTopLeftRadius,
    bg.borderTopRightRadius,
    bg.borderBottomRightRadius,
    bg.borderBottomLeftRadius,
  ].forEach((radius, i) => {
    radii[2 * i] = radii[2 * i + 1] = radius;
  });
  layers.getDrawable(0).findDrawableByLayerId(android.R.id.mask).setCornerRadii(radii);
  // The insets apply when the bounds change
  const bounds = layers.copyBounds();
  layers.setBounds(0, 0, 0, 0);
  layers.setBounds(bounds);
};

/**
 * Listeners for v-on on a tappable row, card or chip: while pressed it is highlighted on iOS, as
 * table cells are (styled by `:highlighted`), and draws the system ripple on Android. A Label
 * draws no ripple, so it goes inside a container that takes the listeners
 */
export const pressFeedback = isIOS
  ? { touch: highlightOnTouch }
  : { loaded: addRipple, touch: fitRipple };

// Material icon button: a 40dp circle around the icon
const addIconRipple = args => {
  const view = args.object.nativeViewProtected;
  if (view.getForeground()) return;
  const ripple = themeDrawable(view, android.R.attr.selectableItemBackgroundBorderless);
  ripple.setRadius(Utils.layout.toDevicePixels(20));
  view.setForeground(ripple);
};

// The first and last cells are padded, so their icon is off the cell's center
const centerIconRipple = args => {
  if (args.action !== 'down') return;
  const view = args.object.nativeViewProtected;
  view
    .getForeground()
    .setHotspotBounds(
      view.getPaddingLeft(),
      view.getPaddingTop(),
      view.getWidth() - view.getPaddingRight(),
      view.getHeight() - view.getPaddingBottom()
    );
};

/**
 * Listeners for v-on on a cell holding only an icon, where a pressed cell would show as a block:
 * the icon dims on iOS, as in a UIButton (styled by `:highlighted`), and a round ripple draws
 * around it on Android
 */
export const iconPressFeedback = isIOS
  ? { touch: highlightOnTouch }
  : { loaded: addIconRipple, touch: centerIconRipple };

/**
 * Listeners for v-on on a row with a switch: an Android row ripples, and its tap handler toggles
 * the switch (Material 3); an iOS row is not highlighted, only the switch toggles
 */
export const switchRowFeedback = isIOS ? {} : pressFeedback;

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
  if (isAndroid && view.nativeViewProtected) {
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

// BottomSheetBehavior lays a sheet taller than the space under the status bar out below it at
// full height, so the bottom of the sheet goes off screen
const limitBottomSheetHeight = (refs, insetTop) => {
  refs.insetTop = insetTop;
  if (!refs.limitHeight) {
    const sheet = refs.designBottomSheet;
    const behavior = com.google.android.material.bottomsheet.BottomSheetBehavior.from(sheet);
    refs.limitHeight = () => {
      const maxHeight = refs.coordinator.getHeight() - refs.insetTop;
      if (maxHeight <= 0 || behavior.getMaxHeight() === maxHeight) return;
      behavior.setMaxHeight(maxHeight);
      // Called from onLayoutChange, where a layout request is not applied
      sheet.post(new java.lang.Runnable({ run: () => sheet.requestLayout() }));
    };
    // A rotation resizes the coordinator
    refs.coordinator.addOnLayoutChangeListener(
      new android.view.View.OnLayoutChangeListener({ onLayoutChange: refs.limitHeight })
    );
  }
  refs.limitHeight();
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
 * - Caps the sheet height to the space under the status bar.
 * - Optionally translates the CoordinatorLayout up when the keyboard is visible.
 *   SOFT_INPUT_ADJUST_RESIZE is broken on Android 15+ edge-to-edge; translating the
 *   coordinator (not design_bottom_sheet) avoids conflicting with BottomSheetBehavior which
 *   owns design_bottom_sheet.translationY.
 *
 * @param {object} args - NativeScript @androidOverflowInset event args
 * @param {{ coordinator, designBottomSheet, nativeView } | null} refs - from getBottomSheetInsetRefs
 * @param {{ translateForIme?: boolean }} [options]
 * @returns {number | null} bottom padding in DIP, for a Vue binding
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

  limitBottomSheetHeight(refs, args.inset.top ?? 0);

  // When keyboard is visible the nav bar sits behind it - no bottom padding needed.
  const padBottom =
    options.translateForIme && args.inset.imeBottom > 0 ? 0 : (args.inset.bottom ?? 0);

  return Utils.layout.toDeviceIndependentPixels(padBottom);
};

const ANDROID_SHEET_OPTIONS = {
  dismissOnBackgroundTap: true,
  dismissOnDraggingDownSheet: true,
  skipCollapsedState: true,
};

/**
 * Show a sheet: a system page sheet on iOS, a BottomSheetDialogFragment on Android.
 * The component calls closeSheet to return a result; a sheet swiped away resolves undefined.
 * @param {object} vm - the calling component
 * @param {object} component
 * @param {{ props?: object, android?: object }} [options] - android: more $showBottomSheet options
 * @returns {Promise<any>}
 */
export const showSheet = async (vm, component, { props, android } = {}) => {
  if (isIOS) {
    return vm.$showModal(component, {
      props,
      target: vm,
      ios: { presentationStyle: UIModalPresentationStyle.PageSheet },
    });
  }
  const result = await vm.$showBottomSheet(component, {
    props,
    ...ANDROID_SHEET_OPTIONS,
    ...android,
  });
  return result?.[0];
};

/**
 * @param {object} vm - the sheet component
 * @param {any} result - what showSheet resolves with
 */
export const closeSheet = (vm, result) =>
  isIOS ? vm.$closeModal(result) : vm.$closeBottomSheet(result);

// In DIP. Only before the first layout: measuring a laid out sheet moves the titles of system
// buttons off center
const measureSheetContent = (view, width) => {
  const { layout } = Utils;
  view.measure(
    layout.makeMeasureSpec(layout.toDevicePixels(width), layout.EXACTLY),
    layout.makeMeasureSpec(0, layout.UNSPECIFIED)
  );
  return layout.toDeviceIndependentPixels(view.getMeasuredHeight());
};

// In DIP. A scroll view's content is measured at its full height, the scroll view itself is not
const laidOutSheetContent = view => {
  let height = view.effectivePaddingTop + view.effectivePaddingBottom;
  view.eachChildView(child => {
    const content = child.content ?? child;
    height += content.getMeasuredHeight() + child.effectiveMarginTop + child.effectiveMarginBottom;
  });
  return Utils.layout.toDeviceIndependentPixels(height);
};

/**
 * showingModally handler for the root of a sheet component. It runs before the sheet is
 * presented, so the sheet opens at the height set here: as tall as the content, as on Android.
 * @param {object} args - NativeScript showingModally event args
 */
export const configureIosSheet = args => {
  const view = args.object;
  const controller = view.viewController;
  const sheet = controller?.sheetPresentationController;
  if (!sheet) return;
  // Only the root extends under the bottom safe area, scroll views inset their content
  // themselves. Otherwise a view added while the sheet slides in is extended too and stays taller
  const contents = [];
  view.eachChildView(child => {
    child.iosIgnoreSafeArea = true;
    contents.push(child.content ?? child);
  });
  // The presentation, grabber included, follows the window's light appearance until the sheet is
  // in place
  if (Utils.SDK_VERSION >= 17) {
    sheet.traitOverrides.userInterfaceStyle = UIUserInterfaceStyle.Dark;
  } else {
    sheet.overrideTraitCollection = UITraitCollection.traitCollectionWithUserInterfaceStyle(
      UIUserInterfaceStyle.Dark
    );
  }
  // Otherwise in landscape it turns into a full-screen page that can't be swiped away
  sheet.prefersEdgeAttachedInCompactHeight = true;
  sheet.prefersGrabberVisible = true;

  // Custom heights come with iOS 16
  if (Utils.SDK_VERSION < 16) {
    sheet.detents = [
      UISheetPresentationControllerDetent.mediumDetent(),
      UISheetPresentationControllerDetent.largeDetent(),
    ];
    return;
  }
  let height = 0;
  // The detent holds the resolver natively, and a strong reference to the view would keep the
  // sheet alive through the view's controller
  const viewRef = new WeakRef(view);
  sheet.detents = [
    UISheetPresentationControllerDetent.customDetentWithIdentifierResolver('content', context => {
      const root = viewRef.deref();
      if (!height && root) {
        height = root.isLayoutValid
          ? laidOutSheetContent(root)
          : measureSheetContent(root, UIScreen.mainScreen.bounds.size.width);
      }
      return Math.min(height || context.maximumDetentValue, context.maximumDetentValue);
    }),
  ];
  // The content can change while the sheet is shown, e.g. once a plugin has loaded. The sheet
  // is resized after the layout pass, not in the middle of it
  const onContentLayout = () =>
    setTimeout(() => {
      if (!view.isLoaded) return;
      const next = laidOutSheetContent(view);
      if (Math.abs(next - height) < 1) return;
      height = next;
      sheet.animateChanges(() => sheet.invalidateDetents());
    });
  contents.forEach(content => content.on('layoutChanged', onContentLayout));
};
