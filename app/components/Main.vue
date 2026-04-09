// Copyright (C) 2021-2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <Frame>
    <Page
      actionBarHidden="true"
      androidOverflowEdge="dont-apply"
      @androidOverflowInset="onAndroidInset"
    >
      <RootLayout ref="rootLayout" height="100%" width="100%" @layoutChanged="onRootLayoutChanged">
        <BottomSheetPanel
          v-show="!isDebugActive"
          :isVisible="sliding.isVisible"
          :gestureEnabled="!isDebugActive"
          :panelWidth="layout.panelWidth"
          :safeAreaLeftInset="safeAreaLeftInset"
          :safeAreaRightInset="safeAreaRightInset"
          :navBarHeight="navBarHeight"
          :listBottomPadding="mapStateBarHeight + navBarHeight"
          @bottomSheetReady="handleBottomSheetReady"
        >
          <AbsoluteLayout class="page">
            <!-- Main content with WebView (hidden when debug is active) -->
            <GridLayout rows="*, auto" columns="*" class="main-content">
              <AppWebView
                ref="appWebView"
                row="0"
                col="0"
                @show-popup="handlePopup"
                @console-log="onConsoleLog"
              />
              <label row="1" col="0" :height="contentBottomPadding" />
            </GridLayout>

            <ProgressBar class="progress-bar" />
          </AbsoluteLayout>
        </BottomSheetPanel>

        <PopupWebView v-if="popup.isVisible" v-bind="popup.props" @close="handlePopupClose" />

        <!-- MapStateBar overlay - positioned at bottom, above BottomSheet -->
        <MapStateBar
          ref="mapStateBar"
          v-show="!isDebugActive"
          :bottomSheetRef="bottomSheetInstance"
          verticalAlignment="bottom"
          horizontalAlignment="left"
          :height="mapStateBarHeight + navBarHeight"
          :navBarHeight="navBarHeight"
          :panelWidth="layout.panelWidth"
          :safeAreaLeftInset="safeAreaLeftInset"
          class="map-state-bar-overlay"
        />

        <!-- Restore panel button (visible when panel is hidden) -->
        <MDRipple
          v-if="isPanelHidden && !isDebugActive"
          class="fab restore-panel-button"
          :style="{ marginBottom: navBarHeight + 16, marginLeft: safeAreaLeftInset + 16 }"
          @loaded="onRestoreButtonLoaded"
          @tap="restorePanel"
        >
          <Label
            class="fa"
            :text="$filters.fonticon('fa-chevron-up')"
            horizontalAlignment="center"
            verticalAlignment="center"
          />
        </MDRipple>

        <!-- Debug Console -->
        <AbsoluteLayout v-show="isDebugActive" class="page">
          <DebugConsole
            class="debug-console"
            :is-visible="isDebugActive"
            :is-keyboard-open="isKeyboardOpen"
            :keyboard-height="keyboardHeight"
            @execute-command="executeDebugCommand"
          />
        </AbsoluteLayout>
      </RootLayout>
    </Page>
  </Frame>
</template>

<script>
import {
  AndroidApplication,
  Application,
  CoreTypes,
  Frame,
  isAndroid,
  isIOS,
} from '@nativescript/core';
import { keyboardOpening } from '@bezlepkin/nativescript-keyboard-opening';
import { layoutService } from '~/utils/layout-service';
import UserLocation from '@/utils/user-location';
import { handleDeepLink } from '@/utils/deep-links';
import { parseAndroidInsets } from '@/utils/platform';

import AppWebView from './AppWebView';
import ProgressBar from './ProgressBar';
import BottomSheetPanel from './BottomPanel/BottomSheetPanel.vue';
import MapStateBar from './BottomPanel/MapStateBar/MapStateBar.vue';
import PopupWebView from './PopupWebView.vue';
import DebugConsole from './DebugConsole';

