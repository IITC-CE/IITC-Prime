// Copyright (C) 2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

import {
  Button,
  Color,
  Property,
  Utils,
  booleanConverter,
  colorProperty,
  fontInternalProperty,
} from '@nativescript/core';
import { ACCENT_COLOR } from './ui';

const accent = new Color(ACCENT_COLOR);

/**
 * Button drawn by UIButtonConfiguration, iOS only. Button writes the title and color per state,
 * which overrides a configuration, so they go into the configuration instead.
 * Of the CSS background only background-color and border-radius are drawn.
 */
export class SystemButton extends Button {
  constructor() {
    super();
    // Keeps the theme's ".ns-dark Button" background and color off it
    this.cssType = 'SystemButton';
  }

  _setNativeText() {
    this._configure();
  }

  _setColor() {
    this._configure();
  }

  [fontInternalProperty.setNative](value) {
    super[fontInternalProperty.setNative](value);
    this._configure();
  }

  // UIKit would move a view backgroundColor into the configuration with its own corner radius
  _redrawNativeBackground() {
    this._configure();
    this._nativeBackgroundState = 'drawn';
  }

  _configure() {
    const button = this.nativeViewProtected;
    if (!button) return;
    const { variant, destructive, icon } = this;
    // System buttons are Liquid Glass since iOS 26
    const liquidGlass = Utils.SDK_VERSION >= 26;
    const Config = UIButtonConfiguration;
    let config;
    if (variant === 'plain') config = Config.plainButtonConfiguration();
    else if (variant === 'filled') {
      config = liquidGlass
        ? Config.prominentGlassButtonConfiguration()
        : Config.filledButtonConfiguration();
    } else {
      config = liquidGlass ? Config.glassButtonConfiguration() : Config.tintedButtonConfiguration();
    }
    config.title = this.text ?? '';

    const { backgroundColor, backgroundInternal, fontInternal, color } = this.style;
    if (backgroundColor?.a > 0) {
      const background = config.background;
      background.backgroundColor = backgroundColor.ios;
      background.cornerRadius = Utils.layout.toDeviceIndependentPixels(
        backgroundInternal.borderTopLeftRadius
      );
      config.background = background;
      config.cornerStyle = UIButtonConfigurationCornerStyle.Fixed;
    }

    if (icon && fontInternal) {
      const font = fontInternal.getUIFont(button.titleLabel.font);
      config.titleTextAttributesTransformer = attributes => {
        const result = attributes.mutableCopy();
        result.setObjectForKey(font, NSFontAttributeName);
        return result;
      };
      config.contentInsets = NSDirectionalEdgeInsetsZero;
    } else {
      // Text takes the system font and size, as in system sheets
      config.buttonSize = UIButtonConfigurationSize.Large;
    }

    // Css or higher: an inherited color is the page's text color, not meant for the button
    const ownColor = this.style[colorProperty.sourceKey] >= 2 ? color : null;
    // Liquid Glass titles don't follow the tint; a filled one lies on it
    const foreground =
      ownColor?.ios ??
      (liquidGlass && destructive && variant !== 'filled' ? UIColor.systemRedColor : null);
    if (foreground) config.baseForegroundColor = foreground;

    // The tinted fill follows the appearance, while the app is always dark
    button.overrideUserInterfaceStyle = UIUserInterfaceStyle.Dark;
    button.tintColor = destructive ? UIColor.systemRedColor : accent.ios;
    button.configuration = config;
  }
}

const reconfigure = (name, defaultValue, valueConverter) =>
  new Property({
    name,
    defaultValue,
    valueConverter,
    valueChanged: view => view._configure(),
  }).register(SystemButton);

reconfigure('variant', 'tinted');
reconfigure('destructive', false, booleanConverter);
reconfigure('icon', false, booleanConverter);
