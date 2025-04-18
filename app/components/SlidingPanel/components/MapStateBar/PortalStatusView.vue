//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

<template>
  <StackLayout
    class="portal-status-view"
    horizontalAlignment="left">

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

      <!-- Resonators grid -->
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
</template>

<script>
import Resonator from './Resonator';

export default {
  name: 'PortalStatusView',
  components: {
    Resonator
  },
  props: {
    portalStatus: {
      type: Object,
      required: true
    }
  },
  computed: {
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
    }
  }
}
</script>

<style scoped lang="scss">
@import '@/app';

.portal-status-view {
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
</style>
