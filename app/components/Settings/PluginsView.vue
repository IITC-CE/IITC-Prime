// Copyright (C) 2025-2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <SettingsBase
    :title="$L('settings.plugins.title')"
    search
    v-model:searchText="searchQuery"
    :searchHint="$L('plugins.search_hint')"
    use-scroll="false"
    :actions="headerActions"
    @action="openAddPlugin"
    @searchActiveChange="searchActive = $event"
    @navigatedTo="onNavigatedTo"
  >
    <template #default="{ bottomPadding }">
      <GridLayout rows="auto, auto, *" class="main-container">
        <!-- Categories list component -->
        <CategoriesList
          v-show="!searching"
          row="0"
          :categories="categoriesWithPlugins"
          :activeCategory="activeCategory"
          @categorySelected="setActiveCategory"
        />

        <!-- Loading indicator -->
        <ActivityIndicator row="1" v-if="!isPluginsVisible" busy="true" class="loading-indicator" />

        <!-- Plugins container -->
        <GridLayout row="2" class="plugins-container" v-if="isPluginsVisible">
          <PluginsList
            v-if="listPlugins.length > 0 || iitcCore"
            :plugins="listPlugins"
            :iitcCore="iitcCore"
            :showEnabledFirst="activeCategory === 'All' && !searching"
            :underNavigationBar="searching"
            :bottomPadding="bottomPadding"
            @info="showPluginInfo"
            @toggle="togglePlugin"
            @delete="deletePlugin"
          />
          <Label
            v-if="listPlugins.length === 0 && !iitcCore"
            :text="getEmptyMessage()"
            class="no-plugins"
          />
        </GridLayout>
      </GridLayout>
    </template>

    <!-- Android: shown in the search view, across all categories -->
    <template #searchResults="{ bottomPadding }">
      <GridLayout rows="*">
        <PluginsList
          v-if="searchResults.length > 0"
          :plugins="searchResults"
          :topPadding="16"
          :bottomPadding="bottomPadding"
          @info="showPluginInfo"
          @toggle="togglePlugin"
          @delete="deletePlugin"
        />
        <Label
          v-else-if="searchQuery.trim()"
          :text="$L('plugins.no_plugins')"
          class="no-plugins"
          verticalAlignment="top"
        />
      </GridLayout>
    </template>
  </SettingsBase>
</template>

<script>
import { isAndroid } from '@nativescript/core';
import { mapActions, mapGetters } from 'vuex';
import { reactive, markRaw } from 'vue';
import { fuzzysearch } from 'scored-fuzzysearch';
import { Toasty } from '@triniwiz/nativescript-toasty';
import { confirm } from '@/utils/dialogs';
import { downloadPlugin, parsePlugin, installPlugin } from '@/utils/manager/plugin-installer';
import { readFileContent } from '@/utils/file-manager';
import { showSheet } from '@/utils/platform/ui';
import SettingsBase from './SettingsBase';
import AddPluginSheet from './components/AddPluginSheet';
import PluginInfoSheet from './components/PluginInfoSheet';
import CategoriesList from './components/plugins/CategoriesList';
import PluginsList from './components/plugins/PluginsList';

