// Copyright (C) 2025 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <SettingsBase
    title="Plugins"
    use-scroll="false"
    @navigatedTo="onNavigatedTo"
  >
    <GridLayout rows="auto, auto, auto, *" class="main-container">
      <!-- Search field -->
      <TextField
        row="0"
        class="search-field"
        hint="Search plugins..."
        v-model="searchQuery"
      />

      <!-- Categories list component -->
      <CategoriesList
        row="1"
        :categories="categoriesWithPlugins"
        :activeCategory="activeCategory"
        @categorySelected="setActiveCategory"
      />

      <!-- Loading indicator -->
      <ActivityIndicator
        row="2"
        v-if="!isPluginsVisible"
        busy="true"
        class="loading-indicator"
      />

      <!-- Plugins container -->
      <GridLayout row="3" class="plugins-container" v-if="isPluginsVisible">
        <PluginsList
          v-if="filteredPlugins.length > 0"
          :plugins="filteredPlugins"
          :showEnabledFirst="activeCategory === 'All'"
          @toggle="togglePlugin"
        />
        <Label
          v-if="filteredPlugins.length === 0"
          :text="getEmptyMessage()"
          class="no-plugins"
          once="true"
        />
      </GridLayout>
    </GridLayout>
  </SettingsBase>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import { markRaw } from 'vue';
import { fuzzysearch } from 'scored-fuzzysearch';
import { performanceOptimizationMixin, createDebouncer } from '~/utils/performance-optimization';
import SettingsBase from './SettingsBase';
import CategoriesList from './components/plugins/CategoriesList';
import PluginsList from './components/plugins/PluginsList';

export default {
  name: 'PluginsView',

  components: {
    SettingsBase: markRaw(SettingsBase),
    CategoriesList: markRaw(CategoriesList),
    PluginsList: markRaw(PluginsList)
  },

  mixins: [performanceOptimizationMixin],

  data() {
    return {
      searchQuery: '',
      activeCategory: 'All',
      isPluginsVisible: false,

      _searchDebouncer: createDebouncer(300)
    };
  },

  computed: {
    ...mapGetters('manager', ['plugins', 'lastPluginUpdate']),

    allPlugins() {
      return this.plugins;
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

      // Step 1: Filter by category (only for non-All categories)
      if (this.activeCategory !== 'All') {
        plugins = plugins.filter(p => p.category === this.activeCategory);
      }

      // Step 2: Filter by search query if present
      if (this.searchQuery.trim()) {
        plugins = this.searchPlugins(this.searchQuery, plugins);
      }

      return plugins;
    },

    categoriesWithPlugins() {
      const result = {
        all: { name: 'All', hasNew: false }
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
            hasNew: false
          };
        }

        // Check if plugin was added within last hour
        if (plugin.addedAt && (Date.now() / 1000 - plugin.addedAt) < 3600) {
          result[category].hasNew = true;
          result.all.hasNew = true;
        }
      });

      // Sort categories alphabetically, but keep 'All' first
      const sorted = Object.entries(result)
        .filter(([key]) => key !== 'all')
        .sort(([, a], [, b]) => a.name.localeCompare(b.name));

      return { all: result.all, ...Object.fromEntries(sorted) };
    }
  },

  methods: {
    ...mapActions('manager', [
      'loadPlugins',
      'managePlugin'
    ]),

    onNavigatedTo() {
      // Show plugins after navigation is complete
      this.isPluginsVisible = true;
    },

    getEmptyMessage() {
      if (this.activeCategory === 'All') {
        return 'No plugins';
      }
      return `No plugins in ${this.activeCategory} category`;
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

        if (name.includes(normalizedQuery) || description.includes(normalizedQuery) || category.includes(normalizedQuery)) {
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
          action: newStatus
        });
      } catch (error) {
        console.error('Failed to toggle plugin:', error);
        // On error, reload data to ensure UI reflects actual state
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
    }
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

.search-field {
  margin: $spacing-m 0 $spacing-s 0;
  padding: $spacing-s;
  width: 100%;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: $radius-small;
  font-size: 14;
  height: auto;
  color: #ffffff;
  placeholder-color: #aaaaaa;
}

.loading-indicator {
  color: $primary;
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
