// Copyright (C) 2025 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

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
                 columns="1*, 4, 1*, 4, 1*, 4, 1*, 4, 1*, 4, 1*, 4, 1*, 4, 1*">
        <GridLayout v-for="(resonator, index) in resonatorsArray"
                   :key="index"
                   :col="index * 2"
                   class="resonator"
                   :class="{ empty: resonator.energy <= 0 }">
          <StackLayout
            v-if="resonator.energy > 0"
            class="resonator-fill"
            horizontalAlignment="left"
            :style="{ backgroundColor: resonator.levelColor, width: resonator.healthPct + '%' }" />
        </GridLayout>
      </GridLayout>
    </StackLayout>
  </StackLayout>
</template>

<script>
export default {
  name: 'PortalStatusView',
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
