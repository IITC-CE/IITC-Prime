//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

<template>
  <BaseWebView
    ref="baseWebView"
    src="https://intel.ingress.com/"
    @webview-loaded="onWebViewLoaded"
    @load-started="onLoadStarted"
    @load-finished="onLoadFinished"
    @should-override-url-loading="onShouldOverrideUrlLoading"
  />
</template>

<script>
import { isAndroid } from "@nativescript/core";
import { injectBridgeIITC, router } from "@/utils/bridge";
import { showLayer, switchToPane } from "@/utils/events-to-iitc";
import { injectIITCPrimeResources } from "~/utils/iitc-prime-resources";
import BaseWebView from './BaseWebView.vue';
import { BaseWebChromeClient } from '@/utils/webview/base-chrome-client';

export default {
  components: {
    BaseWebView
  },

  data() {
    return {
      store_unsubscribe: () => {}
    }
  },

  computed: {
    webview() {
      return this.$refs.baseWebView?.webview;
    }
  },

  methods: {
    createWebChromeClient() {
      const client = new BaseWebChromeClient();
      client.initWithComponent({
        createAuthPopup: (resultMsg) => {
          this.$emit(
            'createPopup',
            {
              transport: resultMsg,
            }
          );
        },
      });
      this.chromeClient = client;
      return client;
    },

    cleanupWebView() {
      if (this.webview && isAndroid) {
        if (this.chromeClient) {
          this.chromeClient.cleanup();
          this.webview.android.setWebChromeClient(null);
          this.chromeClient = null;
        }

        this.$refs.baseWebView.cleanupWebView();
      }
    },

    JSBridge(args) {
      router(args.data);
    },

    onWebViewLoaded({ webview }) {
      if (isAndroid) {
        const chromeClient = this.createWebChromeClient();
        webview.android.setWebChromeClient(chromeClient);
      }

      this.$emit('webview-loaded', {
        webview,
      });
    },

    onLoadStarted() {
      this.$store.dispatch('setIsWebViewLoadFinished', false);
    },

    async onLoadFinished() {
      await injectBridgeIITC(this.webview);
      await injectIITCPrimeResources(this.webview);
      await this.$store.dispatch('setIsWebViewLoadFinished', true);
    },

    onShouldOverrideUrlLoading(args) {
      const uri = new URL(args.url);
      if (!["intel.ingress.com", "signin.nianticlabs.com"].includes(uri.hostname)) {
        this.$emit(
          'createPopup',
          {
            url: args.url,
          }
        );
        args.cancel = true;
      }
      return args;
    }
  },

  created() {
    this.store_unsubscribe = this.$store.subscribeAction({
      after: async (action, state) => {
        const webview = this.webview;

        switch (action.type) {
          case "setInjectPlugin":
            await webview.executeJavaScript(action.payload['code']);
            break;
          case "setActiveBaseLayer":
            await webview.executeJavaScript(showLayer(action.payload, true));
            break;
          case "setOverlayLayerProperty":
            const overlay_layer = state.overlay_layers[action.payload.index];
            await webview.executeJavaScript(showLayer(overlay_layer.layerId, overlay_layer.active));
            break;
          case "setCurrentPane":
            await webview.executeJavaScript(switchToPane(action.payload));
            break;
        }
      }
    })
  },

  beforeDestroy() {
    this.store_unsubscribe();
    this.cleanupWebView();
  }
}
</script>

<style scoped lang="scss">
GridLayout {
  background-color: white;
}
</style>
