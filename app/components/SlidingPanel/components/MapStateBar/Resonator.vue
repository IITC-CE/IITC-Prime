//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

<template>
  <StackLayout class="resonator-container">
    <GridLayout class="resonator" :class="{ empty: isEmpty }">
      <StackLayout
        v-if="!isEmpty"
        class="resonator-fill"
        horizontalAlignment="left"
        :style="{ backgroundColor: color, width: healthPct + '%' }" />
    </GridLayout>
  </StackLayout>
</template>

<script>
export default {
  name: 'Resonator',
  props: {
    level: {
      type: Number,
      default: 0
    },
    healthPct: {
      type: Number,
      default: 0
    },
    color: {
      type: String,
      default: '#808080'
    },
    isEmpty: {
      type: Boolean,
      default: false
    }
  }
}
</script>

<style scoped lang="scss">
@import '@/app';

.resonator-container {
  width: 100%;
  padding: 0 1;
}

.resonator {
  height: 10;
  width: 100%;
  border-width: 1;
  border-color: $primary-dark;
  border-radius: 2;
  overflow: hidden;
}

.resonator.empty {
  background-color: rgba(128, 128, 128, 0.2);
}

.resonator-fill {
  height: 100%;
}
</style>
