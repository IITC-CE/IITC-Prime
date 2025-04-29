//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

<template>
  <Page actionBarHidden="true">
    <RootLayout ref="rootLayout" height="100%" width="100%" @layoutChanged="onRootLayoutChanged">
      <AbsoluteLayout class="page">

        <FlexboxLayout
          flexDirection="column"
          class="main-content"
        >
          <AppWebView
            flexGrow="1"
            @show-popup="handlePopup"
          />
          <label :height="layout.bottomPadding" />
        </FlexboxLayout>

        <ProgressBar class="progress-bar" />
        <SlidingPanel
          v-show="sliding.isVisible"
          class="sliding-panel"
        />

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
import { AndroidApplication, Application } from "@nativescript/core";
import { keyboardOpening } from '@bezlepkin/nativescript-keyboard-opening';
import { Manager } from 'lib-iitc-manager';
import storage from "~/utils/storage";
import { layoutService } from '~/utils/layout-service';

import AppWebView from './AppWebView';
import ProgressBar from './ProgressBar';
import SlidingPanel from './SlidingPanel/SlidingPanel.vue';
import PopupWebView from './PopupWebView.vue';

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
          transport: null
        }
      },
      sliding: {
        isVisible: true,
      },
      unsubscribeStore: null,
      removeLayoutListener: null,
      keyboard: null
    }
  },

  methods: {
    /**
     * Called when RootLayout changes size
     * This captures real available space including keyboard state
     */
    onRootLayoutChanged(args) {
      if (!this.$refs.rootLayout || !this.$refs.rootLayout.nativeView) {
        console.log("RootLayout reference not available");
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
      console.log("Layout changed:", dimensions);

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
        inject_plugin: (p) => this.$store.dispatch('map/setInjectPlugin', p)
      });

      manager.run();
      return manager;
    },

    setupAndroidBackHandler() {
      if (!Application.android) return;

      Application.android.on(AndroidApplication.activityBackPressedEvent, (args) => {
        this.$store.dispatch('navigation/setCurrentPane', 'map');
        args.cancel = true;
      });
    },

    onKeyboardOpened(args) {
      console.log('The keyboard is opened, height:', args.data.height);
      this.sliding.isVisible = false;
    },
    onKeyboardChanged(args) {
      console.log('The keyboard is changed, new height:', args.data.height);
    },
    onKeyboardClosed() {
      console.log('The keyboard is closed');
      this.sliding.isVisible = true;
    }
  },

  async created() {
    const manager = this.setupManager();
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

    // Subscribe to layout changes
    this.removeLayoutListener = layoutService.addLayoutChangeListener(this.handleLayoutChanged.bind(this));

    this.keyboard = keyboardOpening();

    this.keyboard.on('opened', this.onKeyboardOpened);
    this.keyboard.on('changed', this.onKeyboardChanged);
    this.keyboard.on('closed', this.onKeyboardClosed);

    this.unsubscribeStore = this.$store.subscribeAction({
      after: async (action) => {
        switch (action.type) {
          case "ui/setWebviewLoadStatus":
            if (action.payload) {
              await manager.inject();
            }
            break;
        }
      }
    });
  },

  beforeDestroy() {
    // Clean up all listeners
    if (this.unsubscribeStore) {
      this.unsubscribeStore();
    }

    if (this.removeLayoutListener) {
      this.removeLayoutListener();
    }

    if (this.keyboard) {
      this.keyboard.off('opened');
      this.keyboard.off('changed');
      this.keyboard.off('closed');
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
