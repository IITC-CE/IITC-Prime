// Copyright (C) 2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

import { Color, Property, View } from '@nativescript/core';
import { ACCENT_COLOR } from './ui';

const accent = new Color(ACCENT_COLOR);

/**
 * UIButton that opens a UIMenu on tap, iOS only. Laid over a row, it opens a system pop-up menu
 * anchored to the row and draws the pop-up indicator. Emits `select` with { index }.
 */
export class MenuButton extends View {
  createNativeView() {
    const button = getButtonClass().buttonWithType(UIButtonType.System);
    button.showsMenuAsPrimaryAction = true;
    // The menu follows the button's appearance, while the app is always dark
    button.overrideUserInterfaceStyle = UIUserInterfaceStyle.Dark;
    // Otherwise the order is reversed when the menu opens upwards, as near the bottom panel
    if (button.preferredMenuElementOrder !== undefined) {
      button.preferredMenuElementOrder = UIContextMenuConfigurationElementOrder.Fixed;
    }
    button.contentHorizontalAlignment = UIControlContentHorizontalAlignment.Trailing;

    const config = UIButtonConfiguration.plainButtonConfiguration();
    config.image = UIImage.systemImageNamed('chevron.up.chevron.down');
    config.preferredSymbolConfigurationForImage =
      UIImageSymbolConfiguration.configurationWithPointSizeWeight(13, UIImageSymbolWeight.Medium);
    config.baseForegroundColor = accent.ios;
    // The indicator at the trailing edge, in the column the row keeps for it
    config.contentInsets = NSDirectionalEdgeInsetsZero;
    button.configuration = config;
    return button;
  }

  initNativeView() {
    super.initNativeView();
    this._updateMenu();
  }

  _updateMenu() {
    const button = this.nativeViewProtected;
    if (!button) return;
    const owner = new WeakRef(this);
    const actions = (this.items ?? []).map((title, index) => {
      const action = UIAction.actionWithTitleImageIdentifierHandler(
        String(title),
        null,
        null,
        () => {
          const view = owner.deref();
          view?.notify({ eventName: 'select', object: view, index });
        }
      );
      if (index === this.selectedIndex) action.state = UIMenuElementState.On;
      return action;
    });
    button.menu = UIMenu.menuWithChildren(actions);
  }
}

// Given the button or its image view, the system hides the indicator during the animation and
// shows it late, so the preview is a copy of it. Opening, a row-sized preview keeps the menu over
// the row; closing, the indicator alone, or on iOS 26 the menu ends as a glass drop over the text
const indicatorPreview = (button, rowSized) => {
  const source = button.imageView;
  if (!source) return null;
  const copy = UIImageView.alloc().initWithImage(source.image);
  copy.tintColor = source.tintColor;
  copy.center = button.convertPointFromView(source.center, source.superview);
  let view = copy;
  if (rowSized) {
    view = UIView.alloc().initWithFrame(button.bounds);
    view.addSubview(copy);
  }
  const parameters = UIPreviewParameters.new();
  parameters.backgroundColor = UIColor.clearColor;
  const target = UIPreviewTarget.alloc().initWithContainerCenter(button, view.center);
  return UITargetedPreview.alloc().initWithViewParametersTarget(view, parameters, target);
};

let ButtonClass;
const getButtonClass = () =>
  (ButtonClass ??= UIButton.extend({
    // Taps on the row's padding, outside the button, open the menu too
    pointInsideWithEvent(point, event) {
      const row = this.superview;
      return row
        ? CGRectContainsPoint(row.bounds, this.convertPointToView(point, row))
        : this.super.pointInsideWithEvent(point, event);
    },
    contextMenuInteractionPreviewForHighlightingMenuWithConfiguration() {
      return indicatorPreview(this, true);
    },
    contextMenuInteractionPreviewForDismissingMenuWithConfiguration() {
      return indicatorPreview(this, false);
    },
  }));

const updateMenu = name =>
  new Property({ name, valueChanged: view => view._updateMenu() }).register(MenuButton);

updateMenu('items');
updateMenu('selectedIndex');
