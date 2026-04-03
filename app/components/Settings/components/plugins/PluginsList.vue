// Copyright (C) 2025-2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <CollectionView
    ref="collectionView"
    row="1"
    class="plugins-list"
    :items="combinedItems"
    :itemTemplateSelector="templateSelector"
    :style="{ paddingBottom: bottomPadding }"
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
      >
        <GridLayout
          ~mainContent
          class="list-item plugin-item"
          :class="{ 'list-item--first': item.isFirst, 'list-item--last': item.isLast }"
          columns="auto, *, 56"
          rows="82"
          width="100%"
          @tap="onPluginTap(item)"
        >
          <!-- SVG Plugin icon -->
          <AsyncSVGIcon col="0" :src="getPluginIcon(item)" icon-class="plugin-icon" />

          <!-- Plugin info -->
          <StackLayout col="1" class="plugin-info">
            <FlexboxLayout class="plugin-name-row">
              <Label :text="getPluginName(item)" class="plugin-name" once="true" />
              <Label
                v-if="item.user && !item.override"
                text="user"
                class="plugin-tag plugin-tag--user"
                once="true"
              />
              <Label
                v-if="item.override"
                text="override"
                class="plugin-tag plugin-tag--override"
                once="true"
              />
            </FlexboxLayout>
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
        <StackLayout
          ~rightDrawer
          :class="
            item.user ? 'swipe-drawer swipe-drawer--delete' : 'swipe-drawer swipe-drawer--disable'
          "
          @tap="onSwipeAction(item)"
        >
          <Label
            :text="$filters.fonticon(item.user ? 'fa-trash-alt' : 'fa-ban')"
            class="fa swipe-drawer-icon"
          />
        </StackLayout>
      </SwipeMenu>
    </template>

    <!-- Template for plugin items with raster icons -->
    <template #plugin-raster="{ item }">
      <SwipeMenu
        :startingSide="item.startingSide"
        :translationFunction="drawerTranslationFunction"
        :rightSwipeDistance="0"
      >
        <GridLayout
          ~mainContent
          class="list-item plugin-item"
          :class="{ 'list-item--first': item.isFirst, 'list-item--last': item.isLast }"
          columns="auto, *, 56"
          rows="82"
          width="100%"
          @tap="onPluginTap(item)"
        >
          <!-- Raster Plugin icon -->
          <AsyncRasterIcon col="0" :src="getPluginIcon(item)" icon-class="plugin-icon" />

          <!-- Plugin info -->
          <StackLayout col="1" class="plugin-info">
            <FlexboxLayout class="plugin-name-row">
              <Label :text="getPluginName(item)" class="plugin-name" once="true" />
              <Label
                v-if="item.user && !item.override"
                text="user"
                class="plugin-tag plugin-tag--user"
                once="true"
              />
              <Label
                v-if="item.override"
                text="override"
                class="plugin-tag plugin-tag--override"
                once="true"
              />
            </FlexboxLayout>
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
        <StackLayout
          ~rightDrawer
          :class="
            item.user ? 'swipe-drawer swipe-drawer--delete' : 'swipe-drawer swipe-drawer--disable'
          "
          @tap="onSwipeAction(item)"
        >
          <Label
            :text="$filters.fonticon(item.user ? 'fa-trash-alt' : 'fa-ban')"
            class="fa swipe-drawer-icon"
          />
        </StackLayout>
      </SwipeMenu>
    </template>
  </CollectionView>
</template>

<script>
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

      // Add all plugins (sorted)
      const sortedPlugins = this.plugins.sort((a, b) =>
        this.getPluginName(a).localeCompare(this.getPluginName(b))
      );

      items.push(
        ...sortedPlugins.map((plugin, index) => ({
          ...plugin,
          type: 'plugin',
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
      const icon = plugin.icon || plugin.icon64;
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
      return plugin.icon || plugin.icon64 || this.placeholderImageSource;
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
    },

    onPluginTap(item) {
      this.$emit('toggle', item);
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

.plugin-icon {
  width: 32;
  height: 32;
  margin-right: 12;
}

.plugin-info {
  vertical-alignment: center;
}

.plugin-name-row {
  align-items: center;
}

.plugin-name {
  color: $on-surface;
  font-size: $font-size;
  font-weight: 500;
}

.plugin-tag {
  font-size: 10;
  padding: 1 6;
  margin-left: 6;
  border-radius: 3;
  color: #ffffff;

  &--user {
    background-color: #6b7c3a;
  }

  &--override {
    background-color: $state-warning;
  }
}

.plugin-description {
  color: $on-surface-dark;
  font-size: $font-size-small;
  margin-top: $spacing-xxs;
  height: 20;
}

.switch {
  height: 32;
  vertical-align: middle;
}

.swipe-drawer {
  width: 82;
  height: 82;

  &--delete {
    background-color: $state-error;
  }

  &--disable {
    background-color: #666666;
  }
}

.swipe-drawer-icon {
  color: #ffffff;
  font-size: 22;
  text-alignment: center;
  vertical-alignment: center;
  height: 100%;
}
</style>
