//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

<template>
  <FlexboxLayout
    flexDirection="column"
  >

    <GridLayout
      columns="*, *, *, *"
      class="block"
    >
      <QuickAccessBigButton col="0" icon="fa-tools" name="Settings" />
      <QuickAccessBigButton col="1" icon="fa-toolbox" name="Plugins" />
      <QuickAccessBigButton col="2" icon="fa-terminal" name="Debug" />
      <QuickAccessBigButton col="3" icon="fa-redo" name="Reload IITC" @tap="reloadWebView" />
    </GridLayout>

    <Label class="separator" />

    <GridLayout
      columns="auto, *, auto, *, auto, *"
      rows="50"
      class="chat-buttons"
    >
      <template v-for="(pane, index) in topPanes">
        <Label class="fa chat-icon"
               :text="pane.icon | fonticon"
               :col="index * 2"
               @tap="switchToPane(pane.name)" />
        <Label class="chat-label"
               :text="pane.label"
               :col="index * 2 + 1"
               @tap="switchToPane(pane.name)" />
      </template>
    </GridLayout>

    <Label v-if="remainingPanes.length > 0" class="separator" />

    <GridLayout
      class="pane_item"
      columns="auto, *"
      rows="50"
      v-for="(pane, index) in remainingPanes"
      :key="pane.name"
      @tap="switchToPane(pane.name)"
    >
      <Label class="fa icon" :text="pane.icon | fonticon" col="0" :row="index" />
      <Label class="pane_item_label" :text="pane.label" col="1" :row="index" />
    </GridLayout>

  </FlexboxLayout>
</template>

<script>
  import QuickAccessBigButton from './QuickAccessBigButton.vue';
  import { mapState } from 'vuex';

  export default {
    data() {
      return {
      }
    },

    components: { QuickAccessBigButton },

    computed: {
      ...mapState({
        panes: state => state.navigation.panes,
      }),

      // First 3 panes for chat buttons in one row
      topPanes() {
        return this.panes.slice(0, 3);
      },

      // Remaining panes for plugin panels as a list
      remainingPanes() {
        return this.panes.slice(5);
      }
    },

    methods: {
      reloadWebView() {
        this.$store.dispatch('ui/reloadWebView');
      },
      switchToPane(name) {
        this.$store.dispatch('navigation/setCurrentPane', name);
      }
    }
  };
</script>

<style scoped lang="scss">
  @import '@/app';

  .separator {
    width: 100%;
    height: 5;
    margin: 10 0;
    background-color: $surface-dim;
  }

  .block {
    height: 80;
  }

  .pane_item {
    border-bottom-width: 1;
    border-bottom-color: $surface-dim;
  }

  .icon {
    font-size: 18;
    width: 24;
    vertical-align: center;
    text-align: center;
    margin-left: 10;
  }

  .pane_item_label {
    font-size: $font-size;
    padding: 15;
  }

  .chat-buttons {
    border-bottom-width: 1;
    border-bottom-color: $surface-dim;
  }

  .chat-icon {
    font-size: 18;
    width: 24;
    vertical-align: center;
    text-align: center;
    margin-left: 10;
  }

  .chat-label {
    font-size: $font-size;
    padding: 15;
    vertical-align: center;
  }
</style>
