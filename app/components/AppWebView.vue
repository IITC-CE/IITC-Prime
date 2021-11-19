<template>
  <WebViewExt
    src="https://intel.ingress.com/"
    viewPortSize="width=device-width, initial-scale=1.0"
    domStorage=true
    @loaded="webviewLoaded"
  />
</template>

<script>
  import WebViewExt from '@nota/nativescript-webview-ext/vue'
  import { eventBus } from '~/app'
  import storage from "~/utils/storage"
  import {ApplicationSettings} from "@nativescript/core";

  let webview;

  export default {
    data() {
      return {}
    },

    methods: {
      webviewLoaded(args) {
        webview = args.object;
      }
    },

    created() {
      eventBus.$on('init-iitc', async () => {

        const iitc_code = await storage.get("release_iitc_code").then(obj => obj["release_iitc_code"]);
        webview.executeJavaScript(iitc_code);

      })
    }
  }
</script>

<style scoped lang="scss">

</style>
