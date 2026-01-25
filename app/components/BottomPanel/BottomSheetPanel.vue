// Copyright (C) 2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <BottomSheet
    @loaded="onBottomSheetLoaded"
    v-model="stepIndexLocal"
    :steps="steps"
    scrollViewId="panelScrollView"
    :gestureEnabled="gestureEnabled"
    backdropColor="rgba(0, 0, 0, 0.3)"
  >
    <!-- Main content area (slot for WebView from parent) -->
    <GridLayout width="100%" height="100%">
      <slot />
    </GridLayout>

    <!-- Bottom Sheet Content -->
    <GridLayout
      ~bottomSheet
      class="panel-container"
      rows="auto, auto, *"
      :width="panelWidth || '100%'"
      height="100%"
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

      <!-- Content area with ListView (as in demo) -->
      <AppControlListView row="2" id="panelScrollView" :listItems="currentListItems" />
    </GridLayout>
  </BottomSheet>
</template>

<script>
import { mapState, mapActions, mapGetters } from 'vuex';
import AppControlListView from '@/components/BottomPanel/ControlPanel/ControlListView.vue';
import { ControlPanelDataService } from '@/components/BottomPanel/ControlPanel/services/controlPanelDataService.js';
import { layoutService } from '~/utils/layout-service';
import { getAppName } from '~/utils/platform';

