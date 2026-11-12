// Copyright (C) 2025-2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <CollectionView
    ref="collectionView"
    row="1"
    class="plugins-list"
    :items="combinedItems"
    :itemTemplateSelector="templateSelector"
    :style="{ paddingTop: topPadding, paddingBottom: bottomPadding }"
    iosOverflowSafeArea="true"
    @loaded="onLoaded"
  >
    <!-- Template for section headers -->
    <template #section-header="{ item }">
      <Label
        :text="item.title"
        class="section-header"
        :class="{ 'section-header--first': item.isFirst }"
        once="true"
      />
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
          columns="auto, *, auto"
          :rows="String(rowHeight)"
          :height="rowHeight"
          width="100%"
          v-on="rowFeedback"
          @tap="onRowTap($event, item)"
        >
          <!-- SVG Plugin icon with badge -->
          <GridLayout col="0" class="plugin-icon-wrapper">
            <AsyncSVGIcon :src="getPluginIcon(item)" icon-class="plugin-icon" />
            <Label
              v-if="item.user || item.override"
              class="plugin-badge"
              :class="item.override ? 'plugin-badge--override' : 'plugin-badge--user'"
            />
          </GridLayout>
          <!-- Plugin info -->
          <StackLayout col="1" class="plugin-info">
            <Label :text="getPluginName(item)" class="list-item-title plugin-name" once="true" />
            <Label
              :text="getPluginDescription(item)"
              class="list-item-subtitle plugin-description"
              once="true"
            />
          </StackLayout>
          <!-- Toggle switch (non-interactive visual; tap handled by wrapper) -->
          <GridLayout
            id="switch-area"
            col="2"
            class="switch-area list-item-trailing"
            @tap="onSwitchTap(item)"
          >
            <AppSwitch
              class="switch"
              :checked="item.status === 'on'"
              :isEnabled="!item.isCore"
              isUserInteractionEnabled="false"
            />
          </GridLayout>
          <ContentView
            v-if="isIOS"
            col="1"
            colSpan="2"
            class="list-separator"
            :visibility="item.isLast ? 'collapse' : 'visible'"
          />
        </GridLayout>
        <GridLayout
          ~rightDrawer
          :class="
            item.user || item.override
              ? 'swipe-drawer swipe-drawer--delete'
              : 'swipe-drawer swipe-drawer--disable'
          "
          :width="rowHeight"
          :height="rowHeight"
          v-on="pressFeedback"
          @tap="onSwipeAction(item)"
        >
          <Label
            class="ms"
            :text="$filters.fonticon(item.user || item.override ? 'ms-delete' : 'ms-block')"
          />
        </GridLayout>
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
          columns="auto, *, auto"
          :rows="String(rowHeight)"
          :height="rowHeight"
          width="100%"
          v-on="rowFeedback"
          @tap="onRowTap($event, item)"
        >
          <!-- Raster Plugin icon with badge -->
          <GridLayout col="0" class="plugin-icon-wrapper">
            <AsyncRasterIcon :src="getPluginIcon(item)" icon-class="plugin-icon" />
            <Label
              v-if="item.user || item.override"
              class="plugin-badge"
              :class="item.override ? 'plugin-badge--override' : 'plugin-badge--user'"
            />
          </GridLayout>
          <!-- Plugin info -->
          <StackLayout col="1" class="plugin-info">
            <Label :text="getPluginName(item)" class="list-item-title plugin-name" once="true" />
            <Label
              :text="getPluginDescription(item)"
              class="list-item-subtitle plugin-description"
              once="true"
            />
          </StackLayout>
          <!-- Toggle switch (non-interactive visual; tap handled by wrapper) -->
          <GridLayout
            id="switch-area"
            col="2"
            class="switch-area list-item-trailing"
            @tap="onSwitchTap(item)"
          >
            <AppSwitch
              class="switch"
              :checked="item.status === 'on'"
              :isEnabled="!item.isCore"
              isUserInteractionEnabled="false"
            />
          </GridLayout>
          <ContentView
            v-if="isIOS"
            col="1"
            colSpan="2"
            class="list-separator"
            :visibility="item.isLast ? 'collapse' : 'visible'"
          />
        </GridLayout>
        <GridLayout
          ~rightDrawer
          :class="
            item.user || item.override
              ? 'swipe-drawer swipe-drawer--delete'
              : 'swipe-drawer swipe-drawer--disable'
          "
          :width="rowHeight"
          :height="rowHeight"
          v-on="pressFeedback"
          @tap="onSwipeAction(item)"
        >
          <Label
            class="ms"
            :text="$filters.fonticon(item.user || item.override ? 'ms-delete' : 'ms-block')"
          />
        </GridLayout>
      </SwipeMenu>
    </template>
  </CollectionView>
