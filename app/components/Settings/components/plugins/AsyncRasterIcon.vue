// Copyright (C) 2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <Image :src="currentSrc" :class="iconClass" stretch="aspectFit" loadMode="async" />
</template>

<script>
import imageCacheService from '@/utils/image-cache';

export default {
  name: 'AsyncRasterIcon',

  props: {
    src: {
      type: [String, Object],
      default: null,
    },
    iconClass: {
      type: String,
      default: '',
    },
  },

  data() {
    return {
      currentSrc: '~/assets/icons/userscript-no-icon.png',
      placeholder: '~/assets/icons/userscript-no-icon.png',
    };
  },

  watch: {
    src: {
      handler(newSrc) {
        this.loadImage(newSrc);
      },
      immediate: true,
    },
  },

  methods: {
    async loadImage(url) {
      if (!url || typeof url !== 'string') {
        this.currentSrc = this.placeholder;
        return;
      }

      // If it's not a remote URL, use as is
      if (!url.startsWith('http')) {
        this.currentSrc = url;
        return;
      }

      // Check cache first (synchronous)
      const cached = imageCacheService.get(url);
      if (cached) {
        this.currentSrc = cached;
        return;
      }

      // Show placeholder while downloading
      this.currentSrc = this.placeholder;

      // Download and cache
      const localPath = await imageCacheService.fetch(url);
      if (localPath) {
        this.currentSrc = localPath;
      }
    },
  },
};
</script>
