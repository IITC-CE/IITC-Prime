// Copyright (C) 2025-2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <StackLayout class="map-status-view" horizontalAlignment="right">
    <!-- Portal levels info -->
    <HTMLLabel class="portal-levels" :html="portalLevelsText" />

    <!-- Map status and requests info -->
    <HTMLLabel class="map-status-line" :html="fullMapStatusText" />
  </StackLayout>
</template>

<script>
export default {
  name: 'MapStatusView',
  props: {
    mapStatus: {
      type: Object,
      required: true,
    },
  },
  computed: {
    // Portal levels display text
    portalLevelsText() {
      const portalLevels = this.mapStatus?.portalLevels;
      if (!portalLevels) return this.$L('common.loading');

      if (portalLevels.hasPortals) {
        return this.$L('map_status.portals');
      } else {
        let content = this.$L('map_status.all_links');
        if (portalLevels.minLinkLength > 0) {
          content = `>${portalLevels.formattedLength}`;
        }
        return content;
      }
    },

    // Generate HTML-formatted status text
    fullMapStatusText() {
      const status = this.mapStatus?.mapStatus;
      if (!status) return this.$L('common.loading');

      let result = `${status.short || this.$L('common.loading')}`;

      // Add progress if available
      if (status.progressPercent !== null) {
        result += ` ${status.progressPercent}%`;
      }

      // Add requests if available
      const requests = this.mapStatus?.requests;
      if (requests && (requests.hasActive || requests.hasFailed)) {
        result += ` [${requests.active}`;

        if (requests.hasFailed) {
          result += `<font color="#d23b22">/${requests.failed}</font>]`;
        } else {
          result += `]`;
        }
      }

      return result;
    },
  },
};
</script>

<style scoped lang="scss">
@import '@/app';

.map-status-view {
  font-size: $font-size-small;
  padding-left: $spacing-m;
}

.portal-levels {
  color: $text;
  font-weight: bold;
  margin-top: 4;
  margin-bottom: 1;
}

.map-status-line {
  color: $text;
}
</style>
