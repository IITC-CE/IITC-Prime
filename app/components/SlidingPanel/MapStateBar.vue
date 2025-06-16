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
      _weakPanelRef: null,
      _timers: new Set(),
      // Threshold to differentiate between tap and pan
      panThreshold: 15,
      // Track current pan gesture with unique ID
      currentPanId: null
    }
  },

  created() {
    this._weakPanelRef = new WeakRef(this.panelRef);
  },

  beforeDestroy() {
    this.cleanup();
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

      // Handle different pan gesture states
      switch (event.state) {
        // Pan start
        case 1:
          this.currentPanId = Date.now();
          this.isPanning = false;
          break;

        // Pan in progress
        case 2:
          // If distance exceeds threshold, consider it a pan gesture
          if (distance > this.panThreshold && !this.isPanning) {
            this.isPanning = true;
          }
          break;

        // Pan end
        case 3:
          // Delay to prevent tap triggering after pan
          const timerId = setTimeout(() => {
            if (this.isPanning !== undefined) {
              this.isPanning = false;
            }
          }, 100);
          if (this._timers) {
            this._timers.add(timerId);
          }
          break;
      }

      // Call the external pan handler method only if it's a real pan gesture
      if ((this.isPanning && distance > this.panThreshold) || event.state === 3) {
        const panelRef = this._weakPanelRef?.deref();
        if (panelRef && panelRef.handleExternalPanGesture) {
          event.panId = this.currentPanId;
          panelRef.handleExternalPanGesture(event);
        }
      }
    },

    /**
     * Cleanup function to prevent memory leaks
     */
    cleanup() {
      if (this._timers) {
        this._timers.forEach(timerId => {
          clearTimeout(timerId);
        });
        this._timers.clear();
      }

      this._weakPanelRef = null;
    },

    /**
     * Handle tap gesture to navigate to portal info
     */
    handleTap(event) {
      // If we're currently panning, ignore tap
      if (this.isPanning) {
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
