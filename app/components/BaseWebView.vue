//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

<template>
  <WebViewExt
    ref="webview"
    :src="src"
    :viewPortSize="viewPortSize"
    :debugMode="debugMode"
    @loaded="onWebViewLoaded"
    @loadStarted="onLoadStarted"
    @loadFinished="onLoadFinished"
    @loadError="onLoadError"
    @shouldOverrideUrlLoading="onShouldOverrideUrlLoading"
    @JSBridge="onJSBridge"
  />
</template>

<script>
import WebViewExt from '@nota/nativescript-webview-ext/vue'
import { isAndroid } from "@nativescript/core";
import { applyWebViewSettings } from "@/utils/webview/webview-settings";
import { BaseWebChromeClient } from '@/utils/webview/base-chrome-client';

export default {
  name: 'BaseWebView',

  props: {
    src: {
      type: String,
      default: ''
    },
    viewPortSize: {
      type: String,
      default: 'width=device-width, initial-scale=1.0'
    },
    debugMode: {
      type: Boolean,
      default: true
    },
    allowedDomains: {
      type: Array,
      default: () => []
    }
  },

  data() {
    return {
      webViewInstance: null,
      chromeClient: null,
      isLoading: false,
      hasError: false,
      errorDetails: null
    }
  },

  computed: {
    webview() {
      return this.webViewInstance;
    }
  },

  methods: {
    // Chrome Client Management
    createWebChromeClient() {
      const client = new BaseWebChromeClient();
      client.initWithComponent({
        setProgress: (progress) => {
          this.$emit('progress', progress);
        },
        setPageTitle: (title) => {
          this.$emit('title-changed', title);
        },
        showPopup: (resultMsg) => {
          this.$emit('show-popup', { transport: resultMsg });
        },
        closePopup: () => {
          this.$emit('close-popup');
        },
      });
      this.chromeClient = client;
      return client;
    },

    setupWebChromeClient() {
      if (isAndroid && this.webViewInstance) {
        const chromeClient = this.createWebChromeClient();
        this.webViewInstance.android.setWebChromeClient(chromeClient);
      }
    },

    // WebView State Management
    onWebViewLoaded(args) {
      this.webViewInstance = args.object;
      this.setupWebView();

      this.$emit('webview-loaded', {
        webview: this.webViewInstance,
        args
      });
    },

    setupWebView() {
      if (!this.webViewInstance) return;

      applyWebViewSettings(this.webViewInstance);
      this.setupWebChromeClient();

      // Setup console log event handlers
      this.setupDebugEventHandlers();
    },

    // Setup event handlers for console bridge
    setupDebugEventHandlers() {
      if (!this.webViewInstance) return;

      this.webViewInstance.on('console:log', (event) => {
        this.$emit('console-log', event.data);
      });

      this.webViewInstance.on('console:result', (event) => {
        this.$emit('console-result', event.data);
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
        url: args.url
      };
      this.$emit('load-error', this.errorDetails);
    },

    // URL Navigation Control
    onShouldOverrideUrlLoading(args) {
      if (!this.isUrlAllowed(args.url)) {
        args.cancel = true;
        this.$emit('external-url', args.url);
      }
      this.$emit('should-override-url-loading', args);
      return args;
    },

    isUrlAllowed(url) {
      if (!this.allowedDomains.length) return true;

      try {
        const uri = new URL(url);
        return this.allowedDomains.includes(uri.hostname);
      } catch (e) {
        console.error('Invalid URL:', url);
        return false;
      }
    },

    onJSBridge(args) {
      this.$emit('bridge-message', args.data);
    },

    // Execute JavaScript command in webview
    executeCommand(command) {
      if (!this.webViewInstance || !command || command.trim() === '') return;

      this.webViewInstance.emitToWebView('console:execute', { command });
    },

    executeJavaScript(code) {
      return this.webViewInstance?.executeJavaScript(code);
    },

    reload() {
      this.webViewInstance.loadUrl("about:blank");
      this.webViewInstance.loadUrl(this.src);
    },

    // Cleanup
    cleanupWebView() {
      if (this.webViewInstance && isAndroid) {
        try {
          if (this.chromeClient) {
            this.chromeClient.cleanup();
            this.webViewInstance.android?.setWebChromeClient(null);
            this.chromeClient = null;
          }

          const events = ['loaded', 'loadStarted', 'loadFinished', 'loadError', 'shouldOverrideUrlLoading'];
          events.forEach(event => {
            try {
              this.webViewInstance.removeEventListener(event);
            } catch (e) {
              console.log(`Warning: Could not remove listener for ${event}`);
            }
          });

          const androidWebView = this.webViewInstance.android;
          if (androidWebView) {
            androidWebView.stopLoading(); // Stop any ongoing loads
            androidWebView.clearHistory(); // Clear navigation history
            androidWebView.clearCache(true); // Clear cache
            androidWebView.loadUrl("about:blank"); // Clear all content
            androidWebView.destroy(); // Destroy the WebView
          }

          this.webViewInstance = null;
          this.isLoading = false;
          this.hasError = false;
          this.errorDetails = null;
        } catch (e) {
          console.error("Error during cleanup:", e);
        }
      }
    }
  },

  beforeDestroy() {
    this.cleanupWebView();
  }
}
</script>
