// Copyright (C) 2024-2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <MDRipple
    class="map-state-bar"
    orientation="horizontal"
    rippleColor="#ffffff"
    @tap="handleTap"
    @pan="handlePan"
  >
    <!-- Portal status component - left side -->
    <PortalStatusView
      class="portalStatusView"
      :width="isIitcLoaded ? '68%' : '100%'"
      :portalStatus="portalStatus"
    />

    <!-- Map status component - right side -->
    <MapStatusView v-if="isIitcLoaded" class="mapStatusView" width="32%" :mapStatus="mapStatus" />
  </MDRipple>
</template>

<script>
import { mapState, mapActions } from 'vuex';
import PortalStatusView from './components/MapStateBar/PortalStatusView';
import MapStatusView from './components/MapStateBar/MapStatusView';

const SWIPE_DISTANCE_MINIMUM = 10;

export default {
  name: 'MapStateBar',

  components: {
    PortalStatusView,
    MapStatusView,
  },

  props: {
    /**
     * Reference to BottomSheet native instance
     */
    bottomSheetRef: {
      type: Object,
      default: null,
    },
  },

  data() {
    return {
      isPanning: false,
      isDragging: false,
      lastDeltaY: 0,
      initialTranslationY: 0,
    };
  },

  computed: {
    ...mapState({
      mapStatus: state => state.map.mapStatus,
      portalStatus: state => state.map.portalStatus,
      isIitcLoaded: state => state.ui.isIitcLoaded,
    }),
  },

  methods: {
    ...mapActions({
      setCurrentPane: 'navigation/setCurrentPane',
    }),

    /**
     * Handle pan gesture on MapStateBar
     * Directly manipulates BottomSheet translationY
     */
    handlePan(event) {
      if (!this.bottomSheetRef) {
        console.warn('[MapStateBar] bottomSheetRef not available');
        return;
      }

      // Ensure required methods exist
      if (
        typeof this.bottomSheetRef.constrainY !== 'function' ||
        typeof this.bottomSheetRef.computeTranslationData !== 'function' ||
        typeof this.bottomSheetRef.applyTrData !== 'function'
      ) {
        console.error('[MapStateBar] BottomSheet API methods not available');
        return;
      }

      const deltaY = event.deltaY || 0;
      const absDeltaY = Math.abs(deltaY);

      switch (event.state) {
        case 1: // Pan start
          this.lastDeltaY = 0;
          this.isDragging = false;
          this.isPanning = false;

          // Save initial translation
          this.initialTranslationY = this.bottomSheetRef.translationY || 0;
          break;

        case 2: // Pan moving
          // Check if movement exceeds threshold
          if (absDeltaY > SWIPE_DISTANCE_MINIMUM && !this.isDragging) {
            this.isDragging = true;
            this.isPanning = true;
          }

          if (this.isDragging) {
            // Calculate incremental movement (same as onTouch in plugin)
            const y = deltaY - this.lastDeltaY;

            // Get current position and apply delta
            const currentTranslation = this.bottomSheetRef.translationY || 0;
            const newTranslationY = this.bottomSheetRef.constrainY(currentTranslation + y);

            // Update position
            this.bottomSheetRef.translationY = newTranslationY;

            // Compute and apply transformation
            const trData = this.bottomSheetRef.computeTranslationData();
            this.bottomSheetRef.applyTrData(trData);

            this.lastDeltaY = deltaY;
          }
          break;

        case 3: // Pan end
          if (this.isDragging) {
            // Calculate final position with remaining delta
            const y = deltaY - this.lastDeltaY;
            const totalDelta = (this.bottomSheetRef.translationY || 0) + y;

            // Animate to nearest step
            if (typeof this.bottomSheetRef.computeAndAnimateEndGestureAnimation === 'function') {
              this.bottomSheetRef.computeAndAnimateEndGestureAnimation(-totalDelta);
            }
          }

          // Reset state with delay to prevent tap
          setTimeout(() => {
            this.isDragging = false;
            this.isPanning = false;
            this.lastDeltaY = 0;
          }, 100);
          break;

        case 4: // Pan cancelled
          this.isDragging = false;
          this.isPanning = false;
          this.lastDeltaY = 0;
          break;
      }
    },

    /**
     * Handle tap gesture
     */
    handleTap() {
      if (this.isPanning) {
        return;
      }

      this.setCurrentPane('info');
    },
  },
};
</script>

<style scoped lang="scss">
@import '@/app';

.map-state-bar {
  width: 100%;
  height: 100%;
  background-color: $surface;
  padding: 0 10 8;

  .portalStatusView,
  .mapStatusView {
    vertical-align: center;
  }
}
</style>
