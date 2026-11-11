// Copyright (C) 2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <MDButton
    v-if="isAndroid"
    :text="text"
    :variant="variant === 'plain' ? 'flat' : undefined"
    :class="androidClass"
  />
  <SystemButton v-else :text="text" :variant="variant" :destructive="destructive" :icon="icon" />
</template>

<script>
import { isAndroid } from '@nativescript/core';

/**
 * Material button on Android, system button on iOS.
 * Variants: filled (the main action), tinted, plain (no fill); `destructive` turns it red.
 */
export default {
  name: 'AppButton',

  props: {
    text: { type: String, default: '' },
    variant: { type: String, default: 'tinted' },
    destructive: { type: Boolean, default: false },
    // The text is a glyph in the CSS font, centered in the CSS size
    icon: { type: Boolean, default: false },
  },

  data() {
    return { isAndroid };
  },

  computed: {
    androidClass() {
      if (this.destructive) return 'btn-destructive';
      return { filled: 'btn-filled', tinted: 'btn-primary' }[this.variant];
    },
  },
};
</script>

<style scoped lang="scss">
@import '@/app';

.btn-filled,
.btn-destructive {
  border-radius: $radius-small;
  color: #ffffff;
  font-size: $font-size;
  ripple-color: rgba(255, 255, 255, 0.2);
}

.btn-filled {
  background-color: $accent;
}

.btn-destructive {
  background-color: $state-error;
}
</style>
