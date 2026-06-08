// Copyright (C) 2021-2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <BaseWebView
    ref="baseWebView"
    :src="intelMapUrl"
    :checkUrls="true"
    @webview-loaded="onWebViewLoaded"
    @load-started="onLoadStarted"
    @load-finished="onLoadFinished"
    @popup-navigate="handlePopupNavigate"
    @external-url="handleExternalUrl"
    @load-error="handleLoadError"
    @bridge-message="handleBridgeMessage"
    @console-log="handleConsoleLog"
  />
</template>

<script>
import {
  injectBridgeIITC,
  writeBridgeScriptFile,
  injectPrimeParams,
  writePrimeParamsFile,
  router,
} from '@/utils/bridge';
import { injectCustomStyles, installFileChooserOverride } from '~/utils/iitc-prime-resources';
import { injectDebugBridge, writeDebugBridgeFile } from '@/utils/debug-bridge';
import {
  deletePluginScriptFile,
  writePluginsMarkerFile,
  pluginScriptName,
  PLUGINS_MARKER_NAME,
  PLUGINS_READY_FLAG,
} from '@/utils/plugin-scripts';
import BaseWebView from './BaseWebView.vue';
import { addViewportParam, INGRESS_INTEL_MAP } from '@/utils/url-config';
import { isIOS, isAndroid, Utils } from '@nativescript/core';

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

