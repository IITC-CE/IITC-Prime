//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

<template>
  <AbsoluteLayout class="popup-overlay">
    <StackLayout class="popup-content" width="90%" height="80%">
      <FlexboxLayout class="popup-inner" flexDirection="column">
        <FlexboxLayout class="popup-header">
          <Label :text="pageTitle" class="popup-title"/>
          <MDButton
            @tap="closePopup"
            class="close-button"
            text="✕"
            variant="text"
            rippleColor="#000000"
          />
        </FlexboxLayout>

        <BaseWebView
          ref="baseWebView"
          class="webview-container"
          @webview-loaded="onWebViewLoaded"
          @should-override-url-loading="onShouldOverrideUrlLoading"
        />
      </FlexboxLayout>
    </StackLayout>
  </AbsoluteLayout>
</template>

<script>
import { isAndroid } from "@nativescript/core";
import BaseWebView from './BaseWebView.vue';
import { BaseWebChromeClient } from '@/utils/webview/base-chrome-client';

export default {
  components: {
    BaseWebView
  },

  props: {
    url: {
      type: String,
    },
    transport: {
      type: Object,
    },
  },

  data() {
    return {
      pageTitle: 'Loading...',
      chromeClient: null
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
        closePopup: () => this.closePopup(),
        setPageTitle: (title) => {
          this.pageTitle = title;
        },
      });
      this.chromeClient = client;
      return client;
    },

    closePopup() {
      this.cleanupWebView();
      this.$emit('close');
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

    setTransport() {
      if (isAndroid && this.transport && this.webview) {
        const transport = this.transport.obj;
        transport?.setWebView(this.webview.android);
        this.transport.sendToTarget();
      }
    },

    setUrl() {
      if (this.url && this.webview) {
        this.webview.loadUrl(this.url);
      }
    },

    onWebViewLoaded({ webview }) {
      if (isAndroid) {
        const chromeClient = this.createWebChromeClient();
        webview.android.setWebChromeClient(chromeClient);
      }
      this.setTransport();
      this.setUrl();
    },

    onShouldOverrideUrlLoading(args) {
      if (args.url.includes("intel.ingress.com")) {
        this.closePopup();
        args.cancel = true;
      }
      return args;
    }
  },

  beforeDestroy() {
    this.cleanupWebView();
  }
}
</script>

<style scoped lang="scss">
.popup-overlay {
  background-color: rgba(0, 0, 0, 0.7);
  width: 100%;
  height: 100%;
  z-index: 9999;
}

.popup-content {
  background-color: white;
  border-radius: 10;
  margin: 10% 5%;
}

.popup-inner {
  height: 100%;
}

.popup-header {
  padding: 10;
  background-color: #f8f8f8;
  border-bottom-width: 1;
  border-bottom-color: #e0e0e0;
  border-top-left-radius: 10;
  border-top-right-radius: 10;
  justify-content: space-between;
  align-items: center;
}

.popup-title {
  font-size: 18;
  font-weight: bold;
  padding-left: 10;
}

.close-button {
  margin: 0;
  padding: 0;
  width: 40;
  max-width: 40;
  background-color: transparent;
  color: #222;
  font-size: 16;
}

.webview-container {
  flex-grow: 1;
}
</style>
