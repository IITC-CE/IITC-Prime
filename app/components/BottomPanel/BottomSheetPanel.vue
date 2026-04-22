// Copyright (C) 2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <BottomSheet
    v-model="stepIndexLocal"
    :steps="steps"
    scrollViewId="panelScrollView"
    :gestureEnabled="gestureEnabled"
    backdropColor="rgba(0, 0, 0, 0.3)"
    :translationFunction="backdropTranslationFunction"
    @loaded="$emit('bottomSheetReady', $event.object)"
  >
    <!-- Main content area (slot for WebView from parent) -->
    <GridLayout width="100%" height="100%">
      <slot />
    </GridLayout>

    <!-- Bottom Sheet Content -->
    <GridLayout
      nodeRole="bottomSheet"
      class="panel-container"
      rows="auto, auto, *"
      :marginLeft="effectiveLeftInset"
      :width="panelWidth ? panelWidth - effectiveLeftInset : '100%'"
      height="100%"
      :style="{ paddingBottom: effectiveListPaddingBottom }"
    >
      <!-- Header with drag indicator -->
      <StackLayout row="0" class="panel-header">
        <Label class="panel-header-line" />
      </StackLayout>

      <!-- Control buttons -->
      <GridLayout row="1" class="panel-buttons" columns="auto, auto, *, auto, auto, auto">
        <!-- Quick Access Button / Back Button -->
        <MDButton
          col="0"
          variant="flat"
          class="fa app-control-button"
          :class="{
            'app-control-button--active':
              isPanelOpen && (activeButton === 'quick' || activeButton === null),
          }"
          :text="$filters.fonticon(isMapPane ? 'fa-bars' : 'fa-arrow-left')"
          @tap="isMapPane ? handleControlButtonTap('quick') : handleBackToMap()"
        />

        <!-- App Name / Pane Title -->
        <Label col="1" :text="panelTitle" class="panel-title-label" verticalAlignment="center" />

        <!-- Paste from Clipboard Button (visible when a URL is detected in clipboard) -->
        <MDButton
          v-if="hasClipboardLink"
          col="3"
          variant="flat"
          class="fa app-control-button"
          :text="$filters.fonticon('fa-paste')"
          @tap="onPasteClipboard"
        />

        <!-- Location Button -->
        <MDButton
          v-show="isIitcLoaded"
          col="4"
          variant="flat"
          class="fa app-control-button"
          :text="$filters.fonticon(locationButtonIcon)"
          @tap="onLocate"
        />

        <!-- Layers Button -->
        <MDButton
          v-show="isIitcLoaded"
          col="5"
          variant="flat"
          class="fa app-control-button"
          :class="{ 'app-control-button--active': isPanelOpen && activeButton === 'layers' }"
          :text="$filters.fonticon('fa-layer-group')"
          @tap="handleControlButtonTap('layers')"
        />
      </GridLayout>

      <!-- Content area -->
      <AppControlListView row="2" id="panelScrollView" :listItems="currentListItems" />
    </GridLayout>
  </BottomSheet>
</template>

<script>
import { mapState, mapActions, mapGetters } from 'vuex';
import AppControlListView from '@/components/BottomPanel/ControlPanel/ControlListView.vue';
import { ControlPanelDataService } from '@/components/BottomPanel/ControlPanel/services/controlPanelDataService.js';
import { Application, isIOS, isAndroid } from '@nativescript/core';
import { Toasty } from '@triniwiz/nativescript-toasty';
import { layoutService } from '~/utils/layout-service';
import { getAppName, readClipboardText } from '~/utils/platform';
import { hasClipboardUrl } from '~/utils/clipboard';
import { isSupportedDeepLinkUrl, processDeepLink } from '~/utils/deep-links';

