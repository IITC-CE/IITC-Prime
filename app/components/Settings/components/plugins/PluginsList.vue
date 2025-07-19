// Copyright (C) 2025 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <CollectionView
    row="1"
    class="plugins-list"
    :items="combinedItems"
    :itemTemplateSelector="templateSelector"
    @itemTap="onItemTap"
  >
    <!-- Template for section headers -->
    <template #section-header="{ item }">
      <Label
        :text="item.title"
        class="section-header"
        once="true"
      />
    </template>

    <!-- Template for plugin items -->
    <template #plugin="{ item }">
      <GridLayout
        class="list-item plugin-item"
        :class="{ 'list-item--first': item.isFirst, 'list-item--last': item.isLast }"
        columns="auto, *, 56"
        rows="82"
      >
        <!-- Plugin icon -->
        <ImageCacheIt
          col="0"
          :src="getPluginIcon(item)"
          :placeHolder="placeholderImageSource"
          :errorHolder="placeholderImageSource"
          class="plugin-icon"
          stretch="aspectFit"
          loadMode="async"
          transition="fade"
          once="true"
        />

        <!-- Plugin info -->
        <StackLayout col="1" class="plugin-info">
          <Label :text="getPluginName(item)" class="plugin-name" once="true" />
          <Label :text="getPluginDescription(item)" class="plugin-description" once="true" />
        </StackLayout>

        <!-- Toggle switch -->
        <MDSwitch
          col="2"
          class="switch"
          :checked="item.status === 'on'"
          isUserInteractionEnabled="false"
        />
      </GridLayout>
    </template>
  </CollectionView>
</template>

<script>
export default {
  name: 'PluginsList',

  props: {
    // Array of plugins to display
    plugins: {
      type: Array,
      required: true
    },
    // Whether to show enabled plugins first in separate section
    showEnabledFirst: {
      type: Boolean,
      default: false
    },
    // Optional section title
    title: {
      type: String,
      default: null
    },
  },

  computed: {
    // Combine all data into single array with different item types
    combinedItems() {
      const items = [];

      if (this.showEnabledFirst) {
        // Get enabled plugins
        const enabledPlugins = this.plugins
          .filter(p => p.status === 'on')
          .sort((a, b) => this.getPluginName(a).localeCompare(this.getPluginName(b)));

        // Add enabled plugins section if there are any enabled plugins
        if (enabledPlugins.length > 0) {
          items.push({
            type: 'section-header',
            title: 'Enabled'
          });
          items.push(...enabledPlugins.map((plugin, index) => ({
            ...plugin,
            type: 'plugin',
            isFirst: index === 0,
            isLast: index === enabledPlugins.length - 1
          })));
        }

        // Add all plugins section header
        items.push({
          type: 'section-header',
          title: 'All plugins'
        });
      }

      // Add all plugins (sorted)
      const sortedPlugins = this.plugins
        .sort((a, b) => this.getPluginName(a).localeCompare(this.getPluginName(b)));

      items.push(...sortedPlugins.map((plugin, index) => ({
        ...plugin,
        type: 'plugin',
        isFirst: index === 0,
        isLast: index === sortedPlugins.length - 1
      })));

      return items;
    },

    placeholderImageSource() {
      try {
        const ImageSource = require('@nativescript/core').ImageSource;
        return ImageSource.fromFileSync('~/assets/icons/userscript-no-icon.png');
      } catch (error) {
        console.error('Failed to load placeholder icon:', error);
      }
    }
  },

  methods: {
    // Template selector function - determines which template to use
    templateSelector(item, index, items) {
      return item.type === 'section-header' ? 'section-header' : 'plugin';
    },

    getPluginName(plugin) {
      return plugin.name || 'Unknown Plugin';
    },

    getPluginDescription(plugin) {
      return plugin.description || '';
    },

    getPluginIcon(plugin) {
      return plugin.icon64 ||
             plugin.icon ||
             this.placeholderImageSource;
    },

    // Handle item tap to toggle plugin status
    onItemTap(event) {
      const item = event.item;

      // Ignore taps on section headers
      if (item.type === 'section-header') {
        return;
      }

      // Skip if event came from switch to avoid double triggers
      if (event.object &&
          event.object.className &&
          event.object.className.includes('switch')) {
        return;
      }

      this.$emit('toggle', item);
    }
  }
}
</script>

<style scoped lang="scss">
@import '@/app';

.plugins-list {
  width: 100%;
}

.plugin-item {
  height: 82;
  padding: 0 $spacing-m;
  vertical-alignment: center;
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

.plugin-description {
  color: $on-surface-dark;
  font-size: $font-size-small;
  margin-top: $spacing-xxs;
  height: 20;
}

.switch {
  height: 82;
}
</style>
