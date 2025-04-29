//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

<template>
  <BaseWebView
    ref="baseWebView"
    :src="intelMapUrl"
    :allowedDomains="allowedDomains"
    @webview-loaded="onWebViewLoaded"
    @load-started="onLoadStarted"
    @load-finished="onLoadFinished"
    @external-url="handleExternalUrl"
    @show-popup="handleShowPopup"
    @load-error="handleLoadError"
    @bridge-message="handleBridgeMessage"
  />
</template>

<script>
import { injectBridgeIITC, router } from "@/utils/bridge";
import { injectIITCPrimeResources } from "~/utils/iitc-prime-resources";
import BaseWebView from './BaseWebView.vue';
import { INGRESS_INTEL_MAP, WEBVIEW_ALLOWED_DOMAINS } from "@/utils/url-config";
import {changePortalHighlights, showLayer, switchToPane} from "@/utils/events-to-iitc";

export default {
  name: 'AppWebView',

  components: {
    BaseWebView
  },

  data() {
    return {
      store_unsubscribe: () => {},
      intelMapUrl: INGRESS_INTEL_MAP,
      allowedDomains: WEBVIEW_ALLOWED_DOMAINS
    }
  },

  computed: {
    webview() {
      return this.$refs.baseWebView?.webview;
    }
  },

  methods: {
    handleShowPopup(data) {
      this.$emit('show-popup', data);
    },

    handleExternalUrl(url) {
      this.$emit('show-popup', { url });
    },

    handleLoadError(error) {
      console.error('WebView load error:', error);
    },

    onLoadStarted() {
      this.$store.dispatch('ui/setWebviewLoadStatus', false);
    },

    async onLoadFinished() {
      await injectBridgeIITC(this.webview);
      await this.$store.dispatch('ui/setWebviewLoadStatus', true);
    },

    async onWebViewLoaded({ webview }) {
      this.$emit('webview-loaded', { webview });
    },

    handleBridgeMessage(eventData) {
      router(eventData);
    },
  },

  created() {
    this.store_unsubscribe = this.$store.subscribeAction({
      after: async (action, state) => {
        const webview = this.webview;
        if (!webview) return;

        switch (action.type) {
          case "ui/reloadWebView":
            await this.$refs.baseWebView.reload();
            break;
          case "ui/iitcBootFinished":
            await injectIITCPrimeResources(webview);
            break;
          case "map/setInjectPlugin":
            await webview.executeJavaScript(action.payload['code']);
            break;
          case "map/setActiveBaseLayer":
            await webview.executeJavaScript(showLayer(action.payload, true));
            break;
          case "map/setOverlayLayerProperty":
            const overlay_layer = state.map.overlayLayers[action.payload.index];
            await webview.executeJavaScript(showLayer(overlay_layer.layerId, overlay_layer.active));
            break;
          case "map/setActiveHighlighter":
            await webview.executeJavaScript(changePortalHighlights(action.payload));
            break;
          case "navigation/setCurrentPane":
            await webview.executeJavaScript(switchToPane(action.payload));
            break;
        }
      }
    });
  },

  beforeDestroy() {
    this.store_unsubscribe();
  }
};
</script>
