//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

<template>
  <Page actionBarHidden="true" @layoutChanged="handleLayoutChange">
    <RootLayout height="100%" width="100%">
      <AbsoluteLayout class="page">

        <FlexboxLayout
          flexDirection="column"
          class="main-content"
        >
          <AppWebView
            flexGrow="1"
            @show-popup="handlePopup"
          />
          <label :height="layoutConfig.bottomPadding" />
        </FlexboxLayout>

        <ProgressBar class="progress-bar" />
        <SlidingPanel class="sliding-panel" />

        <PopupWebView
          v-if="popup.isVisible"
          v-bind="popup.props"
          @close="handlePopupClose"
        />
      </AbsoluteLayout>
    </RootLayout>
  </Page>
</template>

<script>
import { Screen } from '@nativescript/core/platform';
import { AndroidApplication, Application } from "@nativescript/core";
import { getStatusBarHeight, getNavigationBarHeight } from '~/utils/platform';
import { Manager } from 'lib-iitc-manager';
import storage from "~/utils/storage";

import AppWebView from './AppWebView';
import ProgressBar from './ProgressBar';
import SlidingPanel from './SlidingPanel/SlidingPanel.vue';
import PopupWebView from './PopupWebView.vue';

const DEFAULT_PANEL_WIDTH = 500;
const BOTTOM_PADDING = 100;

export default {
  name: 'MainView',

  components: {
    AppWebView,
    ProgressBar,
    SlidingPanel,
    PopupWebView
  },

  data() {
    return {
      layoutConfig: {
        statusBarHeight: 0,
        navigationBarHeight: 0,
        bottomPadding: BOTTOM_PADDING,
      },
      popup: {
        isVisible: false,
        props: {
          url: null,
          transport: null
        }
      },
      unsubscribeStore: null
    }
  },

  methods: {
    async handleLayoutChange() {
      const { widthDIPs, heightDIPs } = Screen.mainScreen;

      this.layoutConfig = {
        statusBarHeight: getStatusBarHeight(),
        navigationBarHeight: getNavigationBarHeight(),
        bottomPadding: this.calculateBottomPadding(widthDIPs, heightDIPs)
      };

      await Promise.all([
        this.$store.dispatch('setSlidingPanelWidth', this.calculatePanelWidth(widthDIPs, heightDIPs)),
        this.$store.dispatch('setScreenHeight', heightDIPs - this.layoutConfig.statusBarHeight)
      ]);
    },

    calculateBottomPadding(width, height) {
      if (width <= height) return BOTTOM_PADDING;
      return width > 600 ? 0 : BOTTOM_PADDING;
    },

    calculatePanelWidth(width, height) {
      if (width <= height) return width;
      return width > 600 ? DEFAULT_PANEL_WIDTH : width - this.layoutConfig.navigationBarHeight;
    },

    handlePopup({ url, transport }) {
      this.popup = {
        isVisible: true,
        props: { url, transport }
      };
    },

    handlePopupClose() {
      this.popup = {
        isVisible: false,
        props: { url: null, transport: null }
      };
    },

    setupManager() {
      const manager = new Manager({
        storage,
        message: (message, args) => console.log(`Message: ${message}, args: ${args}`),
        progressbar: is_show => console.log(`Progress bar: ${is_show ? 'show' : 'hide'}`),
        inject_plugin: (p) => this.$store.dispatch('setInjectPlugin', p)
      });

      manager.run();
      return manager;
    },

    setupAndroidBackHandler() {
      if (!Application.android) return;

      Application.android.on(AndroidApplication.activityBackPressedEvent, (args) => {
        this.$store.dispatch('setCurrentPane', 'map');
        args.cancel = true;
      });
    }
  },

  async created() {
    const manager = this.setupManager();
    this.setupAndroidBackHandler();

    this.unsubscribeStore = this.$store.subscribeAction({
      after: async (action) => {
        switch (action.type) {
          case "setIsWebViewLoadFinished":
            if (action.payload) {
              await manager.inject();
            }
            break;
        }
      }
    });
  },

  beforeDestroy() {
    if (this.unsubscribeStore) {
      this.unsubscribeStore();
    }
  }
};
</script>

<style scoped lang="scss">
@import '../app';

.page {
  background-color: $accent;
}

.main-content {
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
}

.progress-bar {
  left: 0;
  top: 0;
  width: 100%;
}

.sliding-panel {
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
</style>
