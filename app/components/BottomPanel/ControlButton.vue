// Copyright (C) 2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <MDButton
    variant="flat"
    class="fa app-control-button"
    :class="{ 'app-control-button--active': active }"
    :isUserInteractionEnabled="visible"
    :text="text"
    @loaded="onLoaded"
    @tap="$emit('tap')"
  />
</template>

<script>
import { CoreTypes } from '@nativescript/core';

export default {
  name: 'ControlButton',

  emits: ['tap'],

  props: {
    text: { type: String, required: true },
    visible: { type: Boolean, default: true },
    active: { type: Boolean, default: false },
  },

  data() {
    return {
      _nativeView: null,
    };
  },

  watch: {
    visible(newValue) {
      this._animate(newValue, true);
    },
  },

  methods: {
    onLoaded(args) {
      this._nativeView = args.object;
      this._animate(this.visible, false);
    },

    _animate(visible, animated) {
      if (!this._nativeView) return;

      const opacity = visible ? 1 : 0.2;
      const scale = visible ? 1 : 0.8;

      if (!animated) {
        this._nativeView.opacity = opacity;
        this._nativeView.scaleX = scale;
        this._nativeView.scaleY = scale;
        return;
      }

      this._nativeView.animate({
        opacity,
        scale: { x: scale, y: scale },
        duration: 200,
        curve: CoreTypes.AnimationCurve.easeOut,
      });
    },
  },
};
</script>

<style scoped lang="scss">
@import '@/app';

.app-control-button {
  width: 42;
  min-width: 42;
  max-width: 42;
  height: 42;
  margin: 0 5;
  padding: 0;
  font-size: 18;
  border-radius: 10;
  color: rgba(255, 255, 255, 0.7);
  background-color: transparent;
  ripple-color: $ripple;
  horizontal-alignment: center;
  vertical-alignment: center;

  &--active {
    background-color: $surface-bright;
  }
}
</style>
