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
      width="100%"
      height="100%"
    >
      <!-- Header with drag indicator -->
      <StackLayout row="0" class="panel-header">
        <Label class="panel-header-line" />
      </StackLayout>

      <!-- Control buttons -->
      <GridLayout row="1" class="panel-buttons" columns="auto, *, auto, auto">
        <!-- Quick Access Button -->
        <MDButton
          col="0"
          variant="flat"
          class="fa app-control-button"
          :class="{
            'app-control-button--active':
              isPanelOpen && (activeButton === 'quick' || activeButton === null),
          }"
          :text="$filters.fonticon('fa-bars')"
          @tap="handleControlButtonTap('quick')"
        />

        <!-- Location Button -->
        <MDButton
          v-show="isIitcLoaded"
          col="2"
          variant="flat"
          class="fa app-control-button"
          :text="$filters.fonticon(locationButtonIcon)"
          @tap="onLocate"
        />

        <!-- Layers Button -->
        <MDButton
          v-show="isIitcLoaded"
          col="3"
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
import AppControlListView from '@/components/AppControlPanel/AppControlListView.vue';
import { ControlPanelDataService } from '@/components/AppControlPanel/services/controlPanelDataService.js';
import { layoutService } from '~/utils/layout-service';

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
  },

  data() {
    return {
      screenHeight: this._getScreenHeight(),
      stepIndexLocal: 0,
      _activeButton: null,
      removeLayoutListener: null,
    };
  },

  computed: {
    ...mapState({
      storedActivePanel: state => state.ui.activePanel,
      isPanelOpen: state => state.ui.panelState.isOpen,
      isIitcLoaded: state => state.ui.isIitcLoaded,
      panelCommand: state => state.ui.panelCommand,
    }),

    ...mapGetters('map', ['isFollowingUser']),

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
      return this.isFollowingUser ? 'fa-crosshairs' : 'fa-location-arrow';
    },

    /**
     * Generate list items for current active button
     */
    currentListItems() {
      return ControlPanelDataService.generateListData(this.activeButton, this.$store);
    },

    /**
     * Steps for bottom sheet positions
     * [BOTTOM, MIDDLE, TOP]
     */
    steps() {
      const bottomPadding = 110; // Visible height when closed
      const height = this.screenHeight || 800;
      const middlePosition = height / 2;
      const topPosition = height - 50;

      return [bottomPadding, middlePosition, topPosition];
    },
  },

  watch: {
    storedActivePanel(newValue) {
      this._activeButton = newValue;
    },

    /**
     * Watch stepIndexLocal changes and sync to store
     */
    stepIndexLocal(newIndex) {
      // Validate index
      if (newIndex === undefined || newIndex === null) return;

      // Convert step index to position name
      const positions = ['BOTTOM', 'MIDDLE', 'TOP'];
      const position = positions[newIndex] || 'BOTTOM';

      // Get step value
      const stepValue = this.steps && this.steps[newIndex] ? this.steps[newIndex] : 110;

      // Update store
      this.setPanelPosition({
        position: position,
        value: stepValue,
      });

      // Update open state
      this.setPanelOpenState(newIndex !== 0);
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
        // Trigger panel to open by updating stepIndexLocal
        // The BottomSheet component will detect the change and emit stepIndexChange event
        this.$nextTick(() => {
          this.stepIndexLocal = 1;
        });
        return;
      }

      // If clicking the same button again, close panel
      if (button === this.activeButton) {
        this.setActivePanel(null);
        // Close panel
        this.$nextTick(() => {
          this.stepIndexLocal = 0;
        });
        return;
      }

      // Switch to different panel
      this.switchPanel(button);
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
      if (this.stepIndexLocal !== 0) return; // Already open

      // Open to middle position
      this.$nextTick(() => {
        this.stepIndexLocal = 1;
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
      if (this.stepIndexLocal === 0) return; // Already closed

      // Close panel
      this.$nextTick(() => {
        this.stepIndexLocal = 0;
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

    // Initialize panel in closed position (bottom)
    this.stepIndexLocal = 0;

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

.app-control-button {
  width: 42;
  min-width: 42;
  max-width: 42;
  height: 42;
  margin: 0 5;
  padding-top: 11;
  font-size: 18;
  border-radius: 10;
  color: rgba(255, 255, 255, 0.7);
  background-color: transparent;
  text-align: center;
  ripple-color: $ripple;

  &--active {
    background-color: $surface-bright;
  }
}
</style>
