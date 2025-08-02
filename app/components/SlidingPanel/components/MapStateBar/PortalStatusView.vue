// Copyright (C) 2025 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <StackLayout
    class="portal-status-view"
    :class="{
      'portal-status-view--loading': portalStatus.isLoading,
      'portal-status-view--loaded': !portalStatus.isLoading && hasPortalSelected
    }"
    horizontalAlignment="left">

    <!-- If no portal selected or IITC not ready -->
    <Label v-if="!hasPortalSelected"
           class="status-message"
           :text="statusMessage" />

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
import { mapState } from 'vuex';

export default {
  name: 'PortalStatusView',
  props: {
    portalStatus: {
      type: Object,
      required: true
    }
  },
  computed: {
    ...mapState({
      isWebviewLoaded: state => state.ui.isWebviewLoaded,
      isIitcLoaded: state => state.ui.isIitcLoaded
    }),

    // Check if portal is selected
    hasPortalSelected() {
      return this.portalStatus && this.portalStatus.guid !== null;
    },

    statusMessage() {
      if (!this.isWebviewLoaded) {
        return 'Loading...';
      }
      if (!this.isIitcLoaded) {
        return 'Sign in required';
      }
      return 'No portal selected';
    },

    // Prepare array of 8 resonators
    resonatorsArray() {
      const resonators = this.hasPortalSelected ? this.portalStatus.resonators : null;
      const result = [];

      for (let i = 0; i < 8; i++) {
        const resonator = resonators?.[i];
        if (resonator && resonator.energy > 0) {
          result.push(resonator);
        } else {
          result.push({
            level: 0,
            energy: 0,
            maxEnergy: 0,
            healthPct: 0,
            levelColor: '#808080',
          });
        }
      }
      return result;
    }
  }
}
</script>

<style scoped lang="scss">
@import '@/app';

@mixin portal-animation {
  animation-duration: 0.2s;
  animation-timing-function: ease;
  animation-fill-mode: forwards;
}

.portal-status-view {
  font-size: $font-size;

  &--loading {
    @include portal-animation;
    animation-name: fadeToLoading;
  }

  &--loaded {
    @include portal-animation;
    animation-name: fadeFromLoading;
  }
}

@keyframes fadeToLoading {
  from { opacity: 1; }
  to { opacity: 0.6; }
}

@keyframes fadeFromLoading {
  from { opacity: 0.6; }
  to { opacity: 1; }
}

.status-message {
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
