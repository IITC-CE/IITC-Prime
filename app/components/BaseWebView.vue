// Copyright (C) 2024-2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <WebViewX
    ref="webview"
    :src="src"
    :userAgent="currentUA"
    :viewPortSize="viewPortSize"
    :debugMode="debugMode"
    @loaded="onWebViewLoaded"
    @loadStarted="onLoadStarted"
    @loadFinished="onLoadFinished"
    @loadError="onLoadError"
    @shouldOverrideUrlLoading="onShouldOverrideUrlLoading"
    @titleChanged="onTitleChanged"
  />
</template>

<script>
import { isAndroid } from '@nativescript/core';
import { applyWebViewSettings } from '@/utils/webview/webview-settings';
import {
  isIntelUrl,
  isExternalAppSchemeUrl,
  isLoginUrl,
  isUrlOnHostnames,
} from '@/utils/url-config';
import { getBaseUserAgent, getFakeDesktopUserAgent } from '@/utils/webview/user-agent';
import { alert as customAlert, confirm as customConfirm } from '@/utils/dialogs';
import { mapState } from 'vuex';

export default {
  name: 'BaseWebView',
  inheritAttrs: false,

  props: {
    src: {
      type: String,
      default: '',
    },
    viewPortSize: {
      type: String,
      default: 'width=device-width, initial-scale=1.0',
    },
    debugMode: {
      type: Boolean,
      default: true,
    },
    checkUrls: {
      type: Boolean,
      default: false,
    },
  },

  data() {
    return {
      webViewInstance: null,

      _webViewRef: null,
      isLoading: false,
      hasError: false,
      errorDetails: null,
    };
  },

  computed: {
    ...mapState({
      internalHostnames: state => state.map.internalHostnames,
      fakeUserAgent: state => state.settings.fakeUserAgent,
    }),

    webview() {
      return this.webViewInstance;
    },

    currentUA() {
      return this.fakeUserAgent ? getFakeDesktopUserAgent() : getBaseUserAgent();
    },
  },

  watch: {
    fakeUserAgent() {
      if (this.webViewInstance) {
        this.webViewInstance.reload();
      }
    },
  },

  methods: {
    // WebView State Management
    onWebViewLoaded(args) {
      this.webViewInstance = args.object;

      try {
        this._webViewRef = new WeakRef(this.webViewInstance);
      } catch (error) {
        console.error('Failed to create WeakRef for WebView:', error);
      }

      this.setupWebView();

      this.$emit('webview-loaded', {
        webview: this.webViewInstance,
        args,
      });
    },

    setupWebView() {
      if (!this.webViewInstance) return;

      applyWebViewSettings(this.webViewInstance);

      // Setup console log event handlers
      this.setupDebugEventHandlers();

      this.webViewInstance.off('JSBridge');
      this.webViewInstance.off('gmBridgeRequest');
      this.webViewInstance.off('popupNavigate');
      this.webViewInstance.off('webAlert');
      this.webViewInstance.off('webConfirm');

      this.webViewInstance.on('webAlert', async args => {
        await customAlert({ message: args.message });
        args.callback();
      });

      this.webViewInstance.on('webConfirm', async args => {
        const result = await customConfirm({ message: args.message });
        args.callback(result);
      });

      // Setup JSBridge event handler
      this.webViewInstance.on('JSBridge', msg => {
        this.$emit('bridge-message', msg.data);
      });

      // Setup GM API bridge event handler
      this.webViewInstance.on('gmBridgeRequest', msg => {
        this.$emit('bridge-message', ['gmBridgeRequest', msg.data]);
      });

      this.webViewInstance.on('popupNavigate', args => {
        const target = this.popupUrlTarget(args.url);
        if (target === 'popup') return;
        args.cancel = true;
        this.$emit(target === 'main' ? 'popup-navigate' : 'external-url', args.url);
      });
    },

    // Setup event handlers for console bridge
    setupDebugEventHandlers() {
      if (!this.webViewInstance) return;

      this.webViewInstance.off('console:log');
      this.webViewInstance.off('webConsole');

      this.webViewInstance.on('console:log', event => {
        this.$emit('console-log', event.data);
      });

      this.webViewInstance.on('webConsole', event => {
        this.$emit('console-log', {
          type: event.data.level,
          message: event.data.message,
          timestamp: new Date().toISOString(),
          source: 'webview',
        });
      });
    },

    onLoadStarted(args) {
      this.isLoading = true;
      this.hasError = false;
      this.errorDetails = null;
      this.$emit('load-started', args);
    },

    onLoadFinished(args) {
      this.isLoading = false;
      this.$emit('load-finished', args);
    },

    onLoadError(args) {
      this.isLoading = false;
      this.hasError = true;
      this.errorDetails = {
        code: args.code,
        message: args.message,
        url: args.url,
      };
      this.$emit('load-error', this.errorDetails);
    },

    // URL Navigation Control
    onShouldOverrideUrlLoading(args) {
      // Only check URLs if checkUrls is true
      if (this.checkUrls && !this.isUrlAllowed(args.url)) {
        args.cancel = true;
        this.$emit('external-url', args.url);
      }
      this.$emit('should-override-url-loading', args);
      return args;
    },

    onTitleChanged(args) {
      this.$emit('page-title-changed', args.title);
    },

    // Where a URL opened from or inside a popup belongs: 'main', 'popup' or 'external'
    popupUrlTarget(url) {
      if (isIntelUrl(url)) return 'main';
      if (isExternalAppSchemeUrl(url)) return 'external';
      // about:blank, data:, blob:, file:// are the popup's own content
      if (!/^https?:/i.test(url)) return 'popup';
      if (isUrlOnHostnames(url, this.internalHostnames) || isLoginUrl(url)) return 'popup';
      return 'external';
    },

    /**
     * Check if URL should be handled by the main WebView
     * URLs not allowed here will be opened in the system browser instead
     */
    isUrlAllowed(url) {
      if (!this.internalHostnames.length) return true;

      // Allow internal/system URLs
      if (url === 'about:blank' || url?.startsWith('file://')) return true;

      return isUrlOnHostnames(url, this.internalHostnames);
    },

    // Execute JavaScript command in webview
    executeCommand(command) {
      if (!this.webViewInstance || !command || command.trim() === '') {
        return;
      }
      this.webViewInstance.emitToWebView('console:execute', { command });
    },

    executeJavaScript(code) {
      return this.webViewInstance?.executeJavaScript(code);
    },

    // Re-assigning an unchanged src is a no-op and a fragment-only change is a
    // same-document hop - neither reloads the document, so fall back to native reload.
    reload(url) {
      const wv = this.webViewInstance;
      const target = url ?? this.src;
      if (!wv || !target) return;

      if (target.split('#')[0] !== (wv.src ?? '').split('#')[0]) {
        wv.loadUrl(target);
        return;
      }

      if (target !== wv.src) wv.loadUrl(target);
      wv.reload();
    },

    // Cleanup
    cleanupWebView() {
      if (this.webViewInstance) {
        try {
          const events = [
            'loaded',
            'loadStarted',
            'loadFinished',
            'loadError',
            'shouldOverrideUrlLoading',
            'console:log',
            'webConsole',
            'JSBridge',
            'gmBridgeRequest',
            'popupNavigate',
            'webAlert',
            'webConfirm',
          ];
          events.forEach(event => {
            try {
              this.webViewInstance.removeEventListener(event);
            } catch (e) {
              console.error(`Warning: Could not remove listener for ${event}`);
            }
          });

          if (isAndroid) {
            const androidWebView = this.webViewInstance.android;
            if (androidWebView) {
              try {
                androidWebView.stopLoading();
                androidWebView.setWebViewClient(null);
                androidWebView.setWebChromeClient(null);
                androidWebView.destroy();
              } catch (destroyError) {
                console.error('Error during WebView destroy:', destroyError);
              }
            }
          }

          // Clear instance reference
          this.webViewInstance = null;
          this.isLoading = false;
          this.hasError = false;
          this.errorDetails = null;
        } catch (e) {
          console.error('Error during WebView cleanup:', e);
        }
      }
    },
  },

  beforeUnmount() {
    try {
      this.cleanupWebView();

      this._webViewRef = null;
    } catch (error) {
      console.error('Error during BaseWebView cleanup:', error);
    }
  },
};
</script>
