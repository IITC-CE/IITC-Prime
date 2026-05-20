// Copyright (C) 2021-2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

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
import { injectBridgeIITC, router } from '@/utils/bridge';
import { injectCustomStyles, installFileChooserOverride } from '~/utils/iitc-prime-resources';
import { injectDebugBridge } from '@/utils/debug-bridge';
import BaseWebView from './BaseWebView.vue';
import { addViewportParam, INGRESS_INTEL_MAP } from '@/utils/url-config';
import { isIOS } from '@nativescript/core';

import {
  changePortalHighlights,
  showLayer,
  switchToPane,
  setView,
  userLocationLocate,
  userLocationUpdate,
  userLocationOrientation,
  setSafeAreaInsets,
} from '@/utils/events-to-iitc';

export default {
  name: 'AppWebView',

  components: {
    BaseWebView,
  },

  data() {
    return {
      store_unsubscribe: () => {},
      lastInjectedUrl: null, // URL (without hash) for which bridge was last injected
      pendingInjectionUrl: null, // URL set by onLoadStarted; onLoadFinished only injects for this URL
      injectionInProgress: false,
      pendingReloadUrl: null, // OAuth callback URL waiting for about:blank step to finish
    };
  },

  computed: {
    intelMapUrl() {
      // Add viewport param to current URL
      const currentUrl = this.$store.state.ui.currentUrl;
      const finalUrl = addViewportParam(currentUrl);
      return finalUrl;
    },

    webview() {
      return this.$refs.baseWebView?.webview;
    },
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

    async onLoadStarted(arg) {
      // onLoadStarted fires only for top-level page navigation,
      // not for subresources - use it to mark which URL needs bridge injection.
      // Ignore internal navigations (about:blank, file://) - they don't require webview reset
      if (!arg?.url || arg.url === 'about:blank' || arg.url.startsWith('file://')) {
        return;
      }

      const urlWithoutHash = arg.url.split('#')[0];

      // iOS fires loadStarted for same-document hash navigation but never fires loadFinished.
      // Only skip if the URL actually contains a hash - a plain URL reload must proceed normally.
      if (arg.url.includes('#') && urlWithoutHash === this.lastInjectedUrl) {
        return;
      }

      console.log('[AppWebView] onLoadStarted:', arg.url);

      try {
        if (arg.url.startsWith(INGRESS_INTEL_MAP)) {
          // Mark this URL as pending injection; onLoadFinished will inject only for this URL
          this.pendingInjectionUrl = urlWithoutHash;
          this.lastInjectedUrl = null;
        }

        await this.$store.dispatch('ui/setWebviewLoaded', false);
      } catch (error) {
        console.error('[AppWebView] onLoadStarted error:', error.message, error.stack);
      }
    },

    async onLoadFinished(arg) {
      // Two-step reload: wait for about:blank before loading the OAuth callback URL.
      // Ensures the hash causes a full cross-document load instead of a same-document navigation.
      if (this.pendingReloadUrl && !arg?.url?.startsWith(INGRESS_INTEL_MAP)) {
        const url = this.pendingReloadUrl;
        this.pendingReloadUrl = null;
        this.lastInjectedUrl = null; // OAuth URL has a hash; reset so the check above won't skip it
        this.webview?.loadUrl(url);
        return;
      }

      // Only process Intel pages
      if (!arg?.url || !arg.url.startsWith(INGRESS_INTEL_MAP)) {
        return;
      }

      const urlWithoutHash = arg.url.split('#')[0];

      // Skip subresources (/r/*, *.js, etc.) and hash-only changes:
      // only inject for the exact URL that triggered onLoadStarted
      if (urlWithoutHash !== this.pendingInjectionUrl) {
        return;
      }

      // Prevent concurrent injections
      if (this.injectionInProgress) {
        return;
      }

      // Lock injection BEFORE any async operations
      this.injectionInProgress = true;

      try {
        // Inject bridges first
        await injectBridgeIITC(this.webview);
        await injectDebugBridge(this.webview);

        // Inject early so styles are active before IITC rewrites document.head
        await injectCustomStyles(this.webview);

        this.lastInjectedUrl = urlWithoutHash;
        this.pendingInjectionUrl = null;

        // Then trigger plugin injection
        await this.$store.dispatch('ui/setWebviewLoaded', true);
      } catch (error) {
        console.error('[AppWebView] Bridge injection failed:', error);
      } finally {
        this.injectionInProgress = false;
      }
    },

    async onWebViewLoaded({ webview }) {
      if (isIOS) {
        // Prevent iOS from auto-shifting web content into safe area.
        // 2 = UIScrollViewContentInsetAdjustmentBehavior.never
        const nativeView = webview?.nativeViewProtected;
        if (nativeView?.scrollView) {
          nativeView.scrollView.contentInsetAdjustmentBehavior = 2;
        }
      }
      this.$emit('webview-loaded', { webview });
    },

    handleBridgeMessage(eventData) {
      router(eventData).catch(error => {
        console.error('[AppWebView] Bridge router error:', error.message, error.stack);
      });
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
        await this.webview.executeJavaScript(plugin.code, false);
        console.log(`Plugin ${plugin.uid} loaded`);
      } catch (error) {
        console.error(`Plugin ${plugin.uid} injection failed:`, error);
      }
    },
  },

  created() {
    this.store_unsubscribe = this.$store.subscribeAction({
      after: async (action, state) => {
        const webview = this.webview;
        if (!webview) return;

        switch (action.type) {
          case 'ui/reloadWebView':
            if (action.payload) {
              this.pendingReloadUrl = addViewportParam(action.payload);
              webview.loadUrl('about:blank');
            } else {
              await this.$refs.baseWebView.reload();
            }
            break;
          case 'ui/iitcBootFinished': {
            await installFileChooserOverride(webview);
            // Re-inject after IITC boot since document.head was replaced
            await injectCustomStyles(webview);
            // Set initial safe area insets after IITC loads
            const wsa = this.$store.getters['ui/webviewSafeArea'];
            await webview.executeJavaScript(
              setSafeAreaInsets(wsa.top, wsa.bottom, wsa.left, wsa.right)
            );
            break;
          }
          case 'map/setInjectPlugin':
            await this.injectPlugin(action.payload);
            break;
          case 'map/executeJavaScript':
            if (webview && action.payload) {
              await webview.executeJavaScript(action.payload);
            }
            break;
          case 'map/setActiveBaseLayer':
            await webview.executeJavaScript(showLayer(action.payload, true));
            break;
          case 'map/setOverlayLayerProperty': {
            const overlay_layer = state.map.overlayLayers[action.payload.index];
            await webview.executeJavaScript(showLayer(overlay_layer.layerId, overlay_layer.active));
            break;
          }
          case 'map/setActiveHighlighter':
            await webview.executeJavaScript(changePortalHighlights(action.payload));
            break;
          case 'navigation/setCurrentPane':
            await webview.executeJavaScript(switchToPane(action.payload));
            break;
          case 'map/locateMapOnce':
            await webview.executeJavaScript(
              setView(action.payload.lat, action.payload.lng, action.payload.persistentZoom)
            );
            break;
          case 'map/userLocationLocate': {
            const { lat, lng, accuracy, persistentZoom } = action.payload;
            await webview.executeJavaScript(userLocationLocate(lat, lng, accuracy, persistentZoom));
            break;
          }
          case 'map/setLocation':
            await webview.executeJavaScript(
              userLocationUpdate(action.payload.lat, action.payload.lng)
            );
            break;
          case 'map/userLocationOrientation':
            await webview.executeJavaScript(userLocationOrientation(action.payload.direction));
            break;
          case 'ui/setKeyboardOpen':
          case 'ui/setScreenSafeArea':
          case 'ui/setLayoutDimensions':
          case 'ui/setPanelPosition': {
            const wsa = this.$store.getters['ui/webviewSafeArea'];
            await webview.executeJavaScript(
              setSafeAreaInsets(wsa.top, wsa.bottom, wsa.left, wsa.right)
            );
            break;
          }
        }
      },
    });
  },

  beforeUnmount() {
    this.store_unsubscribe();
  },
};
</script>
