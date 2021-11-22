<template>
  <WebViewExt
    src="https://intel.ingress.com/"
    viewPortSize="width=device-width, initial-scale=1.0"
    domStorage=true
    @loaded="webViewLoaded"
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

  import storage from "~/utils/storage"
  import { router } from "@/utils/bridge";

  let webview;

  export default {
    data() {
      return {
      }
    },

    methods: {

      JSBridge(args) {
        const eventData = args.data;
        console.log("JSBridge data");
        console.log(eventData);

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

      async loadFinished(args) {
        await webview.executeJavaScript("" +
          "window.android = window.nsWebViewBridge;" +
          "window.nsWebViewBridge.setLayers = function(base_layer, overlay_layer) {" +
          "    window.nsWebViewBridge.emit('JSBridge', {'setLayers': {'base_layer': base_layer, 'overlay_layer': overlay_layer}});" +
          "};" +
          "window.nsWebViewBridge.setPermalink = function(href) {" +
          "    window.nsWebViewBridge.emit('JSBridge', {'setPermalink': {'href': href}});" +
          "};");

        const iitc_code = await storage.get("release_iitc_code").then(obj => obj["release_iitc_code"]);
        await webview.executeJavaScript(iitc_code);
      }
    },

    created() {
      handleOpenURL(function(appURL) {
        webview.loadUrl(String(appURL));
      });
    }
  }
</script>

<style scoped lang="scss">

</style>