export default {
  name: 'BottomSheetPanel',

  components: {
    AppControlListView,
  },

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
     * Steps for bottom sheet positions
     * When keyboard is closed: [BOTTOM, MIDDLE, TOP]
     * When keyboard is open: [HIDDEN, BOTTOM, MIDDLE, TOP]
     */
    steps() {
      const height = this.screenHeight || 800;
      const middlePosition = height / 2;
      const topPosition = height - 50;

      // Include HIDDEN position (0) only when keyboard is open
      if (!this.isVisible) {
        return [0, this.PANEL_CLOSED_HEIGHT, middlePosition, topPosition];
      }

      return [this.PANEL_CLOSED_HEIGHT, middlePosition, topPosition];
    },

    /**
     * Check if panel is positioned on the side (landscape tablet mode)
     */
    isPanelOnSide() {
      const dimensions = layoutService.dimensions;
      return this.panelWidth < dimensions.availableWidth;
    },

    /**
     * Calculate safe area inset for WebView bottom
     */
    safeAreaBottomInset() {
      // Panel full width (portrait OR landscape on phone):
      //   - WebView is clipped at bottom
      //   - Safe area = 10px
      //
      // Panel on side (landscape on tablet):
      //   - WebView extends to bottom of screen, panel overlaps from side
      //   - Safe area = panel height (110px)
      return this.isPanelOnSide ? this.PANEL_CLOSED_HEIGHT : 10;
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
          // BOTTOM position index depends on whether keyboard is open
          this.stepIndexLocal = this.isVisible ? 0 : 1;
        });
      }
    },

    /**
     * Watch isVisible prop to handle keyboard open/close
     */
    isVisible(newValue, oldValue) {
      if (!newValue && oldValue) {
        // Keyboard opened - steps array now includes HIDDEN at index 0
        // Current panel position shifts +1 in the array
        // Hide panel to HIDDEN position (index 0)
        this.$nextTick(() => {
          this.stepIndexLocal = 0; // HIDDEN
        });
      } else if (newValue && !oldValue) {
        // Keyboard closed - steps array no longer includes HIDDEN
        // Restore panel to previous position, adjusting index -1
        if (this.lastStepIndex > 0) {
          this.$nextTick(() => {
            this.stepIndexLocal = this.lastStepIndex - 1;
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

      // Determine position names based on whether HIDDEN is included
      let positions, isOpen;

      if (!this.isVisible) {
        // Keyboard open: [HIDDEN, BOTTOM, MIDDLE, TOP]
        positions = ['HIDDEN', 'BOTTOM', 'MIDDLE', 'TOP'];
        // Save position if not HIDDEN
        if (newIndex > 0) {
          this.lastStepIndex = newIndex;
        }
        // Panel is open if index > 1 (MIDDLE or TOP)
        isOpen = newIndex > 1;
      } else {
        // Keyboard closed: [BOTTOM, MIDDLE, TOP]
        positions = ['BOTTOM', 'MIDDLE', 'TOP'];
        // Always save position
        this.lastStepIndex = newIndex;
        // Panel is open if index > 0 (MIDDLE or TOP)
        isOpen = newIndex > 0;
      }

      const position = positions[newIndex] || positions[0];

      // Get step value
      const stepValue = this.steps && this.steps[newIndex] !== undefined ? this.steps[newIndex] : 0;

      // Update store
      this.setPanelPosition({
        position: position,
        value: stepValue,
      });

      // Update open state
      this.setPanelOpenState(isOpen);
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

    /**
     * Watch safe area inset changes and update store
     */
    safeAreaBottomInset(newValue) {
      this.$store.dispatch('ui/setSafeAreaInsets', newValue);
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
     * Fix for NativeScript Vue 3 compatibility
     * The ~bottomSheet directive syntax doesn't work in Vue 3
     * We need to manually set the bottomSheet property
     */
    onBottomSheetLoaded(args) {
      const bottomSheet = args.object;

      // The bottom sheet panel is the last child
      // Plugin may add backdrop before it, so structure can be:
      // - On first load: [main content, bottomSheet panel]
      // - After resume: [main content, backdrop, bottomSheet panel]
      const childCount = bottomSheet.getChildrenCount();

      if (childCount >= 2) {
        // Always take the last child - that's our panel
        const bottomSheetPanel = bottomSheet.getChildAt(childCount - 1);

        // Set bottomSheet property
        bottomSheet.bottomSheet = bottomSheetPanel;

        // Fix panel visibility after resume - force reapply translation and opacity
        this.$nextTick(() => {
          const trData = bottomSheet.computeTranslationData();
          bottomSheet.applyTrData(trData);

          // Fix: bottomSheetPanel should always be fully opaque (opacity: 1)
          // The backdrop opacity is being incorrectly applied to the panel by applyTrData
          if (bottomSheetPanel.opacity !== 1) {
            bottomSheetPanel.opacity = 1;
          }
        });
      }

      // Emit bottomSheet instance to parent for MapStateBar
      this.$emit('bottomSheetReady', bottomSheet);
    },

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
        // Trigger panel to open by updating stepIndexLocal to MIDDLE
        // The BottomSheet component will detect the change and emit stepIndexChange event
        this.$nextTick(() => {
          // MIDDLE position index depends on whether keyboard is open
          this.stepIndexLocal = this.isVisible ? 1 : 2;
        });
        return;
      }

      // If clicking the same button again, close panel to BOTTOM
      if (button === this.activeButton) {
        this.setActivePanel(null);
        // Close panel to BOTTOM position
        this.$nextTick(() => {
          // BOTTOM position index depends on whether keyboard is open
          this.stepIndexLocal = this.isVisible ? 0 : 1;
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
      const middleIndex = this.isVisible ? 1 : 2;
      if (this.stepIndexLocal >= middleIndex) return; // Already open

      // Open to middle position
      this.$nextTick(() => {
        this.stepIndexLocal = middleIndex; // MIDDLE
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
      const bottomIndex = this.isVisible ? 0 : 1;
      if (this.stepIndexLocal === bottomIndex) return; // Already at BOTTOM

      // Close panel to BOTTOM position
      this.$nextTick(() => {
        this.stepIndexLocal = bottomIndex; // BOTTOM
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
    // Index 0 when keyboard closed (no HIDDEN), index 1 when keyboard open (with HIDDEN)
    this.stepIndexLocal = this.isVisible ? 0 : 1;

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
