//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

<template>
  <FlexboxLayout
    class="map-state-bar"
    flexDirection="row"
    justifyContent="space-between"
    alignItems="center">

    <!-- Left side (portal status) - 2/3 width -->
    <StackLayout
      class="map-state-left"
      horizontalAlignment="left"
      width="68%">

      <!-- If no portal selected -->
      <Label v-if="!hasPortalSelected"
             class="no-portal-message"
             text="No portal selected" />

      <!-- If portal is selected -->
      <StackLayout v-else>
        <!-- Portal information -->
        <GridLayout class="portal-info"
                   columns="auto, auto, *"
                   rows="auto">
          <!-- Level badge -->
          <Label col="0"
                 class="level-badge"
                 :text="'L' + portalStatus.level"
                 :style="{ backgroundColor: portalStatus.levelColor || '#808080' }" />

          <!-- Health percentage -->
          <Label col="1"
                 class="health-percentage"
                 :text="portalStatus.health + '%'" />

          <!-- Portal title -->
          <Label col="2"
                 class="portal-title"
                 :text="portalStatus.title"
                 textWrap="false" />
        </GridLayout>

        <!-- Resonators -->
        <GridLayout class="resonators-grid"
                   rows="auto"
                   columns="1*, 1*, 1*, 1*, 1*, 1*, 1*, 1*">
          <Resonator v-for="(resonator, index) in resonatorsArray"
                    :key="index"
                    :col="index"
                    :level="resonator.level"
                    :healthPct="resonator.healthPct"
                    :color="resonator.levelColor"
                    :isEmpty="resonator.energy <= 0" />
        </GridLayout>
      </StackLayout>
    </StackLayout>

    <!-- Right side (map status) - 1/3 width -->
    <StackLayout
      class="map-state-right"
      horizontalAlignment="right"
      width="32%">

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
import Resonator from './components/MapStateBar/Resonator';

export default {
  name: 'MapStateBar',
  components: {
    Resonator
  },

  computed: {
    ...mapState({
      mapStatus: state => state.map.mapStatus,
      portalStatus: state => state.map.portalStatus
    }),

    // Check if portal is selected
    hasPortalSelected() {
      return this.portalStatus && this.portalStatus.guid !== null;
    },

    // Prepare array of 8 resonators
    resonatorsArray() {
      if (!this.hasPortalSelected || !this.portalStatus.resonators || !this.portalStatus.resonators.length) {
        // Create 8 empty resonators if no data
        return Array(8).fill().map(() => ({
          level: 0,
          energy: 0,
          maxEnergy: 0,
          healthPct: 0,
          levelColor: '#808080',
        }));
      }

      // Use data from API
      return this.portalStatus.resonators;
    },

    // Computed properties for map status
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
  font-size: $font-size;
  padding-right: $spacing-m;
}

.no-portal-message {
  text-align: center;
  color: $text;
  font-style: italic;
}

.resonators-grid {
  margin-top: 2;
}

.portal-info {
  padding: 0 2;
}

.level-badge {
  color: white;
  font-weight: bold;
  text-align: center;
  border-radius: $radius-small;
  padding: 2 4;
  margin-right: $spacing-xs;
}

.health-percentage {
  color: $text;
  margin-right: $spacing-xs;
}

.portal-title {
  color: $text;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: bold;
  flex-grow: 1;
}

.map-state-right {
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
