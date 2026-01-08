// Copyright (C) 2024-2025 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <GridLayout
    class="app-control-panel"
    width="100%"
    height="100%"
    :minHeight="screenHeight / 2"
    rows="auto, auto, *"
    columns="*"
  >
    <StackLayout class="panel-header" row="0" col="0" verticalAlignment="top">
      <Label class="panel-header-line" />
    </StackLayout>

    <!-- buttons -->
    <GridLayout
      class="panel-buttons"
      row="1"
      col="0"
      columns="auto, *, auto, auto, auto, auto"
      verticalAlignment="top"
    >
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
        @tap="handleControlButtonTap('quick', $event)"
      />

      <!-- Search Button -->
      <!--      <MDButton-->
      <!--        v-show="isIitcLoaded"-->
      <!--        col="2"-->
      <!--        variant="flat"-->
      <!--        class="fa app-control-button"-->
      <!--        :class="{ 'app-control-button&#45;&#45;active': isPanelOpen && activeButton === 'search' }"-->
      <!--        :text="$filters.fonticon('fa-search')"-->
      <!--        @tap="handleControlButtonTap('search', $event)"-->
      <!--        @pan="handleControlButtonPan('search', $event)"-->
      <!--      />-->

      <!-- Link Permission Button (Android only, when not default handler) -->
      <MDButton
        v-show="showLinkPermissionButton"
        col="3"
        variant="flat"
        class="fa app-control-button app-control-button--warning"
        :text="$filters.fonticon('fa-link')"
        @tap="onLinkPermission"
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
        @tap="handleControlButtonTap('layers', $event)"
      />
    </GridLayout>

    <!-- content -->
    <AppControlListView
      row="2"
      col="0"
      verticalAlignment="top"
      :height="maxHeight - 64"
      :listItems="currentListItems"
    />
  </GridLayout>
</template>

<script>
import AppControlListView from './AppControlListView.vue';
import { ControlPanelDataService } from './services/controlPanelDataService.js';
import { mapState, mapActions, mapGetters } from 'vuex';
import { isDefaultLinkHandler, openAppLinkSettings } from '@/utils/platform';
import { Application } from '@nativescript/core';
import { confirm } from '@nativescript-community/ui-material-dialogs';

export default {
  name: 'AppControlPanel',

  components: {
    AppControlListView,
  },

  props: {
    maxHeight: {
      type: Number,
      required: true,
    },
  },

  computed: {
    /**
     * Get activeButton from local state or Vuex
     */
    activeButton: {
      get() {
        return this.$data._activeButton || this.storedActivePanel;
      },
      set(value) {
        this.$data._activeButton = value;
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

    ...mapState({
      storedActivePanel: state => state.ui.activePanel,
      isPanelOpen: state => state.ui.panelState.isOpen,
      screenHeight: state => state.ui.screenHeight,
      isIitcLoaded: state => state.ui.isIitcLoaded,
    }),

    ...mapGetters('map', ['isFollowingUser']),

    /**
     * Generate list items for current active button
     */
    currentListItems() {
      return ControlPanelDataService.generateListData(this.activeButton, this.$store);
    },
  },

  data() {
    return {
      _activeButton: null, // Internal storage for local changes
      showLinkPermissionButton: false, // Show link permission button
      activityResumedHandler: null, // Store activity resumed handler
    };
  },

  watch: {
    storedActivePanel(newValue) {
      this._activeButton = newValue;
    },
  },

  methods: {
    ...mapActions({
      setActivePanel: 'ui/setActivePanel',
      switchPanel: 'ui/switchPanel',
    }),

    /**
     * Set active button and update panel state
     */
    setActiveButton(button) {
      // If panel is closed, always open with the selected button
      if (!this.isPanelOpen) {
        this.switchPanel(button);
        return;
      }

      // If clicking the same button again, deactivate it
      if (button === this.activeButton) {
        this.setActivePanel(null);
        return;
      }

      // Use switchPanel action to change active panel
      this.switchPanel(button);
    },

    /**
     * Handle control button tap with gesture handling
     */
    handleControlButtonTap(buttonName, event) {
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
     * Handle link permission button tap
     */
    async onLinkPermission() {
      try {
        const result = await confirm({
          title: 'Open links in IITC Prime?',
          message:
            'You can set IITC Prime to automatically open Intel Map links instead of using a browser',
          okButtonText: 'Enable',
          cancelButtonText: 'Skip',
        });

        if (result) {
          openAppLinkSettings();
        }
      } catch (error) {
        console.error('Error showing link permission dialog:', error);
        openAppLinkSettings();
      }
    },

    /**
     * Check and update link handler status
     */
    checkLinkHandlerStatus() {
      const linkHandlerStatus = isDefaultLinkHandler();
      this.showLinkPermissionButton = linkHandlerStatus === false;
    },

    /**
     * Setup activity event handlers for link permission checking
     */
    setupActivityHandlers() {
      if (!Application.android) return;

      // Check immediately if activity is already available
      if (Application.android.foregroundActivity) {
        this.checkLinkHandlerStatus();
      }

      // Setup handler for activity resumed events
      this.activityResumedHandler = () => {
        this.checkLinkHandlerStatus();
      };

      Application.android.on('activityResumed', this.activityResumedHandler);
    },
  },

  created() {
    // Initialize active button from store
    this._activeButton = this.storedActivePanel || 'quick';
  },

  mounted() {
    this.setupActivityHandlers();
  },

  beforeUnmount() {
    if (this.activityResumedHandler && Application.android) {
      Application.android.off('activityResumed', this.activityResumedHandler);
    }
  },
};
</script>

<style scoped lang="scss">
@import '@/app';

.app-control-panel {
  background-color: $base;
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
  height: 42; // 110 - 46 - 14 - 8
  min-height: 42;
  margin: $spacing-panel;
  margin-top: 0;
  margin-bottom: 8;
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

  &--warning {
    color: $state-warning;
    background-color: rgba(255, 152, 0, 0.1);
  }
}
</style>
