//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

<template>
  <SettingsBase title="Plugins">
    <!-- Search bar -->
    <GridLayout rows="auto" columns="*" class="search-container">
      <TextField
        hint="Search plugins..."
        v-model="searchQuery"
        @textChange="onSearchChange"
      />
    </GridLayout>

    <!-- Category tags -->
    <FlexboxLayout flexWrap="wrap" class="categories">
      <CategoryTag
        v-for="(category, key) in categoriesWithPlugins"
        :key="key"
        :name="category.name"
        :isActive="activeCategory === category.name"
        :hasNew="category.hasNew"
        @tap="setActiveCategory(category.name)"
      />
    </FlexboxLayout>

    <!-- Plugins list -->
    <StackLayout>
      <!-- Enabled plugins section -->
      <Label class="section-title" text="Enabled Plugins" />
      <PluginItem
        v-for="plugin in enabledPlugins"
        :key="plugin.uid"
        :plugin="plugin"
        @toggle="togglePlugin"
      />
      <Label
        v-if="enabledPlugins.length === 0"
        class="no-plugins"
        text="No enabled plugins"
      />

      <!-- Disabled plugins section -->
      <Label class="section-title" text="Disabled Plugins" />
      <PluginItem
        v-for="plugin in disabledPlugins"
        :key="plugin.uid"
        :plugin="plugin"
        @toggle="togglePlugin"
      />
      <Label
        v-if="disabledPlugins.length === 0"
        class="no-plugins"
        text="No disabled plugins"
      />
    </StackLayout>
  </SettingsBase>
</template>

<script>
import { mapActions } from 'vuex';
import { fuzzysearch } from 'scored-fuzzysearch';
import SettingsBase from './SettingsBase';
import CategoryTag from './components/plugins/CategoryTag';
import PluginItem from './components/plugins/PluginItem';

export default {
  name: 'PluginsView',

  components: {
    SettingsBase,
    CategoryTag,
    PluginItem
  },

  data() {
    return {
      searchQuery: '',
      activeCategory: 'All',
      allPlugins: {},
      categories: {},
      searchTimeout: null
    };
  },

  computed: {
    categoriesWithPlugins() {
      const result = {
        all: { name: 'All', hasNew: false }
      };

      // Check which categories have plugins and mark new ones
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
    },

    filteredPlugins() {
      let plugins = Object.values(this.allPlugins);

      // Filter by category
      if (this.activeCategory !== 'All') {
        plugins = plugins.filter(p => p.category === this.activeCategory);
      }

      // Filter by search query
      if (this.searchQuery.trim()) {
        plugins = this.searchPlugins(this.searchQuery, plugins);
      }

      return plugins;
    },

    enabledPlugins() {
      return this.filteredPlugins
        .filter(p => p.status === 'on')
        .sort((a, b) => this.getPluginName(a).localeCompare(this.getPluginName(b)));
    },

    disabledPlugins() {
      return this.filteredPlugins
        .filter(p => p.status !== 'on')
        .sort((a, b) => this.getPluginName(a).localeCompare(this.getPluginName(b)));
    }
  },

  methods: {
    ...mapActions('manager', [
      'getPlugins',
      'getCategories',
      'managePlugin'
    ]),

    getPluginName(plugin) {
      const lang = 'en';
      return plugin[`name:${lang}`] || plugin.name || 'Unknown Plugin';
    },

    searchPlugins(query, plugins) {
      const lang = 'en';
      const scored = plugins.map(plugin => {
        const score = Math.max(
          fuzzysearch(query, plugin.name || ''),
          fuzzysearch(query, plugin[`name:${lang}`] || ''),
          fuzzysearch(query, plugin.description || ''),
          fuzzysearch(query, plugin[`description:${lang}`] || ''),
          fuzzysearch(query, plugin.category || '')
        );
        return { plugin, score };
      });

      return scored
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(item => item.plugin);
    },

    onSearchChange() {
      // Debounce search
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => {
        // Search is handled by computed property
      }, 300);
    },

    setActiveCategory(category) {
      this.activeCategory = category;
    },

    async togglePlugin(plugin) {
      const newStatus = plugin.status === 'on' ? 'off' : 'on';
      await this.managePlugin({
        uid: plugin.uid,
        action: newStatus
      });

      // Update local state
      this.$set(this.allPlugins[plugin.uid], 'status', newStatus);
    },

    async loadData() {
      try {
        this.allPlugins = await this.getPlugins();
        console.log('this.allPlugins', this.allPlugins);
        this.categories = await this.getCategories();
      } catch (error) {
        console.error('Failed to load plugins:', error);
      }
    }
  },

  async mounted() {
    await this.loadData();
  }
};
</script>

<style scoped lang="scss">
@import '@/app';

.search-container {
  margin: 8 12;
}

.categories {
  padding: 4 4;
  align-items: flex-start;
}

.section-title {
  padding: 8 16;
  color: $primary-light;
  font-size: $font-size-small;
  font-weight: bold;
  text-transform: uppercase;
  background-color: $surface;
}

.no-plugins {
  padding: 16;
  text-align: center;
  color: $surface-variant;
  font-style: italic;
}
</style>
