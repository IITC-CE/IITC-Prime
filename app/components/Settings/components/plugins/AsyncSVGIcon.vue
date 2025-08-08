// Copyright (C) 2025 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <SVGView
    :src="currentSrc"
    :class="iconClass"
    stretch="stretch"
    :key="componentKey"
  />
</template>

<script>
export default {
  name: 'AsyncSVGIcon',

  props: {
    src: {
      type: String,
      default: null
    },
    iconClass: {
      type: String,
      default: ''
    }
  },

  data() {
    return {
      currentSrc: '~/assets/icons/userscript-no-icon.svg',
      componentKey: 0,
      svgPlaceholder: '~/assets/icons/userscript-no-icon.svg'
    };
  },

  watch: {
    src: {
      handler(newSrc) {
        this.loadSVG(newSrc);
      },
      immediate: true
    }
  },

  methods: {
    async loadSVG(url) {
      if (!url) {
        this.currentSrc = this.svgPlaceholder;
        return;
      }

      // If it's not a remote SVG URL, use as is
      if (!url.startsWith('http') || !url.toLowerCase().endsWith('.svg')) {
        this.currentSrc = url;
        return;
      }

      // Show placeholder while loading
      this.currentSrc = this.svgPlaceholder;

      // Fetch SVG content
      try {
        const response = await fetch(url);

        if (response.ok) {
          const svgContent = await response.text();
          this.currentSrc = svgContent;
        } else {
          // Keep placeholder on HTTP error
          this.currentSrc = this.svgPlaceholder;
        }
      } catch (error) {
        // Keep placeholder on network error
        this.currentSrc = this.svgPlaceholder;
      }
    }
  }
};
</script>
