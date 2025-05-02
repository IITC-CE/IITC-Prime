//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

<template>
  <MDRipple
    class="map-state-bar"
    orientation="horizontal"
    rippleColor="#ffffff"
    @tap="handleTap"
    @pan="handlePan"
    passthrough-events="true"
  >

    <!-- Portal status component - left side -->
    <PortalStatusView
      class="portalStatusView"
      width="68%"
      :portalStatus="portalStatus" />

    <!-- Map status component - right side -->
    <MapStatusView
      class="mapStatusView"
      width="32%"
      :mapStatus="mapStatus" />
  </MDRipple>
</template>

<script>
import { mapState, mapActions } from 'vuex';
import PortalStatusView from './components/MapStateBar/PortalStatusView';
import MapStatusView from './components/MapStateBar/MapStatusView';

export default {
  name: 'MapStateBar',
  components: {
    PortalStatusView,
    MapStatusView
  },
  props: {
    /**
     * Reference to the parent sliding panel component
     */
    panelRef: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      // Flag to track if we're panning
      isPanning: false,
      // Threshold to differentiate between tap and pan
      panThreshold: 10
    }
  },
  computed: {
    ...mapState({
      mapStatus: state => state.map.mapStatus,
      portalStatus: state => state.map.portalStatus
    })
  },
  methods: {
    ...mapActions({
      setCurrentPane: 'navigation/setCurrentPane'
    }),

    /**
     * Handle pan gesture on MapStateBar
     * Uses the external pan handler from parent panel
     */
    handlePan(event) {
      // Calculate total movement distance
      const distance = Math.abs(event.deltaX) + Math.abs(event.deltaY);

      // If movement exceeds threshold, consider it a pan gesture
      if (distance > this.panThreshold) {
        this.isPanning = true;

        // Call the external pan handler method from mixins
        if (this.panelRef && this.panelRef.handleExternalPanGesture) {
          this.panelRef.handleExternalPanGesture(event);
        }

        // Reset panning flag when gesture ends
        if (event.state === 3) { // Pan end state
          this.isPanning = false;
        }
      }
    },

    /**
     * Handle tap gesture to navigate to portal info
     */
    handleTap(event) {
      // If we're currently panning, ignore tap
      if (this.isPanning) {
        this.isPanning = false;
        return;
      }

      // Switch to info panel when tapped
      this.setCurrentPane('info');
    }
  }
}
</script>

<style scoped lang="scss">
@import '@/app';

.map-state-bar {
  width: 100%;
  height: 100%;
  background-color: $base;
  padding: 0 10 8;

  .portalStatusView,
  .mapStatusView {
    vertical-align: center;
  }
}
</style>
