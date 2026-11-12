// Copyright (C) 2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

import { Color, Property, View, booleanConverter, isIOS } from '@nativescript/core';
import { ACCENT_COLOR } from './ui';

const accent = new Color(ACCENT_COLOR);

const checkedProperty = new Property({
  name: 'checked',
  defaultValue: false,
  valueConverter: booleanConverter,
});

/**
 * Mark of the chosen row in a single-choice list: a checkmark on iOS, as in system settings,
 * a Material radio button on Android. The row takes the taps and is read by screen readers.
 */
export class RadioMark extends View {
  createNativeView() {
    if (isIOS) {
      const view = UIImageView.alloc().initWithImage(UIImage.systemImageNamed('checkmark'));
      view.preferredSymbolConfiguration =
        UIImageSymbolConfiguration.configurationWithPointSizeWeight(17, UIImageSymbolWeight.Semibold);
      view.tintColor = accent.ios;
      view.hidden = true;
      return view;
    }
    const radio = new com.google.android.material.radiobutton.MaterialRadioButton(this._context);
    radio.setClickable(false);
    radio.setFocusable(false);
    radio.setImportantForAccessibility(android.view.View.IMPORTANT_FOR_ACCESSIBILITY_NO);
    // TextView and View both keep the style's 48dp touch target, which would set the text off
    // the M3 keyline
    radio.setMinWidth(0);
    radio.setMinimumWidth(0);
    return radio;
  }

  [checkedProperty.setNative](value) {
    if (isIOS) this.nativeViewProtected.hidden = !value;
    else this.nativeViewProtected.setChecked(value);
  }
}

checkedProperty.register(RadioMark);
