<template>
  <WebViewExt
    src="https://intel.ingress.com/"
    viewPortSize="width=device-width, initial-scale=1.0"
    domStorage=true
    @loaded="webViewLoaded"
    @loadStarted="loadStarted"
    @loadFinished="loadFinished"
    @shouldOverrideUrlLoading="shouldOverrideUrlLoading"
    @JSBridge="JSBridge"
  />
</template>

<script>
  import WebViewExt from '@nota/nativescript-webview-ext/vue'
  import { InAppBrowser } from 'nativescript-inappbrowser';
  import { ApplicationSettings, Utils, Dialogs, isAndroid } from "@nativescript/core";
  import { ToastDuration, Toasty } from '@triniwiz/nativescript-toasty';
  import { handleOpenURL } from 'nativescript-appurl';

  import { mapState } from 'vuex';
  import storage from "~/utils/storage"
  import { injectBridgeIITC, router } from "@/utils/bridge";
  import {showLayer, switchToPane} from "@/utils/events-to-iitc";
  import {injectIITCPrimeResources} from "~/utils/iitc-prime-resources";

  let webview;

  export default {
    data() {
      return {
        store_unsubscribe: function() {}
      }
    },

    methods: {

      JSBridge(args) {
        const eventData = args.data;
        router(eventData);
      },

      webViewLoaded(args) {
        webview = args.object;
        if (isAndroid) {
          android.webkit.WebView['setWebContentsDebuggingEnabled'](true);
        }
      },

      showLoginToast() {
        new Toasty({ text: 'After successful authorization, click "Open in App" and select "IITC Prime"' })
          .setToastDuration(ToastDuration.LONG)
          .setTextColor("#000000")
          .setBackgroundColor('#ffffff')
          .show();
      },

      shouldOverrideUrlLoading(args) {
        const URL = require('url-parse');
        const uri = new URL(args.url);

        if (uri.hostname !== "intel.ingress.com") {

          if (uri.hostname === "accounts.google.com") {
            console.log("Google login");
            this.showLoginToast();
          } else if (uri.hostname === "www.facebook.com") {
            console.log("Facebook login");
            this.showLoginToast();
          }

          this.openExternalUrl(args.url);
          args.cancel = true;
        }
        return args;
      },

      async openExternalUrl(url) {
        // Custom Tabs API:
        // https://github.com/proyecto26/nativescript-inappbrowser
        try {
          if (await InAppBrowser.isAvailable()) {
            await InAppBrowser.open(url, {
              // iOS Properties
              enableBarCollapsing: false,
              // Android Properties
              forceCloseOnRedirection: true,
              hasBackButton: true,
              showInRecents: false
            });
          }
          else {
            Utils.openUrl(url);
          }
        }
        catch (error) {
          await Dialogs.alert({
            title: 'Error',
            message: error.message,
            okButtonText: 'Ok'
          });
        }
      },

      async loadStarted(args) {
        await this.$store.dispatch('setIsWebViewLoadFinished', false);
      },

      async loadFinished(args) {
        await injectBridgeIITC(webview);
        await injectIITCPrimeResources(webview);
        await this.$store.dispatch('setIsWebViewLoadFinished', true);
      }
    },

    async created() {
      handleOpenURL(function(appURL) {
        webview.loadUrl(String(appURL));
      });

      this.store_unsubscribe = this.$store.subscribeAction({
        after: async (action, state) => {
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

    onDestroy() {
      this.store_unsubscribe();
    }
  }
</script>

<style scoped lang="scss">

</style>
