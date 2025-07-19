// Copyright (C) 2025 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <GridLayout
    class="list-item list-item--big"
    :class="{ 'list-item--first': isFirst, 'list-item--last': isLast }"
    columns="*, 56"
    rows="auto"
    @tap="onTap"
  >
    <StackLayout class="stack" col="0" verticalAlignment="center">
      <Label :text="title" class="settings-item-title" once="true" />
      <Label
        v-if="description"
        :text="description"
        class="settings-item-description"
        textWrap="true"
        once="true"
      />
    </StackLayout>

    <!-- Right side content based on type -->
    <StackLayout col="1" verticalAlignment="center">
      <!-- Navigation arrow -->
      <Label
        v-if="type === 'nav'"
        class="fa settings-nav-icon"
        :text="$filters.fonticon('fa-chevron-right')"
        once="true"
      />

      <!-- Switch toggle -->
      <MDSwitch
        v-else-if="type === 'switch'"
        :checked="value"
        @checkedChange="onSwitchChange"
      />
    </StackLayout>
  </GridLayout>
</template>

<script>
import { $navigateTo } from 'nativescript-vue';

export default {
  name: 'SettingsItem',

  props: {
    // Basic props
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: null
    },
    // Type of item: 'nav', 'switch', 'action', 'value'
    type: {
      type: String,
      required: true,
      validator: value => ['nav', 'switch', 'action', 'value'].includes(value)
    },

    // Switch-specific props
    value: {
      type: Boolean,
      default: false
    },

    // Navigation-specific props
    targetScreen: {
      type: Object,
      default: null
    },
    navProps: {
      type: Object,
      default: () => ({})
    },

    // Position props
    isFirst: {
      type: Boolean,
      default: false
    },
    isLast: {
      type: Boolean,
      default: false
    }
  },

  methods: {
    onTap() {
      if (this.type === 'nav' && this.targetScreen) {
        // Handle navigation
        $navigateTo(this.targetScreen, {
          props: this.navProps,
          animated: true,
          transition: {
            name: 'slideLeft',
            duration: 300
          }
        });
      } else if (this.type === 'action') {
        // Emit tap event for custom handling
        this.$emit('tap');
      }
    },

    onSwitchChange(args) {
      this.$emit('change', args.value);
    }
  }
};
</script>

<style scoped lang="scss">
@import '@/app';

.stack {
  height: $spacing-item-big;
}

.settings-item-title {
  color: $on-surface;
  font-size: $font-size;
  font-weight: 500;
}

.settings-item-description {
  color: $on-surface-dark;
  font-size: $font-size-small;
  margin-top: 4;
}

.settings-nav-icon {
  color: $on-surface-dark;
  font-size: 16;
  margin-right: 4;
  text-align: right;
  vertical-alignment: center;
}

.settings-value-text {
  color: $on-surface-dark;
  font-size: $font-size-small;
  margin-right: 4;
  vertical-alignment: center;
}
</style>
