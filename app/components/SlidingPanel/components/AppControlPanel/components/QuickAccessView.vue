//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

<template>
  <FlexboxLayout
    flexDirection="column"
  >

    <GridLayout
      columns="*, *, *, *"
      class="block"
    >
      <QuickAccessBigButton
        col="0"
        icon="fa-tools"
        name="Settings"
        @tap="openSettings"
      />
      <QuickAccessBigButton
        col="1"
        icon="fa-toolbox"
        name="Plugins"
      />
      <QuickAccessBigButton
        col="2"
        icon="fa-terminal"
        name="Debug"
        @tap="toggleDebugMode"
        :active="isDebugActive"
      />
      <QuickAccessBigButton
        col="3"
        icon="fa-redo"
        name="Reload IITC"
        @tap="reloadWebView"
      />
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
  import QuickAccessBigButton from './QuickAccessBigButton.vue';
  import SettingsView from '@/components/Settings/SettingsView';

  export default {
    data() {
      return {
        settingsScreen: SettingsView
      }
    },

    components: { QuickAccessBigButton },

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
