//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

<template>
  <FlexboxLayout
    class="map-state-bar"
    flexDirection="row"
    justifyContent="space-between"
    alignItems="center">

    <!-- Left side (portal status) - 2/3 width -->
    <Label
      class="map-state-left"
      width="66%"
      text="Portal Status (coming soon)" />

    <!-- Right side (map status) - 1/3 width -->
    <StackLayout
      class="map-state-right"
      horizontalAlignment="right"
      width="34%">

      <!-- Top section - visible elements info -->
      <HTMLLabel
        class="portal-levels"
        :html="portalLevelsText" />

      <!-- Bottom section - map status with HTML formatting -->
      <HTMLLabel
        class="map-status-line"
        :html="fullMapStatusText" />
    </StackLayout>
  </FlexboxLayout>
</template>

<script>
import { mapState } from 'vuex';

export default {
  name: 'MapStateBar',

  computed: {
    ...mapState({
      mapStatus: state => state.map.mapStatus,
    }),

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
      // Prepare map status
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

        // Add failed requests with red color if any
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

.map-state-bar {
  width: 100%;
  height: 100%;
  background-color: $base;
  padding: 0 10;
}

.map-state-left {
  padding: 5 0;
}

.map-state-right {
  padding: 5 0;
  font-size: 12;
}

.portal-levels {
  color: $text;
  font-weight: bold;
  margin-bottom: 2;
}

.map-status-line {
  color: $text;
}
</style>
