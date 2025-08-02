// Copyright (C) 2021-2025 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <BaseWebView
    ref="baseWebView"
    :src="intelMapUrl"
    :checkUrls="true"
    @webview-loaded="onWebViewLoaded"
    @load-started="onLoadStarted"
    @load-finished="onLoadFinished"
    @external-url="handleExternalUrl"
    @show-popup="handleShowPopup"
    @load-error="handleLoadError"
    @bridge-message="handleBridgeMessage"
    @console-log="handleConsoleLog"
  />
</template>

<script>
import { injectBridgeIITC, router } from "@/utils/bridge";
import { injectIITCPrimeResources } from "~/utils/iitc-prime-resources";
import { injectDebugBridge } from "@/utils/debug-bridge";
import BaseWebView from './BaseWebView.vue';
import { INGRESS_INTEL_MAP, addViewportParam } from "@/utils/url-config";
import {
  changePortalHighlights,
  showLayer,
  switchToPane,
  setView,
  userLocationLocate,
  userLocationUpdate,
  userLocationOrientation,
} from "@/utils/events-to-iitc";

export default {
  name: 'AppWebView',

  components: {
    BaseWebView
  },

  data() {
    return {
      store_unsubscribe: () => {},
      started: false,
    }
  },

  computed: {
    intelMapUrl() {
      return addViewportParam(INGRESS_INTEL_MAP);
    },

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

    async onLoadStarted() {
      this.started = true;
      await this.$store.dispatch('ui/setWebviewLoaded', false);
    },

    async onLoadFinished(arg) {
      // Only process Intel pages that have a corresponding onLoadStarted
      if (this.started && arg.url && arg.url.includes('intel.ingress.com')) {
        this.started = false;

        // Inject bridges first
        await injectBridgeIITC(this.webview);
        await injectDebugBridge(this.webview);

        // Then trigger plugin injection
        await this.$store.dispatch('ui/setWebviewLoaded', true);
      }
    },

    async onWebViewLoaded({ webview }) {
      this.$emit('webview-loaded', { webview });
    },

    handleBridgeMessage(eventData) {
      router(eventData);
    },

    handleConsoleLog(logData) {
      this.$emit('console-log', logData);
    },

    // Public method to execute debug command
    executeDebugCommand(command) {
      if (!this.$refs.baseWebView || !command) return;
      this.$refs.baseWebView.executeCommand(command);
    },

    async injectPlugin(plugin) {
      if (!this.webview || !plugin?.code) return;

      try {
        await this.webview.executeJavaScript(`
          try {
            ${plugin.code}
          } catch (e) {
            window.lastError = e.toString();
            console.error('injection error:', e);
            throw e;
          }
        `);
      } catch (error) {
        console.error('Plugin injection failed:', error);
      }
    }

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
            await this.injectPlugin(action.payload);
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
          case "map/locateMapOnce":
            await webview.executeJavaScript(setView(action.payload.lat, action.payload.lng, action.payload.persistentZoom));
            break;
          case "map/userLocationLocate":
            const { lat, lng, accuracy, persistentZoom } = action.payload;
            await webview.executeJavaScript(userLocationLocate(lat, lng, accuracy, persistentZoom));
            break;
          case "map/setLocation":
            await webview.executeJavaScript(userLocationUpdate(action.payload.lat, action.payload.lng));
            break;
          case "map/userLocationOrientation":
            await webview.executeJavaScript(userLocationOrientation(action.payload.direction));
            break;
        }
      }
    });
  },

  beforeUnmount() {
    this.store_unsubscribe();
  }
};
</script>
