// Copyright (C) 2025-2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <CollectionView
    ref="collectionView"
    row="1"
    class="plugins-list"
    :items="combinedItems"
    :itemTemplateSelector="templateSelector"
    :style="{ paddingBottom: bottomPadding }"
    iosOverflowSafeArea="true"
    @loaded="onLoaded"
  >
    <!-- Template for section headers -->
    <template #section-header="{ item }">
      <Label :text="item.title" class="section-header" once="true" />
    </template>

    <!-- Template for plugin items with SVG icons -->
    <template #plugin-svg="{ item }">
      <SwipeMenu
        :startingSide="item.startingSide"
        :translationFunction="drawerTranslationFunction"
        :rightSwipeDistance="0"
        backDropEnabled="false"
      >
        <GridLayout
          ~mainContent
          class="list-item plugin-item"
          :class="{ 'list-item--first': item.isFirst, 'list-item--last': item.isLast }"
          columns="auto, *, 56"
          rows="82"
          width="100%"
        >
          <!-- SVG Plugin icon with badge -->
          <GridLayout col="0" class="plugin-icon-wrapper" @tap="onPluginTap(item)">
            <AsyncSVGIcon :src="getPluginIcon(item)" icon-class="plugin-icon" />
            <Label
              v-if="item.user || item.override"
              class="plugin-badge"
              :class="item.override ? 'plugin-badge--override' : 'plugin-badge--user'"
            />
          </GridLayout>
          <!-- Plugin info -->
          <StackLayout col="1" class="plugin-info" @tap="onPluginTap(item)">
            <Label :text="getPluginName(item)" class="plugin-name" once="true" />
            <Label :text="getPluginDescription(item)" class="plugin-description" once="true" />
          </StackLayout>
          <!-- Toggle switch (non-interactive visual; tap handled by wrapper) -->
          <GridLayout col="2" class="switch-area" @tap="onSwitchTap(item)">
            <MDSwitch
              class="switch"
              :checked="item.status === 'on'"
              isUserInteractionEnabled="false"
            />
          </GridLayout>
        </GridLayout>
        <Label
          ~rightDrawer
          :class="
            item.user ? 'swipe-drawer swipe-drawer--delete' : 'swipe-drawer swipe-drawer--disable'
          "
          :text="$filters.fonticon(item.user ? 'fa-trash-alt' : 'fa-ban')"
          class="fa"
          @tap="onSwipeAction(item)"
        />
      </SwipeMenu>
    </template>

    <!-- Template for plugin items with raster icons -->
    <template #plugin-raster="{ item }">
      <SwipeMenu
        :startingSide="item.startingSide"
        :translationFunction="drawerTranslationFunction"
        :rightSwipeDistance="0"
        backDropEnabled="false"
      >
        <GridLayout
          ~mainContent
          class="list-item plugin-item"
          :class="{ 'list-item--first': item.isFirst, 'list-item--last': item.isLast }"
          columns="auto, *, 56"
          rows="82"
          width="100%"
        >
          <!-- Raster Plugin icon with badge -->
          <GridLayout col="0" class="plugin-icon-wrapper" @tap="onPluginTap(item)">
            <AsyncRasterIcon :src="getPluginIcon(item)" icon-class="plugin-icon" />
            <Label
              v-if="item.user || item.override"
              class="plugin-badge"
              :class="item.override ? 'plugin-badge--override' : 'plugin-badge--user'"
            />
          </GridLayout>
          <!-- Plugin info -->
          <StackLayout col="1" class="plugin-info" @tap="onPluginTap(item)">
            <Label :text="getPluginName(item)" class="plugin-name" once="true" />
            <Label :text="getPluginDescription(item)" class="plugin-description" once="true" />
          </StackLayout>
          <!-- Toggle switch (non-interactive visual; tap handled by wrapper) -->
          <GridLayout col="2" class="switch-area" @tap="onSwitchTap(item)">
            <MDSwitch
              class="switch"
              :checked="item.status === 'on'"
              isUserInteractionEnabled="false"
            />
          </GridLayout>
        </GridLayout>
        <Label
          ~rightDrawer
          :class="
            item.user ? 'swipe-drawer swipe-drawer--delete' : 'swipe-drawer swipe-drawer--disable'
          "
          :text="$filters.fonticon(item.user ? 'fa-trash-alt' : 'fa-ban')"
          class="fa"
          @tap="onSwipeAction(item)"
        />
      </SwipeMenu>
    </template>
  </CollectionView>
</template>

<script>
import { isIOS } from '@nativescript/core';
import AsyncSVGIcon from './AsyncSVGIcon.vue';
import AsyncRasterIcon from './AsyncRasterIcon.vue';
import { enableListEdgeToEdge } from '@/utils/platform';