export default {
  name: 'BottomSheetPanel',

  components: {
    AppControlListView,
  },

  emits: ['bottomSheetReady'],

  props: {
    isVisible: {
      type: Boolean,
      default: true,
    },
    gestureEnabled: {
      type: Boolean,
      default: true,
    },
    panelWidth: {
      type: Number,
      default: 0,
    },
    navBarHeight: {
      type: Number,
      default: 0,
    },
    safeAreaLeftInset: {
      type: Number,
      default: 0,
    },
    safeAreaRightInset: {
      type: Number,
      default: 0,
    },
    listBottomPadding: {
      type: Number,
      default: 0,
    },
  },

  data() {
    return {
      screenHeight: this._getScreenHeight(),
      stepIndexLocal: 0,
      lastStepIndex: 0,
      _activeButton: null,
      removeLayoutListener: null,
      hasClipboardLink: false,
      _boundAndroidActivityResumedHandler: null,
      PANEL_CLOSED_HEIGHT: 110, // Visible height when panel is in BOTTOM position
    };
  },

  computed: {
    ...mapState({
      storedActivePanel: state => state.ui.activePanel,
      isPanelOpen: state => state.ui.panelState.isOpen,
      isIitcLoaded: state => state.ui.isIitcLoaded,
      panelCommand: state => state.ui.panelCommand,
      currentPane: state => state.navigation.currentPane,
      panes: state => state.navigation.panes,
    }),

    ...mapGetters('map', ['isFollowingUser']),

    /**
     * On iOS, ui-persistent-bottomsheet sets iosOverflowSafeAreaEnabled=false on the
     * bottomSheet child, so iOS automatically constrains it to the safe area.
     * We must not add marginLeft on iOS or the inset would be applied twice.
     */
    effectiveLeftInset() {
      return isIOS ? 0 : this.safeAreaLeftInset;
    },

    /**
     * Check if current pane is map
     */
    isMapPane() {
      return this.currentPane === 'map';
    },

    /**
     * Get panel title - app name for map pane, pane label for others
     */
    panelTitle() {
      if (this.isMapPane) {
        return getAppName();
      }

      const pane = this.panes.find(p => p.name === this.currentPane);
      return pane ? pane.label : '';
    },

    /**
     * Active button state
     */
    activeButton: {
      get() {
        return this._activeButton || this.storedActivePanel;
      },
      set(value) {
        this._activeButton = value;
      },
    },

    /**
     * Determine location button icon based on follow mode
     */
    locationButtonIcon() {
      return this.isFollowingUser
        ? 'fa-crosshairs' // Following mode icon
        : 'fa-location-arrow'; // Regular locate icon
    },

    /**
     * Generate list items for current active button
     */
    currentListItems() {
      return ControlPanelDataService.generateListData(this.activeButton, this.$store);
    },

    /**
     * Steps for bottom sheet positions: [HIDDEN, BOTTOM, MIDDLE, TOP]
     */
    steps() {
      const height = this.screenHeight || 800;
      const middlePosition = height / 2;
      const topPosition = height - 50;
      // Bottom step extends behind the nav bar so panel content stays above it
      const bottomStep = this.PANEL_CLOSED_HEIGHT + this.navBarHeight;

      return [0, bottomStep, middlePosition, topPosition];
    },

    /**
     * Keeps backdrop fully transparent at HIDDEN and BOTTOM steps,
     * then fades in smoothly from BOTTOM to TOP.
     */
    backdropTranslationFunction() {
      return (value, max, progress) => {
        const bottomStep = this.steps[1] || 0;
        const threshold = max > 0 ? bottomStep / max : 0;
        const opacity = progress <= threshold ? 0 : (progress - threshold) / (1 - threshold);
        return {
          bottomSheet: { translateY: value },
          backDrop: { opacity },
        };
      };
    },

    /**
     * Effective bottom padding for the panel content area.
     * listBottomPadding reserves space above MapStateBar/navBar.
     * The extra gap (screenHeight - topPosition) compensates for the portion
     * of the ListView that extends below the visible screen at TOP position,
     * ensuring content can scroll far enough to clear the MapStateBar.
     */
    effectiveListPaddingBottom() {
      const topPosition = this.steps[this.steps.length - 1];
      const topGap = (this.screenHeight || 800) - topPosition;
      return this.listBottomPadding + topGap;
    },
  },

  watch: {
    storedActivePanel(newValue) {
      this._activeButton = newValue;
    },

    /**
     * Watch isMapPane to collapse panel when switching to non-map panes
     */
    isMapPane(newValue) {
      if (!newValue) {
        // Switched to non-map pane - collapse panel to BOTTOM position
        this.$nextTick(() => {
          this.stepIndexLocal = 1; // BOTTOM
        });
      }
    },

    /**
     * Watch isVisible prop to handle keyboard open/close
     */
    isVisible(newValue, oldValue) {
      if (!newValue && oldValue) {
        // Keyboard opened - hide panel
        this.$nextTick(() => {
          this.stepIndexLocal = 0; // HIDDEN
        });
      } else if (newValue && !oldValue) {
        // Keyboard closed - restore panel to previous position
        if (this.lastStepIndex > 0) {
          this.$nextTick(() => {
            this.stepIndexLocal = this.lastStepIndex;
          });
        }
      }
    },

    /**
     * Watch stepIndexLocal changes and sync to store
     */
    stepIndexLocal(newIndex) {
      // Validate index
      if (newIndex === undefined || newIndex === null) return;

      // Steps: [HIDDEN, BOTTOM, MIDDLE, TOP]
      const positions = ['HIDDEN', 'BOTTOM', 'MIDDLE', 'TOP'];

      // Save position if not HIDDEN
      if (newIndex > 0) {
        this.lastStepIndex = newIndex;
      }

      const position = positions[newIndex] || positions[0];
      const stepValue = this.steps && this.steps[newIndex] !== undefined ? this.steps[newIndex] : 0;

      this.setPanelPosition({
        position: position,
        value: stepValue,
      });

      // Panel is open if MIDDLE or TOP
      this.setPanelOpenState(newIndex > 1);
    },

    /**
     * Watch for panel commands from store
     */
    panelCommand: {
      handler(command) {
        if (!command || !command.action) return;

        switch (command.action) {
          case 'open':
            this.handleOpenCommand();
            break;
          case 'close':
            this.handleCloseCommand();
            break;
        }
      },
      deep: true,
    },
  },

  methods: {
    ...mapActions({
      setActivePanel: 'ui/setActivePanel',
      switchPanel: 'ui/switchPanel',
      setPanelPosition: 'ui/setPanelPosition',
      setPanelOpenState: 'ui/setPanelOpenState',
    }),

    /**
     * Get screen height from layout service
     */
    _getScreenHeight() {
      if (layoutService.isInitialized) {
        return layoutService.dimensions.availableHeight;
      }
      return this.$store.state.ui.screenHeight;
    },

    /**
     * Set active button and update panel state
     */
    setActiveButton(button) {
      // If panel is closed, open with the selected button
      if (!this.isPanelOpen) {
        this.switchPanel(button);
        this.$nextTick(() => {
          this.stepIndexLocal = 2; // MIDDLE
        });
        return;
      }

      // If clicking the same button again, close panel to BOTTOM
      if (button === this.activeButton) {
        this.setActivePanel(null);
        this.$nextTick(() => {
          this.stepIndexLocal = 1; // BOTTOM
        });
        return;
      }

      // Switch to different panel
      this.switchPanel(button);
    },

    /**
     * Handle back button to return to map pane
     */
    handleBackToMap() {
      this.$store.dispatch('navigation/setCurrentPane', 'map');
    },

    /**
     * Handle control button tap
     */
    handleControlButtonTap(buttonName) {
      const isActive =
        this.isPanelOpen &&
        (buttonName === 'quick'
          ? this.activeButton === 'quick' || this.activeButton === null
          : this.activeButton === buttonName);

      const action = isActive ? null : buttonName;
      this.setActiveButton(action);
    },

    /**
     * Handle location button tap
     */
    async onLocate() {
      await this.$store.dispatch('map/triggerUserLocate');
    },

    /**
     * Handle open panel command
     */
    handleOpenCommand() {
      if (this.stepIndexLocal >= 2) return; // Already open (MIDDLE or TOP)

      this.$nextTick(() => {
        this.stepIndexLocal = 2; // MIDDLE
      });

      // Set default panel if none is active
      if (this.activeButton === null) {
        this.setActivePanel('quick');
      }
    },

    /**
     * Handle close panel command
     */
    handleCloseCommand() {
      if (this.stepIndexLocal === 1) return; // Already at BOTTOM

      this.$nextTick(() => {
        this.stepIndexLocal = 1; // BOTTOM
      });
    },

    /**
     * Handle layout changes from layout service
     */
    handleLayoutChange(event) {
      const { dimensions } = event;
      this.screenHeight = dimensions.availableHeight;
    },

    /**
     * Detect whether the clipboard currently contains a URL
     */
    async refreshClipboardLinkState() {
      try {
        const result = await hasClipboardUrl();
        this.hasClipboardLink = result;
      } catch (error) {
        console.error('[BottomSheetPanel] Error checking clipboard:', error);
        this.hasClipboardLink = false;
      }
    },

    /**
     * Handle paste button tap - read clipboard and, if it holds a supported
     * deep link, process it (navigate to intel URL or install plugin).
     */
    async onPasteClipboard() {
      try {
        const url = readClipboardText();
        if (isSupportedDeepLinkUrl(url)) {
          processDeepLink(url);
        } else {
          new Toasty({ text: 'Unsupported or invalid URL in clipboard' }).show();
        }
      } catch (error) {
        console.error('[BottomSheetPanel] Error pasting clipboard URL:', error);
      } finally {
        this.hasClipboardLink = false;
      }
    },

    /**
     * App resume handler.
     * iOS: refresh directly. Android: handled by the activityResumed hook
     * that schedules a Runnable on the UI thread to wait for window focus.
     */
    _onAppResume() {
      if (!isAndroid) {
        this.refreshClipboardLinkState();
      }
    },

    /**
     * Clipboard read requires window focus (Android 12+). decorView.post() queues
     * the callback after onWindowFocusChanged(true), but clipboard access is granted
     * slightly later - setTimeout(150ms) bridges that gap.
     */
    _onAndroidActivityResumed(args) {
      const activity = args?.activity || Application.android.foregroundActivity;
      const decorView = activity?.getWindow()?.getDecorView();
      if (!decorView) return;

      decorView.post(
        new java.lang.Runnable({
          run: () => setTimeout(() => this.refreshClipboardLinkState(), 150),
        })
      );
    },

    _setButtonVisible(refName, visible, animated) {
      const component = this.$refs[refName];
      if (!component) return;
      const view = component.nativeView || component.$el?.nativeView || component;
      if (!view) return;

      const opacity = visible ? 1 : 0.2;
      const scale = visible ? 1 : 0.8;

      if (!animated) {
        view.opacity = opacity;
        view.scaleX = scale;
        view.scaleY = scale;
        return;
      }

      view.animate({
        opacity,
        scale: { x: scale, y: scale },
        duration: 200,
        curve: CoreTypes.AnimationCurve.easeOut,
      });
    },
  },

  created() {
    // Initialize active button from store
    this._activeButton = this.storedActivePanel || 'quick';

    // Initialize panel in BOTTOM position (visible but closed)
    this.stepIndexLocal = 1; // BOTTOM

    // Listen for layout changes
    this.removeLayoutListener = layoutService.addLayoutChangeListener(this.handleLayoutChange);

    // Clipboard check lifecycle:
    // Android: wait for activityResumed -> window focus
    // iOS: check directly
    if (isAndroid && Application.android) {
      this._boundAndroidActivityResumedHandler = this._onAndroidActivityResumed.bind(this);
      Application.android.on('activityResumed', this._boundAndroidActivityResumedHandler);
    } else {
      this.refreshClipboardLinkState();
    }

    Application.on(Application.resumeEvent, this._onAppResume);
  },

  beforeUnmount() {
    if (this.removeLayoutListener) {
      this.removeLayoutListener();
    }

    if (isAndroid && Application.android && this._boundAndroidActivityResumedHandler) {
      Application.android.off('activityResumed', this._boundAndroidActivityResumedHandler);
      this._boundAndroidActivityResumedHandler = null;
    }

    Application.off(Application.resumeEvent, this._onAppResume);
  },
};
</script>

<style scoped lang="scss">
@import '@/app';

.panel-container {
  background-color: $surface;
  color: $text;
  border-radius: $radius-medium $radius-medium 0 0;
  border-color: $primary;
  border-top-width: 1;
}

.panel-header {
  height: 14;
  min-height: 14;
}

.panel-header-line {
  background-color: $primary;
  width: $spacing-xl;
  height: $spacing-xs;
  margin: 5 0;
  border-radius: $radius-small;
  horizontal-alignment: center;
}

.panel-buttons {
  height: 42;
  min-height: 42;
  margin: $spacing-panel;
  margin-top: 0;
  margin-bottom: 8;
  background-color: $surface;
}

.panel-title-label {
  font-size: $font-size;
  color: $on-surface;
  margin-left: $spacing-s;
  font-weight: bold;
}

.app-control-button {
  width: 42;
  min-width: 42;
  max-width: 42;
  height: 42;
  margin: 0 5;
  padding: 0;
  font-size: 18;
  border-radius: 10;
  color: rgba(255, 255, 255, 0.7);
  background-color: transparent;
  ripple-color: $ripple;
  horizontal-alignment: center;
  vertical-alignment: center;

  &--active {
    background-color: $surface-bright;
  }
}
</style>

