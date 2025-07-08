import { isAndroid } from "@nativescript/core";

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

  onReceivedTitle: function(view, title) {
    if (this.component?.setPageTitle) {
      this.component.setPageTitle(title);
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
      this.component.showPopup(resultMsg);
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
