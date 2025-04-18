//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

<template>
  <StackLayout
    class="map-status-view"
    horizontalAlignment="right">

    <!-- Portal levels info -->
    <HTMLLabel
      class="portal-levels"
      :html="portalLevelsText" />

    <!-- Map status and requests info -->
    <HTMLLabel
      class="map-status-line"
      :html="fullMapStatusText" />
  </StackLayout>
</template>

<script>
export default {
  name: 'MapStatusView',
  props: {
    mapStatus: {
      type: Object,
      required: true
    }
  },
  computed: {
    // Portal levels display text
    portalLevelsText() {
      const portalLevels = this.mapStatus?.portalLevels;
      if (!portalLevels) return 'Loading...';

      if (portalLevels.hasPortals) {
        return 'portals';
      } else {
        let content = 'all links';
        if (portalLevels.minLinkLength > 0) {
          content = `>${portalLevels.formattedLength}`;
        }
        return content;
      }
    },

    // Generate HTML-formatted status text
    fullMapStatusText() {
      const status = this.mapStatus?.mapStatus;
      if (!status) return '<b>map:</b> Loading...';

      let result = `<b>map:</b> ${status.short || 'Loading...'}`;

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
    }
  }
}
</script>

<style scoped lang="scss">
@import '@/app';

.map-status-view {
  font-size: $font-size-small;
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