export default {
  name: 'MainView',

  components: {
    AppWebView,
    ProgressBar,
    BottomSheetPanel,
    MapStateBar,
    PopupWebView,
    DebugConsole,
  },

  data() {
    return {
      // Layout dimensions from the layout service
      layout: {
        bottomPadding: 0,
        panelWidth: 0,
        contentHeight: 0,
      },
      popup: {
        isVisible: false,
        props: {
          url: null,
          transportId: null,
        },
      },
      sliding: {
        isVisible: true,
      },
      bottomSheetInstance: null,
      mapStateBarHeight: 46,
      unsubscribeStore: null,
      removeLayoutListener: null,
      keyboard: null,
      isKeyboardOpen: false,
      keyboardHeight: 0,
      userLocation: null,
      navBarHeight: 0,
    };
  },

  computed: {
    isDebugActive() {
      return this.$store.state.ui.isDebugActive;
    },
    isPanelHidden() {
      return this.$store.state.ui.panelState.position === 'HIDDEN';
    },
    safeAreaLeftInset() {
      return this.$store.state.ui.screenSafeArea.left;
    },
    safeAreaRightInset() {
      return this.$store.state.ui.screenSafeArea.right;
    },

    /**
     * Bottom spacer height for AppWebView content area.
     * On Android with keyboard open: equals keyboardHeight to shrink WebView viewport,
     * so the browser engine scrolls focused inputs above the keyboard (adjustResize emulation).
     * Otherwise: equals bottomPadding to reserve space for the bottom panel.
     * On iOS WKWebView handles keyboard avoidance natively — no special handling needed.
     */
    contentBottomPadding() {
      if (isAndroid && this.isKeyboardOpen) {
        return this.keyboardHeight;
      }
      if (this.isPanelHidden) {
        return 0;
      }
      return this.layout.bottomPadding + this.navBarHeight;
    },
  },

  watch: {
    isPanelHidden(hidden) {
      this.updateMapStateBarVisibility(hidden, true);
    },
  },

  methods: {
    updateMapStateBarVisibility(hidden, animate) {
      const bar = this.$refs.mapStateBar?.$el?.nativeView;
      if (!bar) return;

      const bottomInset = this.navBarHeight || this.$store.state.ui.screenSafeArea.bottom;
      const slideDistance = this.mapStateBarHeight + bottomInset;
      const y = hidden ? slideDistance : 0;

      if (animate) {
        bar.animate({
          translate: { x: 0, y },
          duration: 200,
          curve: CoreTypes.AnimationCurve.easeOut,
        });
      } else {
        bar.translateY = y;
      }
    },

    /**
     * Called when RootLayout changes size
     * This captures real available space including keyboard state
     */
    onRootLayoutChanged(args) {
      if (!this.$refs.rootLayout || !this.$refs.rootLayout.nativeView) {
        console.error('RootLayout reference not available');
        return;
      }

      // Measure the real available dimensions with our layout service
      layoutService.measureLayout(this.$refs.rootLayout.nativeView);

      if (isIOS) {
        this.readIOSSafeAreaInsets();
      }
    },

    /**
     * Handle layout changes from the layout service
     */
    handleLayoutChanged(args) {
      const { dimensions } = args;

      // Re-apply MapStateBar position after layout change
      if (this.isPanelHidden) {
        this.$nextTick(() => this.updateMapStateBarVisibility(true, false));
      }

      // Update local layout state
      this.layout = {
        bottomPadding: dimensions.bottomPadding,
        panelWidth: dimensions.panelWidth,
        contentHeight: dimensions.contentHeight,
      };

      // Update Vuex store
      this.updateStoreLayout(dimensions);
    },

    /**
     * Update layout related values in the Vuex store
     */
    async updateStoreLayout(dimensions) {
      await this.$store.dispatch('ui/setLayoutDimensions', {
        contentHeight: dimensions.contentHeight,
        panelWidth: dimensions.panelWidth,
        availableWidth: dimensions.availableWidth,
      });
    },

    handlePopup(data) {
      this.popup = {
        isVisible: true,
        props: data,
      };
    },

    handlePopupClose() {
      this.popup = {
        isVisible: false,
        props: { url: null, transportId: null },
      };
    },

    /**
     * Handle BottomSheet ready event
     * Store reference to native instance for MapStateBar
     */
    handleBottomSheetReady(bottomSheet) {
      this.bottomSheetInstance = bottomSheet;
    },

    onRestoreButtonLoaded(args) {
      const btn = args.object;
      btn.translateY = 60;
      btn.opacity = 0;
      btn.animate({
        translate: { x: 0, y: 0 },
        opacity: 1,
        duration: 300,
        curve: CoreTypes.AnimationCurve.easeOut,
      });
    },

    restorePanel() {
      this.$store.dispatch('ui/closePanel');
    },

    // Handle console logs from AppWebView
    onConsoleLog(logData) {
      this.$store.dispatch('debug/addLog', logData);
    },

    readIOSSafeAreaInsets() {
      const rootView = this.$refs.rootLayout?.nativeView;
      if (!rootView?.ios) return;

      const insets = rootView.ios.safeAreaInsets;
      if (!insets) return;

      this.$store.dispatch('ui/setScreenSafeArea', {
        top: insets.top,
        bottom: insets.bottom,
        left: insets.left,
        right: insets.right,
      });
    },

    onAndroidInset(args) {
      if (!isAndroid || !args?.inset) return;
      const raw = args.inset;
      const { bottom, left, right } = parseAndroidInsets(raw);

      // Only update navBarHeight when keyboard is not open (imeBottom > 0 means keyboard is showing).
      if (raw.imeBottom === 0) {
        this.navBarHeight = bottom;
      }

      this.$store.dispatch('ui/setScreenSafeArea', { bottom, left, right });

      args.inset.topConsumed = true;
      args.inset.bottomConsumed = true;
      args.inset.leftConsumed = true;
      args.inset.rightConsumed = true;
      args.inset.imeBottomConsumed = true;
    },

    // Execute debug command from Debug Console
    executeDebugCommand(command) {
      if (this.$refs.appWebView) {
        this.$refs.appWebView.executeDebugCommand(command);
      } else {
        console.error('AppWebView reference not found');
      }
    },

    async setupManager() {
      await this.$store.dispatch('manager/run');
    },

    setupAndroidBackHandler() {
      if (!Application.android) return;

      Application.android.on(AndroidApplication.activityBackPressedEvent, args => {
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

    isMainPageActive() {
      const frame = Frame.topmost();
      return !frame?.backStack?.length;
    },

    onKeyboardOpened(args) {
      if (!this.isMainPageActive()) return;
      this.sliding.isVisible = false;
      this.isKeyboardOpen = true;
      this.keyboardHeight = args.data?.height || 0;
      this.$store.dispatch('ui/setKeyboardOpen', true);
    },
    onKeyboardClosed() {
      this.sliding.isVisible = true;
      this.isKeyboardOpen = false;
      this.keyboardHeight = 0;
      this.$store.dispatch('ui/setKeyboardOpen', false);
    },
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
      contentHeight: layoutService.dimensions.contentHeight,
    };

    // Update store with initial values
    this.updateStoreLayout(layoutService.dimensions);

    this.userLocation = new UserLocation();

    // Subscribe to layout changes
    this.removeLayoutListener = layoutService.addLayoutChangeListener(
      this.handleLayoutChanged.bind(this)
    );

    setTimeout(() => {
      this.keyboard = keyboardOpening();
      this.keyboard.on('opened', this.onKeyboardOpened);
      this.keyboard.on('closed', this.onKeyboardClosed);
    }, 1000);

    // Initialize deep link handling
    handleDeepLink();

    this.unsubscribeStore = this.$store.subscribeAction({
      after: async action => {
        switch (action.type) {
          case 'map/triggerUserLocate':
            if (this.userLocation) {
              await this.userLocation.locate();
            }
            break;
        }
      },
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
  },
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

.map-state-bar-overlay {
  z-index: 1000;
}

.restore-panel-button {
  horizontal-alignment: left;
  z-index: 1000;
}
</style>
