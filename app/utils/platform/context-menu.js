// Copyright (C) 2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

import { isIOS, Length, Utils } from '@nativescript/core';

// Asked on each long press: a list reuses rows for other items
const getMenu = view => {
  const args = { eventName: 'contextMenu', object: view, title: '', actions: [] };
  view.notify(args);
  return args;
};

// In UIRectCorner bit order
const CORNERS = ['TopLeft', 'TopRight', 'BottomLeft', 'BottomRight'];

// A snapshot, not the row: the system hides the row until the menu closes, and a list changed by
// an action reuses that hidden row for other items. It keeps the row's own corners, not the
// system's rounded rect
const rowPreview = view => {
  const nativeView = view.nativeViewProtected;
  const window = nativeView.window;
  if (!window) return null;
  const dip = px => Utils.layout.toDeviceIndependentPixels(px);
  const radii = CORNERS.map(c => dip(Length.toDevicePixels(view.style[`border${c}Radius`], 0)));
  const rounded = radii.reduce((mask, r, index) => (r > 0 ? mask | (1 << index) : mask), 0);
  const radius = Math.max(...radii);
  const { width, height } = nativeView.bounds.size;
  const top = dip(view.effectiveBorderTopWidth);
  const left = dip(view.effectiveBorderLeftWidth);
  const rect = CGRectMake(
    left,
    top,
    width - left - dip(view.effectiveBorderRightWidth),
    height - top - dip(view.effectiveBorderBottomWidth)
  );
  const parameters = UIPreviewParameters.new();
  // Otherwise the corners the row rounds itself are drawn black
  parameters.backgroundColor = view.backgroundColor?.ios ?? null;
  parameters.visiblePath = UIBezierPath.bezierPathWithRoundedRectByRoundingCornersCornerRadii(
    rect,
    rounded,
    CGSizeMake(radius, radius)
  );
  // Over the list, whose cell clips the row as it grows under the finger
  const center = nativeView.convertPointToView(CGPointMake(width / 2, height / 2), window);
  const target = UIPreviewTarget.alloc().initWithContainerCenter(window, center);
  const snapshot = nativeView.snapshotViewAfterScreenUpdates(false);
  return UITargetedPreview.alloc().initWithViewParametersTarget(snapshot, parameters, target);
};

let MenuDelegate;
const getDelegateClass = () =>
  (MenuDelegate ??= NSObject.extend(
    {
      contextMenuInteractionConfigurationForMenuAtLocation() {
        const view = this.owner?.deref();
        const actions = view ? getMenu(view).actions : [];
        if (!actions.length) return null;
        // Before an action changes the list
        this.preview = rowPreview(view);
        this.selected = false;
        return UIContextMenuConfiguration.configurationWithIdentifierPreviewProviderActionProvider(
          null,
          null,
          () =>
            // No title: the lifted row shows the name
            UIMenu.menuWithChildren(
              actions.map(({ title, icon, destructive, onSelect }) => {
                const action = UIAction.actionWithTitleImageIdentifierHandler(
                  title,
                  icon ? UIImage.systemImageNamed(icon) : null,
                  null,
                  () => {
                    this.selected = true;
                    onSelect();
                  }
                );
                if (destructive) action.attributes = UIMenuElementAttributes.Destructive;
                return action;
              })
            )
        );
      },
      contextMenuInteractionPreviewForHighlightingMenuWithConfiguration() {
        return this.preview;
      },
      contextMenuInteractionPreviewForDismissingMenuWithConfiguration() {
        const preview = this.preview;
        this.preview = null;
        // After an action, which may move or remove the row, the menu fades out in place
        return this.selected ? null : preview;
      },
    },
    { protocols: [UIContextMenuInteractionDelegate] }
  ));

const addMenuInteraction = args => {
  const view = args.object;
  const nativeView = view.nativeViewProtected;
  if (view._menuInteraction?.view === nativeView) return;
  // The interaction keeps its delegate weakly
  view._menuDelegate = getDelegateClass().new();
  view._menuDelegate.owner = new WeakRef(view);
  view._menuInteraction = UIContextMenuInteraction.alloc().initWithDelegate(view._menuDelegate);
  nativeView.addInteraction(view._menuInteraction);
  // The menu follows the row's appearance, while the app is always dark
  nativeView.overrideUserInterfaceStyle = UIUserInterfaceStyle.Dark;
};

// A dialog, as Android shows a list row's context menu
const showMenuDialog = args => {
  const view = args.object;
  const menu = getMenu(view);
  if (!menu.actions.length) return;
  const nativeView = view.nativeViewProtected;
  nativeView.performHapticFeedback(android.view.HapticFeedbackConstants.LONG_PRESS);
  new com.google.android.material.dialog.MaterialAlertDialogBuilder(nativeView.getContext())
    .setTitle(menu.title)
    .setItems(
      menu.actions.map(({ title }) => title),
      new android.content.DialogInterface.OnClickListener({
        onClick: (dialog, index) => menu.actions[index].onSelect(),
      })
    )
    .show();
};

/**
 * Listeners for v-on on a row that opens a system context menu on a long press. The row's
 * `contextMenu` handler sets args.title (Android) and args.actions: { title, icon (SF Symbol,
 * iOS), destructive, onSelect }; an empty list opens no menu
 */
export const contextMenu = isIOS ? { loaded: addMenuInteraction } : { longPress: showMenuDialog };
