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
    @shouldOverrideUrlLoading="onShouldOverrideUrlLoading"
  />
</template>

<script>
import WebViewExt from '@nota/nativescript-webview-ext/vue'
import { isAndroid } from "@nativescript/core";
import { applyWebViewSettings } from "@/utils/webview/webview-settings";

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
    }
  },

  data() {
    return {
      webViewInstance: null
    }
  },

  computed: {
    webview() {
      return this.webViewInstance;
    }
  },

  methods: {
    onWebViewLoaded(args) {
      this.webViewInstance = args.object;
      applyWebViewSettings(this.webViewInstance);

      this.$emit('webview-loaded', {
        webview: this.webViewInstance,
        args
      });
    },

    onLoadStarted(args) {
      console.log("Loading started:", args.url);
      this.$emit('load-started', args);
    },

    onLoadFinished(args) {
      console.log("Loading finished:", args.url);
      this.$emit('load-finished', args);
    },

    onShouldOverrideUrlLoading(args) {
      this.$emit('should-override-url-loading', args);
      return args;
    },

    executeJavaScript(code) {
      return this.webViewInstance?.executeJavaScript(code);
    },

    cleanupWebView() {
      if (this.webViewInstance && isAndroid) {
        try {
          const androidWebView = this.webViewInstance.android;
          androidWebView.stopLoading();
          androidWebView.clearHistory();
          androidWebView.clearCache(true);
          androidWebView.clearFormData();
          androidWebView.loadUrl("about:blank");
          androidWebView.destroy();
          this.webViewInstance = null;
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