export default {
  name: 'PluginsList',

  components: {
    AsyncSVGIcon,
    AsyncRasterIcon,
  },

  props: {
    // Array of plugins to display
    plugins: {
      type: Array,
      required: true,
    },
    // Whether to show enabled plugins first in separate section
    showEnabledFirst: {
      type: Boolean,
      default: false,
    },
    // Optional section title
    title: {
      type: String,
      default: null,
    },
    bottomPadding: {
      type: Number,
      default: 0,
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
            title: 'Enabled',
          });
          items.push(
            ...enabledPlugins.map((plugin, index) => ({
              ...plugin,
              type: 'plugin',
              sectionId: 'enabled',
              isFirst: index === 0,
              isLast: index === enabledPlugins.length - 1,
            }))
          );
        }

        // Add all plugins section header
        items.push({
          type: 'section-header',
          title: 'All plugins',
        });
      }

      // Add all plugins (sorted), including already-enabled ones
      const sortedPlugins = [...this.plugins].sort((a, b) =>
        this.getPluginName(a).localeCompare(this.getPluginName(b))
      );

      items.push(
        ...sortedPlugins.map((plugin, index) => ({
          ...plugin,
          type: 'plugin',
          sectionId: 'all',
          isFirst: index === 0,
          isLast: index === sortedPlugins.length - 1,
        }))
      );

      return items;
    },
  },

  methods: {
    // Template selector function - determines which template to use
    templateSelector(item, index, items) {
      if (item.type === 'section-header') {
        return 'section-header';
      }

      // Check if plugin has SVG icon
      if (this.isPluginIconSVG(item)) {
        return 'plugin-svg';
      } else {
        return 'plugin-raster';
      }
    },

    isPluginIconSVG(plugin) {
      const icon = plugin.icon64 || plugin.icon;
      if (!icon) return false;

      // Check if it's a data URL with SVG content
      if (typeof icon === 'string' && icon.startsWith('data:image/svg+xml')) {
        return true;
      }

      // Check if it's an SVG string (starts with <svg)
      if (typeof icon === 'string' && icon.trim().startsWith('<svg')) {
        return true;
      }

      // Check if it's a file path ending with .svg
      if (typeof icon === 'string' && icon.toLowerCase().endsWith('.svg')) {
        return true;
      }

      return false;
    },

    getPluginName(plugin) {
      return plugin.name || 'Unknown Plugin';
    },

    getPluginDescription(plugin) {
      return plugin.description || '';
    },

    getPluginIcon(plugin) {
      return plugin.icon64 || plugin.icon || '~/assets/icons/userscript-no-icon.png';
    },

    drawerTranslationFunction(side, width, value, delta, progress) {
      return {
        mainContent: {
          translateX: side === 'right' ? -delta : delta,
        },
      };
    },

    onSwipeAction(item) {
      if (item.user) {
        this.$emit('delete', item);
      } else {
        this.collectionViewRef?.closeCurrentMenu();
      }
    },

    onLoaded(args) {
      this.collectionViewRef = args.object;
      enableListEdgeToEdge(args.object);

      if (isIOS) {
        // CollectionView maps paddingBottom -> contentInset.bottom; disable UIKit auto-adding
        // safe-area inset on top of our manual paddingBottom to avoid double-counting
        args.object.ios.contentInsetAdjustmentBehavior = 2; // UIScrollViewContentInsetAdjustmentBehavior.never
        args.object.ios.keyboardDismissMode = 1; // UIScrollViewKeyboardDismissModeOnDrag
      }
    },

    onSwitchTap(item) {
      this.$emit('toggle', item);
    },

    onPluginTap(item) {
      this.$emit('info', item);
    },
  },
};
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

.plugin-icon-wrapper {
  width: 34;
  height: 34;
  margin-right: 10;
  vertical-alignment: center;
}

.plugin-icon {
  width: 32;
  height: 32;
  horizontal-alignment: left;
  vertical-alignment: top;
}

.plugin-badge {
  width: 10;
  height: 10;
  border-radius: 5;
  horizontal-alignment: right;
  vertical-alignment: bottom;

  &--user {
    background-color: #6b7c3a;
  }

  &--override {
    background-color: $state-warning;
  }
}

.plugin-info {
  vertical-alignment: center;
  margin-right: $spacing-xxs;
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

.switch-area {
  width: 56;
  height: 82;
}

.switch {
  height: 32;
  vertical-alignment: center;
  horizontal-alignment: center;
}

.swipe-drawer {
  width: 82;
  height: 82;
  color: #ffffff;
  font-size: 22;
  text-alignment: center;
  vertical-alignment: center;

  &--delete {
    background-color: $state-error;
  }

  &--disable {
    background-color: #666666;
  }
}
</style>
