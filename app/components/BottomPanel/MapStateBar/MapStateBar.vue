// Copyright (C) 2024-2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <GridLayout
    :marginLeft="effectiveLeftInset"
    :width="panelWidth ? panelWidth - effectiveLeftInset : '100%'"
  >
    <!-- Catches the touches the disabled bar lets through to the panel. A sibling, not the
         parent: on iOS the parent's pan would run along with the bar's -->
    <ContentView @pan="handlePan" />

    <StackLayout
      class="map-state-bar"
      orientation="horizontal"
      :style="{ paddingBottom: navBarHeight + 8 }"
      :isUserInteractionEnabled="isIitcLoaded"
      v-on="pressFeedback"
      @loaded="drawOverPadding"
      @tap="handleTap"
      @pan="handlePan"
    >
      <!-- Portal status component - left side -->
      <PortalStatusView
        ref="portalStatusView"
        class="portalStatusView"
        :width="isIitcLoaded ? '68%' : '100%'"
        :portalStatus="portalStatus"
      />

      <!-- Map status component - right side -->
      <MapStatusView
        ref="mapStatusView"
        v-show="isIitcLoaded"
        class="mapStatusView"
        width="32%"
        :mapStatus="mapStatus"
      />
    </StackLayout>

    <ContentView ref="divider" class="divider" isUserInteractionEnabled="false" />
  </GridLayout>
</template>

<script>
import { mapState, mapActions } from 'vuex';
import PortalStatusView from './PortalStatusView';
import MapStatusView from './MapStatusView';
import { drawOverPadding, pressFeedback } from '@/utils/platform/ui';

const SWIPE_DISTANCE_MINIMUM = 10;
// Content shift under the divider once the panel is open. Halved without a bottom inset
// (three-button navigation in landscape, home-button iPhones): only the bar's padding is below
const OPEN_CONTENT_OFFSET = 6;

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
    /**
     * Navigation bar height in DIPs — used to extend background behind the transparent nav bar
     */
    navBarHeight: {
      type: Number,
      default: 0,
    },
    panelWidth: {
      type: Number,
      default: 0,
    },
    safeAreaLeftInset: {
      type: Number,
      default: 0,
    },
  },

  data() {
    return {
      pressFeedback,
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
      hasBottomInset: state => state.ui.screenSafeArea.bottom > 0,
    }),

    /**
     * On iOS, RootLayout overlays receive safe area as internal padding.
     * A 1dp margin prevents iOS from extending the background past the safe area edge.
     */
    effectiveLeftInset() {
      if (__IOS__) {
        return this.safeAreaLeftInset > 0 ? 1 : 0;
      }
      return this.safeAreaLeftInset;
    },
  },

  methods: {
    ...mapActions({
      setCurrentPane: 'navigation/setCurrentPane',
    }),

    drawOverPadding,

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
     * Panel translation data for the views that follow its opening (0 at BOTTOM, 1 at MIDDLE).
     * Transforms only: a padding change would relayout the screen on every frame of the drag.
     */
    openingTrData(progress) {
      const divider = this.$refs.divider?.nativeView;
      if (!divider) return null;
      const offset = this.hasBottomInset ? OPEN_CONTENT_OFFSET : OPEN_CONTENT_OFFSET / 2;
      const translateY = offset * progress;
      return {
        mapStateDivider: { target: divider, opacity: progress },
        mapStatePortal: { target: this.$refs.portalStatusView.$el.nativeView, translateY },
        mapStateMap: { target: this.$refs.mapStatusView.$el.nativeView, translateY },
      };
    },

    /**
     * Handle tap gesture
     */
    handleTap() {
      if (this.isPanning) {
        return;
      }

      if (this.$store.getters['settings/isDesktopMode']) {
        this.$store.dispatch(
          'map/executeJavaScript',
          "document.getElementById('sidebartoggle').click(); true"
        );
      } else {
        this.setCurrentPane('info');
      }
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
  padding: 0 10;

  .portalStatusView,
  .mapStatusView {
    vertical-align: center;
  }

  &:highlighted {
    background-color: $surface-container;
  }
}

.divider {
  height: 1;
  vertical-align: top;
  background-color: $accent-border;
  opacity: 0;
}
</style>
