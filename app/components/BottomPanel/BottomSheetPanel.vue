// Copyright (C) 2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <BottomSheet
    v-model="stepIndexLocal"
    :steps="steps"
    scrollViewId="panelScrollView"
    :gestureEnabled="gestureEnabled"
    backdropColor="rgba(0, 0, 0, 0.3)"
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
      <GridLayout row="1" class="panel-buttons" columns="auto, auto, *, auto, auto">
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

        <!-- Location Button -->
        <MDButton
          v-show="isIitcLoaded"
          col="3"
          variant="flat"
          class="fa app-control-button"
          :text="$filters.fonticon(locationButtonIcon)"
          @tap="onLocate"
        />

        <!-- Layers Button -->
        <MDButton
          v-show="isIitcLoaded"
          col="4"
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
import { isIOS } from '@nativescript/core';
import { layoutService } from '~/utils/layout-service';
import { getAppName } from '~/utils/platform';

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
  },

  created() {
    // Initialize active button from store
    this._activeButton = this.storedActivePanel || 'quick';

    // Initialize panel in BOTTOM position (visible but closed)
    this.stepIndexLocal = 1; // BOTTOM

    // Listen for layout changes
    this.removeLayoutListener = layoutService.addLayoutChangeListener(this.handleLayoutChange);
  },

  beforeUnmount() {
    if (this.removeLayoutListener) {
      this.removeLayoutListener();
    }
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
