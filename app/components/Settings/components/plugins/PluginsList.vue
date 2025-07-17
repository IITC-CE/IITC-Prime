// Copyright (C) 2025 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <GridLayout rows="auto, *" class="plugins-container">
    <!-- Section header -->
    <Label
      v-if="title"
      row="0"
      :text="title"
      class="section-title"
      once="true"
    />

    <!-- Plugins collection -->
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
          class="plugin-item"
          columns="auto, *, auto"
          rows="auto"
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
            <Label :text="item.category || 'Misc'" class="plugin-category" once="true" />
          </StackLayout>

          <!-- Toggle switch -->
          <Switch
            col="2"
            :checked="item.status === 'on'"
            isUserInteractionEnabled="false"
          />
        </GridLayout>
      </template>
    </CollectionView>

    <!-- Empty list message -->
    <Label
      v-if="plugins.length === 0"
      row="1"
      :text="emptyMessage"
      class="no-plugins"
      once="true"
    />
  </GridLayout>
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
    // Message to display when list is empty
    emptyMessage: {
      type: String,
      default: 'No plugins'
    }
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
          items.push(...enabledPlugins.map(plugin => ({
            ...plugin,
            type: 'plugin'
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

      items.push(...sortedPlugins.map(plugin => ({
        ...plugin,
        type: 'plugin'
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

.plugins-container {
  width: 100%;
}

.plugins-list {
  width: 100%;
}

.section-title {
  padding: 8 16;
  color: $primary-light;
  font-size: $font-size-small;
  font-weight: bold;
  text-transform: uppercase;
  background-color: $surface;
}

.section-header {
  padding: 12 16 8 16;
  color: $primary;
  font-size: $font-size-small;
  font-weight: 600;
  text-transform: uppercase;
  background-color: $surface-bright;
}

.no-plugins {
  padding: 16;
  text-align: center;
  color: $surface-variant;
  font-style: italic;
}

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
