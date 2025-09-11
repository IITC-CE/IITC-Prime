// Copyright (C) 2024-2025 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <AWebView
    ref="webview"
    :src="src"
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
import { AWebView } from "@nativescript-community/ui-webview";
import { isAndroid } from "@nativescript/core";
import { applyWebViewSettings } from "@/utils/webview/webview-settings";
import { BaseWebChromeClient } from "@/utils/webview/base-chrome-client";
import { performanceOptimizationMixin } from "~/utils/performance-optimization";
import { mapState } from "vuex";

export default {
  name: "BaseWebView",

  mixins: [performanceOptimizationMixin],

  props: {
    src: {
      type: String,
      default: "",
    },
    viewPortSize: {
      type: String,
      default: "width=device-width, initial-scale=1.0",
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
      chromeClient: null,

      _webViewRef: null,
      isLoading: false,
      hasError: false,
      errorDetails: null,
    };
  },

  computed: {
    ...mapState({
      internalHostnames: (state) => state.map.internalHostnames,
      fakeUserAgent: (state) => state.settings.fakeUserAgent,
    }),

    webview() {
      return this.webViewInstance;
    },
  },

  watch: {
    fakeUserAgent(newValue) {
      // Reapply WebView settings and reload when fake user agent setting changes
      if (this.webViewInstance) {
        applyWebViewSettings(this.webViewInstance, newValue);
        this.webViewInstance.reload();
      }
    },
  },

  methods: {
    // Chrome Client Management
    createWebChromeClient() {
      const client = new BaseWebChromeClient();
      client.initWithComponent({
        setProgress: (progress) => {
          this.$emit("progress", progress);
        },
        showPopup: (popupData) => {
          this.$emit("show-popup", popupData);
        },
        closePopup: () => {
          this.$emit("close-popup");
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

      try {
        this._webViewRef = new WeakRef(this.webViewInstance);
      } catch (error) {
        console.error("Failed to create WeakRef for WebView:", error);
      }

      this.setupWebView();

      this.$emit("webview-loaded", {
        webview: this.webViewInstance,
        args,
      });
    },

    setupWebView() {
      if (!this.webViewInstance) return;

      applyWebViewSettings(this.webViewInstance, this.fakeUserAgent);
      this.setupWebChromeClient();

      // Setup console log event handlers
      this.setupDebugEventHandlers();

      // Setup JSBridge event handler
      this.webViewInstance.on("JSBridge", (msg) => {
        this.$emit("bridge-message", msg.data);
      });
    },

    // Setup event handlers for console bridge
    setupDebugEventHandlers() {
      if (!this.webViewInstance) return;

      this.webViewInstance.on("console:log", (event) => {
        this.$emit("console-log", event.data);
      });
    },

    onLoadStarted(args) {
      this.isLoading = true;
      this.hasError = false;
      this.errorDetails = null;
      this.$emit("load-started", args);
    },

    onLoadFinished(args) {
      this.isLoading = false;
      this.$emit("load-finished", args);
    },

    onLoadError(args) {
      this.isLoading = false;
      this.hasError = true;
      this.errorDetails = {
        code: args.code,
        message: args.message,
        url: args.url,
      };
      this.$emit("load-error", this.errorDetails);
    },

    // URL Navigation Control
    onShouldOverrideUrlLoading(args) {
      // Only check URLs if checkUrls is true
      if (this.checkUrls && !this.isUrlAllowed(args.url)) {
        args.cancel = true;
        this.$emit("external-url", args.url);
      }
      this.$emit("should-override-url-loading", args);
      return args;
    },

    onTitleChanged(args) {
      this.$emit("page-title-changed", args.title);
    },

    /**
     * Check if URL should be handled by the main WebView
     * URLs not allowed here will be opened in a popup WebView instead
     */
    isUrlAllowed(url) {
      if (!this.internalHostnames.length) return true;

      if (url === "about:blank") return true;

      try {
        const uri = new URL(url);
        const hostname = uri.hostname;

        // Check each allowed domain
        for (const domain of this.internalHostnames) {
          if (hostname === domain) return true;
          if (hostname.endsWith("." + domain)) return true;
        }

        return false;
      } catch (e) {
        console.error("Invalid URL:", url);
        return false;
      }
    },

    // Execute JavaScript command in webview
    executeCommand(command) {
      if (!this.webViewInstance || !command || command.trim() === "") {
        return;
      }
      this.webViewInstance.emitToWebView("console:execute", { command });
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
      if (this.webViewInstance) {
        try {
          if (this.chromeClient && isAndroid) {
            this.chromeClient.cleanup();
            this.webViewInstance.android?.setWebChromeClient(null);
            this.chromeClient = null;
          }

          const events = [
            "loaded",
            "loadStarted",
            "loadFinished",
            "loadError",
            "shouldOverrideUrlLoading",
            "console:log",
            "JSBridge",
          ];
          events.forEach((event) => {
            try {
              this.webViewInstance.removeEventListener(event);
            } catch (e) {
              console.error(`Warning: Could not remove listener for ${event}`);
            }
          });

          if (isAndroid) {
            const androidWebView = this.webViewInstance.android;
            if (androidWebView) {
              androidWebView.stopLoading(); // Stop any ongoing loads
              androidWebView.clearHistory(); // Clear navigation history
              androidWebView.clearCache(true); // Clear cache
              androidWebView.clearFormData(); // Clear form data
              androidWebView.clearMatches(); // Clear search matches
              androidWebView.loadUrl("about:blank"); // Clear all content

              try {
                androidWebView.setWebViewClient(null);
                androidWebView.setWebChromeClient(null);
                androidWebView.destroy(); // Destroy the WebView
              } catch (destroyError) {
                console.error("Error during WebView destroy:", destroyError);
              }
            }
          }

          // Clear instance reference
          this.webViewInstance = null;
          this.isLoading = false;
          this.hasError = false;
          this.errorDetails = null;
        } catch (e) {
          console.error("Error during WebView cleanup:", e);
        }
      }
    },
  },

  beforeUnmount() {
    try {
      this.cleanupWebView();

      if (this.performanceCleanup) {
        this.performanceCleanup();
      }

      this._webViewRef = null;
      this.chromeClient = null;
    } catch (error) {
      console.error("Error during BaseWebView cleanup:", error);
    }
  },
};
</script>
