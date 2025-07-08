//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

<template>
  <GridLayout
    class="app-control-panel"
    width="100%"
    height="100%"
    rows="auto, auto, *"
    columns="*">

    <StackLayout class="panel-header" row="0" col="0" verticalAlignment="top">
      <Label
        class="panel-header-line"
      />
    </StackLayout>

    <!-- buttons -->
    <GridLayout class="panel-buttons" row="1" col="0" columns="auto, *, auto, auto, auto" verticalAlignment="top">
      <!-- Quick Access Button -->
      <MDButton
        col="0"
        variant="flat"
        rippleColor="#ffffff"
        class="fa app-control-button"
        :class="{ 'app-control-button--active': isPanelOpen && (activeButton === 'quick' || activeButton === null) }"
        :text="'fa-bars' | fonticon"
        @tap="handleControlButtonTap('quick', $event)"
        @pan="handleControlButtonPan('quick', $event)"
      />

      <!-- Search Button -->
      <MDButton
        col="2"
        variant="flat"
        rippleColor="#ffffff"
        class="fa app-control-button"
        :class="{ 'app-control-button--active': isPanelOpen && activeButton === 'search' }"
        :text="'fa-search' | fonticon"
        @tap="handleControlButtonTap('search', $event)"
        @pan="handleControlButtonPan('search', $event)"
      />

      <!-- Location Button -->
      <MDButton
        col="3"
        variant="flat"
        rippleColor="#ffffff"
        class="fa app-control-button"
        :text="locationButtonIcon | fonticon"
        @tap="onLocate"
      />

      <!-- Layers Button -->
      <MDButton
        col="4"
        variant="flat"
        rippleColor="#ffffff"
        class="fa app-control-button"
        :class="{ 'app-control-button--active': isPanelOpen && activeButton === 'layers' }"
        :text="'fa-layer-group' | fonticon"
        @tap="handleControlButtonTap('layers', $event)"
        @pan="handleControlButtonPan('layers', $event)"
      />

    </GridLayout>

    <!-- content -->
    <ScrollView row="2" col="0" :height="maxHeight - 64" verticalAlignment="top">
      <StackLayout class="panel-body">
        <QuickAccessView
          v-show="activeButton === 'quick' || activeButton === null"
        />

        <LayersView
          v-show="activeButton === 'layers'"
        />

        <SearchView
          v-show="activeButton === 'search'"
        />
      </StackLayout>
    </ScrollView>
  </GridLayout>
</template>

<script>
import QuickAccessView from "./components/QuickAccessView.vue";
import LayersView from "./components/LayersView.vue";
import SearchView from "./components/SearchView.vue";
import { mapState, mapActions, mapGetters } from 'vuex';
import { buttonGestureHandlerMixin } from './button-gesture-handler';

export default {
  name: 'AppControlPanel',

  mixins: [buttonGestureHandlerMixin],

  components: {
    QuickAccessView,
    LayersView,
    SearchView,
  },

  props: {
    maxHeight: {
      type: Number,
      required: true
    }
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
      }
    },

    /**
     * Determine location button icon based on follow mode
     */
    locationButtonIcon() {
      return this.isFollowingUser
        ? 'fa-crosshairs'        // Following mode icon
        : 'fa-location-arrow';   // Regular locate icon
    },

    ...mapState({
      storedActivePanel: state => state.ui.activePanel,
      isPanelOpen: state => state.ui.panelState.isOpen
    }),

    ...mapGetters('map', ['isFollowingUser'])
  },

  data() {
    return {
      _activeButton: null, // Internal storage for local changes
    }
  },

  watch: {
    storedActivePanel(newValue) {
      this._activeButton = newValue;
    }
  },

  methods: {
    ...mapActions({
      setActivePanel: 'ui/setActivePanel',
      switchPanel: 'ui/switchPanel'
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
      this.handleButtonTap(event);

      if (this.isCurrentlyPanning()) {
        return;
      }

      const isActive = this.isPanelOpen &&
        (buttonName === 'quick' ?
          (this.activeButton === 'quick' || this.activeButton === null) :
          this.activeButton === buttonName);

      const action = isActive ? null : buttonName;
      this.setActiveButton(action);
    },

    /**
     * Handle control button pan gesture
     */
    handleControlButtonPan(buttonName, event) {
      this.handleButtonPan(event);
    },

    /**
     * Handle location button tap
     */
    async onLocate() {
      await this.$store.dispatch('map/triggerUserLocate');
    }
  },

  created() {
    // Initialize active button from store
    this._activeButton = this.storedActivePanel || 'quick';
  },
}
</script>

<style scoped lang="scss">
@import '@/app';

.app-control-panel {
  background-color: $base;
  color: $text;
  border-radius: 10 10 0 0;
  border-color: $complementary;
  border-top-width: 1;
}

.panel-header {
  height: 14;
  min-height: 14;
}

.panel-header-line {
  background-color: $complementary;
  width: 32;
  height: 4;
  margin: 5 0;
  border-radius: 4;
  horizontal-alignment: center;
}

.panel-buttons {
  height: 42; // 110 - 46 - 14 - 8
  min-height: 42;
  margin: 0 10 8 10;
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
  background-color: rgba(255, 255, 255, 0);
  text-align: center;

  &--active {
    background-color: rgba(255, 255, 255, 0.1);
  }
}

.panel-body {
  margin: 10;
}

</style>
