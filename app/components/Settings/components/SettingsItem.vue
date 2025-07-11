//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

<template>
  <GridLayout
    class="settings-item"
    columns="*, auto"
    rows="auto"
    @tap="onTap"
  >
    <StackLayout col="0" verticalAlignment="center">
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
        :text="'fa-chevron-right' | fonticon"
        once="true"
      />

      <!-- Switch toggle -->
      <Switch
        v-else-if="type === 'switch'"
        :checked="value"
        @checkedChange="onSwitchChange"
      />

      <!-- Custom value display -->
      <Label
        v-else-if="type === 'value' && displayValue"
        :text="displayValue"
        class="settings-value-text"
        once="true"
      />
    </StackLayout>
  </GridLayout>
</template>

<script>
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

    // Value display
    displayValue: {
      type: String,
      default: null
    }
  },

  methods: {
    onTap() {
      if (this.type === 'nav' && this.targetScreen) {
        // Handle navigation
        this.$navigateTo(this.targetScreen, {
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

.settings-item {
  padding: 12 16;
  background-color: $surface-bright;
  border-bottom-width: 1;
  border-bottom-color: $surface-variant;
}

.settings-item-title {
  color: $on-surface;
  font-size: $font-size;
  font-weight: 500;
}

.settings-item-description {
  color: $surface-variant;
  font-size: $font-size-small;
  margin-top: 4;
}

.settings-nav-icon {
  color: $surface-variant;
  font-size: 16;
  margin-right: 4;
  vertical-alignment: center;
}

.settings-value-text {
  color: $surface-variant;
  font-size: $font-size-small;
  margin-right: 4;
  vertical-alignment: center;
}
</style>
