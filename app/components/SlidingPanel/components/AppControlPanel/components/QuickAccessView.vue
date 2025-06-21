//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

<template>
  <FlexboxLayout
    flexDirection="column"
  >

    <GridLayout
      columns="*, *, *, *"
      class="block"
    >
      <!-- Settings Button -->
      <FlexboxLayout
        col="0"
        flexDirection="column"
        alignItems="center"
        class="btn"
        @tap="openSettings"
      >
        <Label class="fa icon" :text="'fa-tools' | fonticon" />
        <Label class="text" text="Settings" />
      </FlexboxLayout>

      <!-- Plugins Button -->
      <FlexboxLayout
        col="1"
        flexDirection="column"
        alignItems="center"
        class="btn"
        @tap="openPlugins"
      >
        <Label class="fa icon" :text="'fa-toolbox' | fonticon" />
        <Label class="text" text="Plugins" />
      </FlexboxLayout>

      <!-- Debug Button -->
      <FlexboxLayout
        col="2"
        flexDirection="column"
        alignItems="center"
        class="btn"
        :class="{ 'active': isDebugActive }"
        @tap="toggleDebugMode"
      >
        <Label class="fa icon" :class="{ 'active-icon': isDebugActive }" :text="'fa-terminal' | fonticon" />
        <Label class="text" :class="{ 'active-text': isDebugActive }" text="Debug" />
      </FlexboxLayout>

      <!-- Reload Button -->
      <FlexboxLayout
        col="3"
        flexDirection="column"
        alignItems="center"
        class="btn"
        @tap="reloadWebView"
      >
        <Label class="fa icon" :text="'fa-redo' | fonticon" />
        <Label class="text" text="Reload IITC" />
      </FlexboxLayout>
    </GridLayout>

    <GridLayout
      v-for="(pane, index) in filteredPanes"
      :key="pane.name"
      class="list-item"
      columns="auto, *"
      rows="50"
      @tap="switchToPane(pane.name)"
    >
      <Label class="fa icon" :text="pane.icon | fonticon" col="0" :row="index" />
      <Label class="pane-item-label" :text="pane.label" col="1" :row="index" />
    </GridLayout>

  </FlexboxLayout>
</template>

<script>
  import { mapState } from 'vuex';
  import SettingsView from '@/components/Settings/SettingsView';
  import PluginsView from '@/components/Settings/PluginsView';

  export default {
    data() {
      return {
        settingsScreen: SettingsView,
        pluginsScreen: PluginsView,
      }
    },

    computed: {
      ...mapState({
        panes: state => state.navigation.panes,
        isDebugActive: state => state.ui.isDebugActive
      }),

      filteredPanes() {
        const START_EXCLUDE = 3;
        const END_EXCLUDE = 5;
        return this.panes.filter((_, index) => index < START_EXCLUDE || index >= END_EXCLUDE);
      },
    },

    methods: {
      openSettings() {
        this.$navigateTo(this.settingsScreen, {
          animated: true,
          transition: {
            name: 'slideLeft',
            duration: 300
          }
        });
      },
      reloadWebView() {
        this.$store.dispatch('ui/reloadWebView');
      },
      switchToPane(name) {
        this.$store.dispatch('navigation/setCurrentPane', name);
      },
      toggleDebugMode() {
        this.$store.dispatch('ui/toggleDebugMode');
      },
      openPlugins() {
        this.$navigateTo(this.pluginsScreen, {
          animated: true,
          transition: {
            name: 'slideLeft',
            duration: 300
          }
        });
      }
    }
  };
</script>

<style scoped lang="scss">
  @import '@/app';

  .block {
    height: 80;
    margin-bottom: $spacing-m;
  }

  .btn {
    font-size: $font-size;
    text-align: center;
    padding: 0 $spacing-s;

    &.active {
      opacity: 0.9;
    }
  }

  .btn .icon {
    margin: 0 0 $spacing-xs 0;
    width: 54;
    height: 54;
    font-size: $font-size-headline;
    border-radius: $radius-large;
    color: $on-primary;
    background-color: $surface-bright;
    box-shadow: 0 2 4 rgba(0, 0, 0, 0.05);

    &.active-icon {
      background-color: $primary;
      color: $on-primary;
    }
  }

  .btn .text {
    &.active-text {
      color: $primary;
      font-weight: bold;
    }
  }

  .icon {
    font-size: 18;
    width: 24;
    vertical-align: center;
    text-align: center;
  }

  .pane-item-label {
    font-size: $font-size;
    padding: 15;
  }

</style>
