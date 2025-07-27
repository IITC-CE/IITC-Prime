// Copyright (C) 2024-2025 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

import { isAndroid } from "@nativescript/core";
import { transportManager } from "./transport-manager";

/**
 * WebView chrome client implementation
 */
export const BaseWebChromeClient = isAndroid ? android.webkit.WebChromeClient.extend({
  init: function () {},

  initWithComponent: function(component) {
    this.component = component;
  },

  onProgressChanged: function(view, progress) {
    if (this.component?.setProgress) {
      this.component.setProgress(progress);
    }
  },

  onConsoleMessage: function(consoleMessage) {
    console.log(`[WebView] ${consoleMessage.message()} -- From line ${consoleMessage.lineNumber()} of ${consoleMessage.sourceId()}`);
    return true;
  },

  onJsAlert: function(view, url, message, result) {
    console.log(`[WebView Alert] ${message}`);
    result.confirm();
    return true;
  },

  onCreateWindow: function(view, isDialog, isUserGesture, resultMsg) {
    if (!isUserGesture) return false;

    if (this.component?.showPopup) {
      const popupData = transportManager.storeTransport(resultMsg);
      this.component.showPopup(popupData);
      return true;
    }
    return false;
  },

  onCloseWindow: function(window) {
    if (this.component?.closePopup) {
      this.component.closePopup();
    }
  },

  cleanup: function() {
    this.component = null;
  }
}) : class BaseWebChromeClient {
  init() {}

  initWithComponent(component) {
    this.component = component;
  }

  cleanup() {
    this.component = null;
  }
};