</template>

<script>
import { isIOS, Utils } from '@nativescript/core';
import AsyncSVGIcon from './AsyncSVGIcon.vue';
import AsyncRasterIcon from './AsyncRasterIcon.vue';
import AppSwitch from '@/components/base/AppSwitch.vue';
import { enableListEdgeToEdge, pressFeedback } from '@/utils/platform/ui';

// A two-line row as the platform draws it: Material 3 and iOS 26 give 72, earlier iOS 60
const ROW_HEIGHT = isIOS && Utils.SDK_VERSION < 26 ? 60 : 72;
// Match .section-header and .section-header--first
const HEADER_HEIGHT = 56;
const FIRST_HEADER_HEIGHT = 40;

export default {
  name: 'PluginsList',

  components: {
    AppSwitch,
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
    // IITC core script object (shown first in Enabled section when in All category)
    iitcCore: {
      type: Object,
      default: null,
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
    // Android: inside the list, so the rows start below a gap yet scroll up to the bar
    topPadding: {
      type: Number,
      default: 0,
    },
    // iOS: nothing above the list on the page, so it extends under the navigation bar too
    underNavigationBar: {
      type: Boolean,
      default: false,
    },
  },

  data() {
    return { isIOS, pressFeedback, rowHeight: ROW_HEIGHT };
  },

  computed: {
    rowFeedback() {
      return isIOS ? { touch: this.onRowTouch } : pressFeedback;
    },

    // Combine all data into single array with different item types
    combinedItems() {
      const items = [];

      if (this.showEnabledFirst) {
        // Get enabled plugins
        const enabledPlugins = this.plugins
          .filter(p => p.status === 'on')
          .sort((a, b) => this.getPluginName(a).localeCompare(this.getPluginName(b)));

        // Enabled section always visible when core is present or there are enabled plugins
        if (this.iitcCore || enabledPlugins.length > 0) {
          items.push({
            type: 'section-header',
            title: 'Enabled',
            isFirst: true,
          });

          // Core is always first in the Enabled section
          if (this.iitcCore) {
            items.push({
              ...this.iitcCore,
              type: 'plugin',
              sectionId: 'enabled',
              isCore: true,
              status: 'on',
              isFirst: true,
              isLast: enabledPlugins.length === 0,
            });
          }

          items.push(
            ...enabledPlugins.map((plugin, index) => ({
              ...plugin,
              type: 'plugin',
              sectionId: 'enabled',
              isFirst: !this.iitcCore && index === 0,
              isLast: index === enabledPlugins.length - 1,
            }))
          );
        }

        // Add all plugins section header
        items.push({
          type: 'section-header',
          title: 'All plugins',
          isFirst: items.length === 0,
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

  watch: {
    combinedItems() {
      this.collectionViewRef?.closeCurrentMenu();
    },
    underNavigationBar() {
      this.updateIosContentInset();
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
      if (item.user || item.override) {
        this.$emit('delete', item);
      } else {
        this.collectionViewRef?.closeCurrentMenu();
      }
    },

    onLoaded(args) {
      this.collectionViewRef = args.object;
      enableListEdgeToEdge(args.object);

      if (isIOS) {
        // Without a known height the iOS list lays out every row up front to measure it,
        // which stalls the page for a full list.
        args.object.setTemplateRowHeight('plugin-svg', ROW_HEIGHT);
        args.object.setTemplateRowHeight('plugin-raster', ROW_HEIGHT);
        this.updateIosContentInset();
        args.object.ios.keyboardDismissMode = 1; // UIScrollViewKeyboardDismissModeOnDrag
      }
    },

    updateIosContentInset() {
      const collectionView = this.collectionViewRef?.ios;
      if (!isIOS || !collectionView) return;
      // CollectionView maps paddingBottom -> contentInset.bottom; disable UIKit auto-adding
      // safe-area inset on top of our manual paddingBottom to avoid double-counting.
      // Under the navigation bar UIKit's inset is the only one keeping the first rows visible.
      collectionView.contentInsetAdjustmentBehavior = this.underNavigationBar
        ? UIScrollViewContentInsetAdjustmentBehavior.Always
        : UIScrollViewContentInsetAdjustmentBehavior.Never;
    },

    async onSwitchTap(item) {
      if (item.isCore) return;

      if (!this.showEnabledFirst) {
        this.$emit('toggle', item);
        return;
      }

      const scrollBefore = this.collectionViewRef?.scrollOffset ?? 0;
      const enabledBefore = this.combinedItems.filter(i => i.sectionId === 'enabled').length;

      this.$emit('toggle', item);

      await this.$nextTick();

      const enabledAfter = this.combinedItems.filter(i => i.sectionId === 'enabled').length;
      const itemsDelta = enabledAfter - enabledBefore;
      if (itemsDelta === 0 || !this.collectionViewRef) return;

      const ITEM_H = ROW_HEIGHT;
      const HEADER_H = HEADER_HEIGHT;

      // A new first header pushes down a header that grows to full height: a full header in all
      let heightDelta = itemsDelta * ITEM_H;
      if (enabledBefore === 0 && itemsDelta > 0) heightDelta += HEADER_H;
      if (enabledAfter === 0 && itemsDelta < 0) heightDelta -= HEADER_H;

      // only compensate when the Enabled section items are fully above the viewport
      const enabledSectionEndY =
        enabledBefore > 0 ? FIRST_HEADER_HEIGHT + enabledBefore * ITEM_H : 0;
      if (scrollBefore <= enabledSectionEndY) return;

      if (isIOS) {
        this.collectionViewRef.ios.contentOffset = {
          x: 0,
          y: Math.max(0, scrollBefore + heightDelta),
        };
      } else {
        // scrollToOffset calls RecyclerView.scrollBy() which takes pixels, not dp
        this.collectionViewRef.scrollToOffset(Utils.layout.toDevicePixels(heightDelta));
      }
    },

    isOnSwitch(args) {
      const row = args.object;
      const area = row.getViewById('switch-area');
      if (isIOS) return args.getX() >= area.getLocationRelativeTo(row).x;
      // Android hands the row the switch area's tap in the area's coordinates
      const x = Utils.layout.toDeviceIndependentPixels(args.android.getRawX());
      return x >= area.getLocationOnScreen().x;
    },

    // The switch area handles its own taps
    onRowTap(args, item) {
      if (!this.isOnSwitch(args)) this.onPluginTap(item);
    },

    // iOS: the row is not highlighted for the switch, as in system settings
    onRowTouch(args) {
      if (args.action === 'down') this.touchOnSwitch = this.isOnSwitch(args);
      if (!this.touchOnSwitch) pressFeedback.touch(args);
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

// Right below the categories, which have padding of their own: 16 less from the top than
// .section-header
.section-header.section-header--first {
  height: 40;
  padding-top: 12;
}

.ns-ios-15,
.ns-ios-16,
.ns-ios-17,
.ns-ios-18 {
  .section-header.section-header--first {
    padding-top: 18;
  }
}

.plugin-item {
  padding: 0 $spacing-m;
  vertical-align: center;
}

.plugin-icon-wrapper {
  width: 34;
  height: 34;
  margin-right: $spacing-m;
  vertical-align: center;
}

.plugin-icon {
  width: 32;
  height: 32;
  horizontal-align: left;
  vertical-align: top;
}

.plugin-badge {
  width: 10;
  height: 10;
  border-radius: 5;
  horizontal-align: right;
  vertical-align: bottom;

  &--user {
    background-color: #6b7c3a;
  }

  &--override {
    background-color: $state-warning;
  }
}

.plugin-info {
  vertical-align: center;
  margin-right: $spacing-m;
}

.plugin-name {
  font-weight: 500;
}

.plugin-description {
  margin-top: $spacing-xxs;
}

.switch {
  vertical-align: center;
  horizontal-align: center;
}

.swipe-drawer {
  color: #ffffff;
  text-align: center;

  Label {
    font-size: $icon-size-large;
    vertical-align: center;
  }

  &--delete {
    background-color: $state-error;
  }

  &--disable {
    background-color: #666666;
  }

  // iOS: a pressed swipe action darkens, as in system lists
  &--delete:highlighted {
    background-color: darken($state-error, 10%);
  }

  &--disable:highlighted {
    background-color: darken(#666666, 10%);
  }
}
</style>
