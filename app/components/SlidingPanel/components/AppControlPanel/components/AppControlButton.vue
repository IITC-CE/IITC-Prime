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
    passthrough-events="true"
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
      isPanning: false,
      panThreshold: 10
    }
  },
  methods: {
    handlePan(event) {
      const distance = Math.abs(event.deltaX) + Math.abs(event.deltaY);

      if (distance > this.panThreshold) {
        this.isPanning = true;
        this.$emit('pan', event);
      }
    },

    handleTap(event) {
      if (this.isPanning) {
        this.isPanning = false;
        return;
      }

      this.$emit('tap', event);
      this.handleToggle();
    },

    handleToggle() {
      if (!this.isToggleable) return;

      const event = this.isActive ? 'deactivate' : 'activate';
      this.$emit(event);
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
