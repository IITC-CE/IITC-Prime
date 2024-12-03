/**
 * WebView chrome client implementation
 */
export const BaseWebChromeClient = android.webkit.WebChromeClient.extend({
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

    if (this.component?.createAuthPopup) {
      this.component.createAuthPopup(resultMsg);
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
});
