//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

<template>
  <GridLayout
    class="plugin-item"
    columns="auto, *, auto"
    rows="auto"
    @tap="toggle"
  >
    <!-- Plugin icon -->
    <Image
      col="0"
      :src="pluginIcon"
      class="plugin-icon"
      stretch="aspectFit"
    />

    <!-- Plugin info -->
    <StackLayout col="1" class="plugin-info">
      <Label :text="pluginName" class="plugin-name" />
      <Label :text="pluginCategory" class="plugin-category" />
    </StackLayout>

    <!-- Toggle switch -->
    <Switch
      col="2"
      :checked="plugin.status === 'on'"
      @checkedChange="onToggleChange"
      isEnabled="false"
    />
  </GridLayout>
</template>

<script>
export default {
  name: 'PluginItem',

  props: {
    plugin: {
      type: Object,
      required: true
    }
  },

  computed: {
    pluginName() {
      const lang = 'en';
      return this.plugin[`name:${lang}`] || this.plugin.name || 'Unknown Plugin';
    },

    pluginCategory() {
      return this.plugin.category || 'Misc';
    },

    pluginIcon() {
      return this.plugin.icon ||
             this.plugin.icon64 ||
             '~/assets/icons/userscript-no-icon.png';
    }
  },

  methods: {
    toggle() {
      this.$emit('toggle', this.plugin);
    },

    onToggleChange(args) {
      // Prevent direct toggle, use tap event instead
      args.object.checked = this.plugin.status === 'on';
      this.toggle();
    }
  }
};
</script>

<style scoped lang="scss">
@import '@/app';

.plugin-item {
  padding: 12 16;
  background-color: $surface-bright;
  border-bottom-width: 1;
  border-bottom-color: $surface-variant;
}

.plugin-icon {
  width: 32;
  height: 32;
  margin-right: 12;
}

.plugin-info {
  vertical-alignment: center;
}

.plugin-name {
  color: $on-surface;
  font-size: $font-size;
  font-weight: 500;
}

.plugin-category {
  color: $surface-variant;
  font-size: $font-size-small;
  margin-top: 2;
}
</style>
