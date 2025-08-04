// Copyright (C) 2021-2025 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <Frame>
    <Page actionBarHidden="true">
    <RootLayout ref="rootLayout" height="100%" width="100%" @layoutChanged="onRootLayoutChanged">
      <AbsoluteLayout class="page">

        <!-- Main content with WebView (hidden when debug is active) -->
        <GridLayout
          rows="*, auto"
          columns="*"
          class="main-content"
          v-show="!isDebugActive"
        >
          <AppWebView
            ref="appWebView"
            row="0"
            col="0"
            @show-popup="handlePopup"
            @console-log="onConsoleLog"
          />
          <label
            row="1"
            col="0"
            v-show="sliding.isVisible"
            :height="layout.bottomPadding"
          />
        </GridLayout>

        <DebugConsole
          v-show="isDebugActive"
          class="debug-console"
          :is-visible="isDebugActive"
          :is-keyboard-open="isKeyboardOpen"
          @execute-command="executeDebugCommand"
        />

        <ProgressBar class="progress-bar" />
        <SlidingPanel
          v-show="sliding.isVisible && !isDebugActive"
          class="sliding-panel"
          :is-visible="sliding.isVisible && !isDebugActive"
        />

        <PopupWebView
          v-if="popup.isVisible"
          v-bind="popup.props"
          @close="handlePopupClose"
        />
      </AbsoluteLayout>
    </RootLayout>
    </Page>
  </Frame>
</template>

<script>
import { AndroidApplication, Application } from "@nativescript/core";
import { keyboardOpening } from '@bezlepkin/nativescript-keyboard-opening';
import { layoutService } from '~/utils/layout-service';
import UserLocation from "@/utils/user-location";
import { handleDeepLink } from '@/utils/deep-links';

import AppWebView from './AppWebView';
import ProgressBar from './ProgressBar';
import SlidingPanel from './SlidingPanel/SlidingPanel.vue';
import PopupWebView from './PopupWebView.vue';
import DebugConsole from './DebugConsole';

export default {
  name: 'MainView',

  components: {
    AppWebView,
    ProgressBar,
    SlidingPanel,
    PopupWebView,
    DebugConsole
  },

  data() {
    return {
      // Layout dimensions from the layout service
      layout: {
        bottomPadding: 0,
        panelWidth: 0,
        contentHeight: 0
      },
      popup: {
        isVisible: false,
        props: {
          url: null,
          transportId: null
        }
      },
      sliding: {
        isVisible: true,
      },
      unsubscribeStore: null,
      removeLayoutListener: null,
      keyboard: null,
      isKeyboardOpen: false,
      userLocation: null,
    }
  },

  computed: {
    isDebugActive() {
      return this.$store.state.ui.isDebugActive;
    }
  },

  methods: {
    /**
     * Called when RootLayout changes size
     * This captures real available space including keyboard state
     */
    onRootLayoutChanged(args) {
      if (!this.$refs.rootLayout || !this.$refs.rootLayout.nativeView) {
        console.error("RootLayout reference not available");
        return;
      }

      // Measure the real available dimensions with our layout service
      layoutService.measureLayout(this.$refs.rootLayout.nativeView);
    },

    /**
     * Handle layout changes from the layout service
     */
    handleLayoutChanged(args) {
      const { dimensions } = args;

      // Update local layout state
      this.layout = {
        bottomPadding: dimensions.bottomPadding,
        panelWidth: dimensions.panelWidth,
        contentHeight: dimensions.contentHeight
      };

      // Update Vuex store
      this.updateStoreLayout(dimensions);
    },

    /**
     * Update layout related values in the Vuex store
     */
    async updateStoreLayout(dimensions) {
      await Promise.all([
        this.$store.dispatch('ui/setSlidingPanelWidth', dimensions.panelWidth),
        this.$store.dispatch('ui/setScreenHeight', dimensions.contentHeight)
      ]);
    },

    handlePopup(data) {
      this.popup = {
        isVisible: true,
        props: data
      };
    },

    handlePopupClose() {
      this.popup = {
        isVisible: false,
        props: { url: null, transportId: null }
      };
    },

    // Handle console logs from AppWebView
    onConsoleLog(logData) {
      this.$store.dispatch('debug/addLog', logData);
    },

    // Execute debug command from Debug Console
    executeDebugCommand(command) {
      if (this.$refs.appWebView) {
        this.$refs.appWebView.executeDebugCommand(command);
      } else {
        console.error("AppWebView reference not found");
      }
    },

    async setupManager() {
      await this.$store.dispatch('manager/run');
    },

    setupAndroidBackHandler() {
      if (!Application.android) return;

      Application.android.on(AndroidApplication.activityBackPressedEvent, (args) => {
        // If debug is active, exit debug mode instead of navigating back
        if (this.isDebugActive) {
          this.$store.dispatch('ui/toggleDebugMode');
          args.cancel = true;
          return;
        }

        this.$store.dispatch('navigation/setCurrentPane', 'map');
        args.cancel = true;
      });
    },

    onKeyboardOpened(args) {
      this.sliding.isVisible = false;
      this.isKeyboardOpen = true;
    },
    onKeyboardClosed() {
      this.sliding.isVisible = true;
      this.isKeyboardOpen = false;
    }
  },

  async created() {
    // Initialize app settings
    await this.$store.dispatch('settings/initSettings');

    this.setupManager().then();
    this.setupAndroidBackHandler();

    // Initialize layout service with default dimensions
    layoutService.initWithDefaults();

    // Set initial layout values
    this.layout = {
      bottomPadding: layoutService.dimensions.bottomPadding,
      panelWidth: layoutService.dimensions.panelWidth,
      contentHeight: layoutService.dimensions.contentHeight
    };

    // Update store with initial values
    this.updateStoreLayout(layoutService.dimensions);

    this.userLocation = new UserLocation();

    // Subscribe to layout changes
    this.removeLayoutListener = layoutService.addLayoutChangeListener(this.handleLayoutChanged.bind(this));

    this.keyboard = keyboardOpening();

    this.keyboard.on('opened', this.onKeyboardOpened);
    this.keyboard.on('closed', this.onKeyboardClosed);

    // Initialize deep link handling
    handleDeepLink();

    this.unsubscribeStore = this.$store.subscribeAction({
      after: async (action) => {
        switch (action.type) {
          case "map/triggerUserLocate":
            if (this.userLocation) {
              await this.userLocation.locate();
            }
            break;
        }
      }
    });
  },

  beforeUnmount() {
    // Clean up all listeners
    if (this.unsubscribeStore) {
      this.unsubscribeStore();
    }

    if (this.removeLayoutListener) {
      this.removeLayoutListener();
    }

    if (this.keyboard) {
      this.keyboard.off('opened');
      this.keyboard.off('closed');
    }

    if (this.userLocation) {
      this.userLocation.stopTracking();
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

.debug-console {
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  z-index: 100;
}
</style>
