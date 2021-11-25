//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

<template>
  <progress
    ref="progress"
    :class="{ progress: true, opacity: progress >= 100 }"
    :value="progress"
    maxValue="100"
  ></progress>
</template>

<script>
  export default {
    data() {
      return {
        progress: this.$store.state.progress,
      }
    },
    async created() {
      this.store_unsubscribe = this.$store.subscribeAction({
        after: async (action, state) => {
          switch (action.type) {
            case "setProgress":
              this.progress = action.payload;
              break;
          }
        }
      })
    },
    onDestroy() {
      this.store_unsubscribe();
    }
  };
</script>

<style scoped lang="scss">
  @import '../app';

  @keyframes progress-animation {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }

  .opacity {
    animation-name: progress-animation;
    animation-duration: 2s;
    animation-fill-mode: forwards;
  }

  .progress {
    color: $base;
    height: 4;
  }
</style>