export default {
  name: 'PluginsView',

  components: {
    SettingsBase: markRaw(SettingsBase),
    CategoriesList: markRaw(CategoriesList),
    PluginsList: markRaw(PluginsList),
  },

  props: {
    pendingPlugin: {
      type: Object,
      default: null,
    },
  },

  data() {
    return {
      searchQuery: '',
      // iOS: the search shows its results in the page list itself
      searchActive: false,
      activeCategory: 'All',
      isPluginsVisible: false,
    };
  },

  computed: {
    ...mapGetters('manager', ['plugins', 'core', 'lastPluginUpdate']),

    allPlugins() {
      return this.plugins;
    },

    headerActions() {
      return [{ id: 'add', text: this.$L('plugins.add_plugin') }];
    },

    searchResults() {
      if (!this.hasData || !this.searchQuery.trim()) return [];
      return this.searchPlugins(this.searchQuery, Object.values(this.allPlugins));
    },

    // iOS: the page stays as it is until the first letter, so opening the search animates
    // without rebuilding the list; the results then come from all categories
    searching() {
      return this.searchActive && !!this.searchQuery.trim();
    },

    listPlugins() {
      return this.searching ? this.searchResults : this.filteredPlugins;
    },

    iitcCore() {
      if (this.activeCategory !== 'All' || this.searching) return null;
      return this.core || null;
    },

    // Check if data is available
    hasData() {
      return Object.keys(this.allPlugins).length > 0;
    },

    filteredPlugins() {
      if (!this.hasData) {
        return [];
      }

      let plugins = Object.values(this.allPlugins);

      if (this.activeCategory !== 'All') {
        plugins = plugins.filter(p => p.category === this.activeCategory);
      }

      return plugins;
    },

    categoriesWithPlugins() {
      const result = {
        all: { name: 'All', hasNew: false },
      };

      // If data not loaded yet, return just "All" category
      if (!this.hasData) {
        return result;
      }

      // Collect categories from plugins and mark new ones
      Object.entries(this.allPlugins).forEach(([uid, plugin]) => {
        const category = plugin.category || 'Misc';

        if (!result[category]) {
          result[category] = {
            name: category,
            hasNew: false,
          };
        }

        // Check if plugin was added within last hour
        if (plugin.addedAt && Date.now() / 1000 - plugin.addedAt < 3600) {
          result[category].hasNew = true;
          result.all.hasNew = true;
        }
      });

      // Sort categories alphabetically, but keep 'All' first
      const sorted = Object.entries(result)
        .filter(([key]) => key !== 'all')
        .sort(([, a], [, b]) => a.name.localeCompare(b.name));

      return { all: result.all, ...Object.fromEntries(sorted) };
    },
  },

  methods: {
    ...mapActions('manager', ['loadPlugins', 'managePlugin']),

    async showPluginInfo(plugin) {
      const result = await showSheet(this, PluginInfoSheet, {
        props: { plugin },
      });

      if (result === 'delete') {
        await this.deletePlugin(plugin);
      }
    },

    async openAddPlugin() {
      const pending = await showSheet(this, AddPluginSheet, {
        android: {
          // The dialog inherits adjustNothing from the activity; override so the sheet
          // resizes above the keyboard when the URL text field is focused.
          windowSoftInputMode: isAndroid
            ? android.view.WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE
            : undefined,
        },
      });

      if (!pending) return;

      let loaderFn;
      if (pending.type === 'url') {
        loaderFn = async () => {
          const { code, filename } = await downloadPlugin(pending.url);
          return parsePlugin(code, filename);
        };
      } else if (pending.type === 'file') {
        loaderFn = async () => {
          const { content: code, name: filename } = await readFileContent(pending.path);
          if (!code) throw new Error('Failed to read file. The file may be empty or inaccessible.');
          return parsePlugin(code, filename);
        };
      }

      if (loaderFn) await this.confirmInstallPlugin(loaderFn);
    },

    async confirmInstallPlugin(loaderFn) {
      const pluginState = reactive({ loading: true });

      const sheetPromise = showSheet(this, PluginInfoSheet, {
        props: { plugin: pluginState, installMode: true },
      });

      let resolvedCode = null;
      try {
        const { meta, code } = await loaderFn();
        resolvedCode = code;
        Object.assign(pluginState, meta);
        pluginState.loading = false;
      } catch (error) {
        pluginState.loading = false;
        pluginState.loadError = error.message;
      }

      const sheetResult = await sheetPromise;
      if (sheetResult === 'install' && resolvedCode) {
        try {
          await installPlugin(pluginState, resolvedCode);
        } catch (error) {
          console.error('Failed to install plugin:', error);
          new Toasty({ text: this.$L('plugins.toast.install_failed') }).show();
        }
      }
    },

    onNavigatedTo() {
      // Show plugins after navigation is complete
      this.isPluginsVisible = true;

      // Process pending plugin from intent (file or URL)
      if (this.pendingPlugin) {
        const pending = this.pendingPlugin;
        this.$store.dispatch('ui/clearPendingPlugin');
        this.installPendingPlugin(pending);
      }
    },

    installPendingPlugin(pending) {
      const loaderFn = async () => {
        if (pending.type === 'url') {
          const { code, filename } = await downloadPlugin(pending.value);
          return parsePlugin(code, filename);
        }
        return parsePlugin(pending.code, pending.filename);
      };
      this.confirmInstallPlugin(loaderFn);
    },

    getEmptyMessage() {
      if (this.activeCategory === 'All' || this.searching) {
        return this.$L('plugins.no_plugins');
      }
      return this.$L('plugins.no_plugins_in_category', this.activeCategory);
    },

    searchPlugins(query, plugins) {
      const results = [];
      const normalizedQuery = query.toLowerCase();

      // Single pass: calculate score and collect matching plugins
      for (let i = 0; i < plugins.length; i++) {
        const plugin = plugins[i];

        // Quick pre-filter for exact matches (faster than fuzzy search)
        const name = (plugin.name || '').toLowerCase();
        const description = (plugin.description || '').toLowerCase();
        const category = (plugin.category || '').toLowerCase();

        if (
          name.includes(normalizedQuery) ||
          description.includes(normalizedQuery) ||
          category.includes(normalizedQuery)
        ) {
          const score = Math.max(
            fuzzysearch(query, plugin.name || ''),
            fuzzysearch(query, plugin.description || ''),
            fuzzysearch(query, plugin.category || '')
          );

          if (score > 0) {
            results.push([plugin, score]);
          }
        }
      }

      // Sort by score descending
      results.sort((a, b) => b[1] - a[1]);

      // Extract only plugins from sorted results
      const sortedPlugins = new Array(results.length);
      for (let i = 0; i < results.length; i++) {
        sortedPlugins[i] = results[i][0];
      }

      return sortedPlugins;
    },

    // Change active category
    setActiveCategory(category) {
      if (this.activeCategory === category) return;
      this.activeCategory = category;
    },

    // Toggle plugin status
    async togglePlugin(plugin) {
      const newStatus = plugin.status === 'on' ? 'off' : 'on';

      try {
        // Call API to update plugin status
        await this.managePlugin({
          uid: plugin.uid,
          action: newStatus,
        });
      } catch (error) {
        console.error('Failed to toggle plugin:', error);
        // On error, reload data to ensure UI reflects actual state
        await this.loadPlugins();
      }
    },

    async deletePlugin(plugin) {
      const isOverride = !!plugin.override;
      const confirmed = await confirm({
        title: isOverride
          ? this.$L('plugins.delete.title_override')
          : this.$L('plugins.delete.title_plugin'),
        message: isOverride
          ? this.$L('plugins.delete.message_override', plugin.name)
          : this.$L('plugins.delete.message_plugin', plugin.name),
        okButtonText: isOverride
          ? this.$L('plugins.delete.ok_override')
          : this.$L('plugins.delete.ok_plugin'),
        cancelButtonText: this.$L('dialog.cancel'),
      });

      if (!confirmed) return;

      try {
        await this.managePlugin({
          uid: plugin.uid,
          action: 'delete',
        });
      } catch (error) {
        console.error('Failed to delete plugin:', error);
        new Toasty({ text: this.$L('plugins.toast.delete_failed') }).show();
        await this.loadPlugins();
      }
    },

    async loadData() {
      if (this.hasData) return;

      try {
        // Load plugins data
        await this.loadPlugins();
      } catch (error) {
        console.error('Failed to load plugins:', error);
      }
    },
  },

  mounted() {
    // Load data immediately, but don't show plugins yet
    this.loadData();

    // Plugins will be shown in onNavigatedTo event
    this.isPluginsVisible = false;
  },
};
</script>

<style scoped lang="scss">
@import '@/app';

.main-container {
  width: 100%;
  height: 100%;
}

.loading-indicator {
  color: $accent;
  width: 40;
  height: 40;
  margin: 10 0;
}

.plugins-container {
  flex-grow: 1;
}

.no-plugins {
  padding: 16;
  text-align: center;
  color: $on-surface;
  font-style: italic;
}
</style>