// Scripts pre-registered to run at DOMContentLoaded on every navigation (iOS: WKUserScript
// atDocumentEnd; Android: addDocumentStartJavaScript wrapped in a DOMContentLoaded guard).
// The `check` expression detects cold-start absence so the fallback `inject` can run.
const PRELOAD_SCRIPTS = [
  {
    name: 'iitcBridge',
    write: writeBridgeScriptFile,
    inject: injectBridgeIITC,
    check: 'typeof window.app !== "undefined"',
  },
  {
    name: 'iitcDebugBridge',
    write: writeDebugBridgeFile,
    inject: injectDebugBridge,
    check: 'window.__debugBridgeInstalled === true',
  },
  {
    name: 'iitcPrimeParams',
    write: writePrimeParamsFile,
    inject: injectPrimeParams,
    check: 'typeof window.__iitcShowZoom !== "undefined"',
    // Re-registered on reload; re-registration moves a script to the end of the
    // WKUserScript list, so only this settings-dependent entry is dynamic.
    dynamic: true,
  },
];

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
    handlePopupNavigate(url) {
      if (url && url.startsWith(INGRESS_INTEL_MAP)) {
        this.$store.dispatch('ui/reloadWebView', url);
      }
    },

    handleExternalUrl(url) {
      if (url) Utils.openUrl(url);
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
        for (const script of PRELOAD_SCRIPTS) {
          const present = await this.webview.executeJavaScript(script.check);
          if (present !== true) {
            await script.inject(this.webview);
          }
        }

        // Flag is set by the trailing marker user script after all plugins ran.
        // Not set on cold start (manager not ready yet before first load).
        const pluginsReady = await this.webview.executeJavaScript(
          `window.${PLUGINS_READY_FLAG} === true`
        );
        if (pluginsReady !== true) {
          await this.$store.dispatch('manager/inject');
        }

        this.lastInjectedUrl = urlWithoutHash;
        this.pendingInjectionUrl = null;

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

      await this.registerPreloadScripts(webview);

      // Manager may have finished before the webview was ready.
      if (this.$store.state.manager.isInitialized) {
        await this.registerPluginScripts();
      }

      this.$emit('webview-loaded', { webview });
    },

    async registerPreloadScripts(webview, { dynamicOnly = false } = {}) {
      if (!webview) return;
      for (const script of PRELOAD_SCRIPTS) {
        if (dynamicOnly && !script.dynamic) continue;
        try {
          const filePath = await script.write();
          webview.removeAutoLoadJavaScriptFile(script.name);
          await webview.autoLoadJavaScriptFile(script.name, filePath);
        } catch (error) {
          console.error(`[AppWebView] Failed to register ${script.name}:`, error);
        }
      }
    },

    // Pre-register plugins as document-start scripts. On Android this requires
    // addDocumentStartJavaScript support; without it the x-local async fallback would arrive
    // after onLoadFinished and double-inject the non-idempotent IITC core.
    registerPluginScripts() {
      const webview = this.webview;
      if (!webview) return;
      if (!isIOS) {
        if (!isAndroid) return;
        try {
          if (
            !androidx.webkit.WebViewFeature.isFeatureSupported(
              androidx.webkit.WebViewFeature.DOCUMENT_START_SCRIPT
            )
          )
            return;
        } catch {
          return;
        }
      }

      // manager/run and handlePluginEvent can overlap; coalesce into one run.
      if (this.pluginRegistrationPromise) {
        this.pluginRegistrationPending = true;
        return this.pluginRegistrationPromise;
      }
      this.pluginRegistrationPromise = this._runPluginRegistration().finally(() => {
        this.pluginRegistrationPromise = null;
      });
      return this.pluginRegistrationPromise;
    },

    async _runPluginRegistration() {
      do {
        this.pluginRegistrationPending = false;
        await this._registerPluginScriptsOnce();
      } while (this.pluginRegistrationPending);
    },

    async _registerPluginScriptsOnce() {
      const webview = this.webview;
      if (!webview) return;

      try {
        const scripts = await this.$store.dispatch('manager/getEnabledPluginScripts');
        const newUids = scripts.map(s => s.uid);
        const newUidSet = new Set(newUids);

        for (const uid of this.registeredPluginUids) {
          if (!newUidSet.has(uid)) {
            webview.removeAutoLoadJavaScriptFile(pluginScriptName(uid));
            await deletePluginScriptFile(uid);
          }
        }

        for (const { uid, filePath } of scripts) {
          webview.removeAutoLoadJavaScriptFile(pluginScriptName(uid));
          await webview.autoLoadJavaScriptFile(pluginScriptName(uid), filePath);
        }

        // Marker last, so it runs after every plugin.
        const markerPath = await writePluginsMarkerFile();
        webview.removeAutoLoadJavaScriptFile(PLUGINS_MARKER_NAME);
        await webview.autoLoadJavaScriptFile(PLUGINS_MARKER_NAME, markerPath);

        this.registeredPluginUids = newUids;
      } catch (error) {
        console.error('[AppWebView] Failed to register plugin scripts:', error);
      }
    },

    handleBridgeMessage(eventData) {
      router(eventData).catch(error => {
        console.error('[AppWebView] Bridge router error:', error.message, error.stack);
      });
    },

    handleConsoleLog(logData) {
      this.$emit('console-log', logData);
    },

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

    async performReload() {
      const webview = this.webview;
      if (!webview) return;
      if (this.pluginRegistrationPromise) await this.pluginRegistrationPromise;
      // Only re-register the dynamic script: static ones stay ordered before plugins.
      await this.registerPreloadScripts(webview, { dynamicOnly: true });
      await this.$refs.baseWebView.reload();
    },
  },

  created() {
    // Non-reactive: avoid Vue observing large plugin code strings.
    this.registeredPluginUids = [];
    this.pluginRegistrationPromise = null;
    this.pluginRegistrationPending = false;
    this.reloadPending = false;

    this.mainPageActive_unwatch = this.$watch(
      () => this.$store.state.ui.isMainPageFocused,
      active => {
        if (active && this.reloadPending) {
          this.reloadPending = false;
          this.performReload().catch(error => {
            console.error('[AppWebView] Deferred reload failed:', error);
          });
        }
      }
    );

    this.store_unsubscribe = this.$store.subscribeAction({
      after: async (action, state) => {
        const webview = this.webview;
        if (!webview) return;

        switch (action.type) {
          case 'manager/run':
          case 'manager/handlePluginEvent':
            await this.registerPluginScripts();
            break;
          case 'ui/reloadWebView':
            if (action.payload) {
              this.pendingReloadUrl = addViewportParam(action.payload);
              webview.loadUrl('about:blank');
            } else if (this.$store.state.ui.isMainPageFocused) {
              await this.performReload();
            } else {
              this.reloadPending = true;
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
    this.mainPageActive_unwatch?.();
  },
};
</script>
