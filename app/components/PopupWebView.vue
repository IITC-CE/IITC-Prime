// Copyright (C) 2024-2025 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <AbsoluteLayout class="popup-overlay">
    <StackLayout class="popup-content" width="90%" height="80%">
      <GridLayout class="popup-inner" rows="auto, *" columns="*">
        <GridLayout class="popup-header" row="0" col="0" columns="*, auto">
          <Label :text="pageTitle" class="popup-title" col="0" row="0"/>
          <MDButton
            @tap="closePopup"
            class="close-button"
            text="✕"
            variant="text"
            rippleColor="#000000"
            col="1"
            row="0"
          />
        </GridLayout>

        <AbsoluteLayout class="webview-wrapper" row="1" col="0">
          <BaseWebView
            ref="baseWebView"
            class="webview-container"
            :src="url"
            @webview-loaded="onWebViewLoaded"
            @title-changed="updatePageTitle"
            @external-url="handleExternalUrl"
            @progress="updateProgress"
            @close-popup="closePopup"
            @load-error="handleLoadError"
          />

          <Progress
            v-show="isLoading"
            :value="loadingProgress"
            maxValue="100"
            class="progress-bar"
          />
        </AbsoluteLayout>

      </GridLayout>
    </StackLayout>
  </AbsoluteLayout>
</template>

<script>
import BaseWebView from './BaseWebView.vue';

export default {
  name: 'PopupWebView',

  components: {
    BaseWebView
  },

  props: {
    url: {
      type: String,
      default: ''
    },
    transport: {
      type: Object,
      default: null
    }
  },

  data() {
    return {
      pageTitle: 'Loading...',
      isLoading: false,
      loadingProgress: 0,
      hasError: false
    }
  },

  computed: {
    webview() {
      return this.$refs.baseWebView?.webview;
    }
  },

  methods: {
    updatePageTitle(title) {
      this.pageTitle = title || 'Loading...';
    },

    updateProgress(progress) {
      this.loadingProgress = progress;
      this.isLoading = progress < 100;
    },

    handleExternalUrl(url) {
      console.debug('External URL in popup:', url);
    },

    handleLoadError(error) {
      this.hasError = true;
      console.error('Popup WebView load error:', error);
    },

    closePopup() {
      this.$emit('close');
    },

    onWebViewLoaded({ webview }) {
      if (this.transport) {
        const transport = this.transport.obj;
        transport?.setWebView(webview.android);

        try {
          if (transport && transport.getWebView()) {
            this.transport.sendToTarget();
          }
        } catch (error) {
          console.error('Error sending transport message:', error);
        }
      }
    }
  }
};
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
  padding: 5;
  height: 50;
  min-height: 50;
  background-color: #f8f8f8;
  border-bottom-width: 1;
  border-bottom-color: #e0e0e0;
  border-top-left-radius: 10;
  border-top-right-radius: 10;
}

.popup-title {
  font-size: 16;
  font-weight: bold;
  padding-left: 10;
}

.close-button {
  margin: 0;
  padding: 0;
  width: 40;
  min-width: 40;
  max-width: 40;
  background-color: transparent;
  color: #222;
  font-size: 16;
}

.webview-container {
  flex-grow: 1;
}

.progress-bar {
  height: 2;
  left: 0;
  top: 0;
  width: 100%;
}

.webview-container {
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
}
</style>
