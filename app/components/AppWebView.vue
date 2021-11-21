<template>
  <WebViewExt
    src="https://intel.ingress.com/"
    viewPortSize="width=device-width, initial-scale=1.0"
    domStorage=true
    @loaded="webviewLoaded"
    @loadFinished="loadFinished"
    @shouldOverrideUrlLoading="shouldOverrideUrlLoading"
  />
</template>

<script>
  import WebViewExt from '@nota/nativescript-webview-ext/vue'
  import { InAppBrowser } from 'nativescript-inappbrowser';
  import { ApplicationSettings, Utils, Dialogs } from "@nativescript/core";
  import { ToastDuration, Toasty } from '@triniwiz/nativescript-toasty';
  import { handleOpenURL } from 'nativescript-appurl';

  import { eventBus } from '~/app'
  import storage from "~/utils/storage"

  let webview;

  export default {
    data() {
      return {
      }
    },

    methods: {

      webviewLoaded(args) {
        webview = args.object;
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
        const iitc_code = await storage.get("release_iitc_code").then(obj => obj["release_iitc_code"]);
        await webview.executeJavaScript(iitc_code);
      }
    },

    created() {
      handleOpenURL(function(appURL) {
        webview.loadUrl(String(appURL));
      });

      // eventBus.$on('openURL', async (url) => {
      //   this.webview_url = url;
      // })
    }
  }
</script>

<style scoped lang="scss">

</style>
