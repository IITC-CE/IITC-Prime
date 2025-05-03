//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

<template>
  <FlexboxLayout
    class="app-control-panel"
    width="100%"
    :height="maxHeight"
    flexDirection="column">

    <StackLayout class="panel-header">
      <Label
        class="panel-header-line"
      />
    </StackLayout>

    <!-- buttons -->
    <FlexboxLayout class="panel-buttons">
      <AppControlButton
        icon="fa-bars"
        :isActive="activeButton === 'quick'"
        @activate="setActiveButton('quick')"
        @deactivate="setActiveButton(null)" />
      />

      <FlexboxLayout class="expander" />

      <AppControlButton
        icon="fa-search"
        :isActive="activeButton === 'search'"
        @activate="setActiveButton('search')"
        @deactivate="setActiveButton(null)" />

      <AppControlButton
        icon="fa-location-arrow"
        :isToggleable="false"
        @tap="onLocate" />

      <AppControlButton
        icon="fa-layer-group"
        :isActive="activeButton === 'layers'"
        @activate="setActiveButton('layers')"
        @deactivate="setActiveButton(null)" />

    </FlexboxLayout>

    <!-- content -->
    <StackLayout class="panel-body" flexGrow="1">
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
  </FlexboxLayout>
</template>

<script>
import AppControlButton from "./components/AppControlButton.vue";
import QuickAccessView from "./components/QuickAccessView.vue";
import LayersView from "./components/LayersView.vue";
import SearchView from "./components/SearchView.vue";
import userLocation from "@/utils/user-location";
import { mapState, mapActions } from 'vuex';

export default {
  name: 'AppControlPanel',

  components: {
    AppControlButton,
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
    ...mapState({
      storedActivePanel: state => state.ui.activePanel
    })
  },

  data() {
    return {
      location: new userLocation(),
      activeButton: null,
    }
  },

  watch: {
    storedActivePanel(newValue) {
      this.activeButton = newValue;
    }
  },

  methods: {
    ...mapActions({
      setActivePanel: 'ui/setActivePanel',
      switchPanel: 'ui/switchPanel'
    }),

    setActiveButton(button) {
      // Deactivate when clicking the same button again
      if (button === this.activeButton) {
        this.setActivePanel(null);
        return;
      }

      // Use switchPanel action to change active panel and open if needed
      this.$store.dispatch('ui/switchPanel', button);
    },

    onLocate() {
      this.location.locate();
    }
  },

  created() {
    // Initialize active button from store
    this.activeButton = this.storedActivePanel || 'quick';
  }
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
  justify-content: space-around;
}

.panel-body {
  margin: 10;
}

.expander {
  width: 100%;
}
</style>
