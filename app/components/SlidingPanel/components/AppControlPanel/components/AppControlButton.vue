//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

<template>
  <MDButton
    variant="flat"
    rippleColor="#ffffff"
    class="fa app-control-button"
    :class="{ 'app-control-button--active': isActive }"
    :text="icon | fonticon"
    @tap="handleTap"
    @pan="handlePan"
  />
</template>

<script>
export default {
  props: {
    icon: {
      type: String,
      required: true
    },
    isActive: {
      type: Boolean,
      default: false
    },
    isToggleable: {
      type: Boolean,
      default: true
    },
  },

  data() {
    return {
      panThreshold: 15,
      isPanning: false,
      currentPanId: null
    }
  },

  methods: {
    /**
     * Handle pan gesture with improved detection
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
          setTimeout(() => {
            this.isPanning = false;
          }, 100);
          break;
      }

      // Emit pan event only if it's a real pan gesture
      if (this.isPanning && distance > this.panThreshold) {
        event.panId = this.currentPanId;
        this.$emit('pan', event);
      }
    },

    /**
     * Handle tap gesture with conflict prevention
     */
    handleTap(event) {
      // Ignore taps during pan gesture
      if (this.isPanning) {
        return;
      }

      // Emit tap event
      this.$emit('tap', event);

      // For toggleable buttons, emit appropriate event
      if (this.isToggleable) {
        const action = this.isActive ? 'deactivate' : 'activate';
        this.$emit(action);
      }
    }
  }
}
</script>

<style scoped lang="scss">
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
    text-align:center;

    &--active {
      background-color: rgba(255, 255, 255, 0.1);
    }
  }
</style>
