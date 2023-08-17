//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

<template>
  <Page actionBarHidden="true" @layoutChanged="onLayoutChanged">
    <RootLayout height="100%" width="100%">
      <AbsoluteLayout class="page">

        <FlexboxLayout
          flexDirection="column"
          left="0"
          top="0"
          width="100%"
          height="100%">

          <label text="" :class="{ hide: !show_top_padding }" :height="status_bar_height+48+12*2" />
          <AppWebView flexGrow="1"></AppWebView>

        </FlexboxLayout>

        <ProgressBar
          left="0"
          top="0"
          width="100%"
        ></ProgressBar>

        <AppBar
          :top="status_bar_height"
        ></AppBar>

      </AbsoluteLayout>
    </RootLayout>
  </Page>
</template>

<script>
  import { Screen } from '@nativescript/core/platform';
  import { getStatusBarHeight, getNavigationBarHeight } from '~/utils/platform'

  import AppWebView from './AppWebView';
  import AppBar from './AppBar';
  import ProgressBar from './ProgressBar';

  import storage from "~/utils/storage"
  import { Manager } from 'lib-iitc-manager'
  import {AndroidApplication, Application} from "@nativescript/core";

  export default {
    data() {
      return {
        status_bar_height: 0,
        navigation_bar_height: 0,
        show_top_padding: false,
        store_unsubscribe: function() {}
      }
    },
    components: { AppWebView, AppBar, ProgressBar },

    computed: {
    },

    methods: {
      onLayoutChanged() {
        this.status_bar_height = getStatusBarHeight();
        this.navigation_bar_height = getNavigationBarHeight();

        this.$store.dispatch('setAppBarWidth', this.getAppBarWidth());
      },
      getAppBarWidth() {
        const screen_width = Screen.mainScreen.widthDIPs;
        const screen_height = Screen.mainScreen.heightDIPs;

        let appbar_width = 0;
        if (screen_width > screen_height) {
          if (screen_width > 600) {
            appbar_width = 500;
          } else {
            appbar_width = screen_width - this.status_bar_height - this.navigation_bar_height;
          }
        } else {
          appbar_width = screen_width;
        }
        return appbar_width
      },


    },

    async created() {
      console.log("IITC create event fired");

      const params = {
        storage: storage,
        message: (message, args) => {
          console.log("Message for user:");
          console.log(message+", args: "+args);
        },
        progressbar: is_show => {
          if (is_show) {
            console.log("Show progress bar");
          } else {
            console.log("Hide progress bar");
          }
        },
        inject_plugin: (p) => {
          this.$store.dispatch('setInjectPlugin', p);
        }
      };
      const manager = new Manager(params);
      manager.run().then();

      if (Application.android) {
        Application.android.on(AndroidApplication.activityBackPressedEvent, (args) => {
          if (!this.$store.state.is_opened_bottom_sheet) {
            this.$store.dispatch('setCurrentPane', 'map');
            args.cancel = true;
          }
        });
      }

      this.store_unsubscribe = this.$store.subscribeAction({
        after: async (action, state) => {
          switch (action.type) {
            case "setIsWebViewLoadFinished":
              if (action.payload) {
                await manager.inject();
              }
              break;
            case "setCurrentPane":
              this.show_top_padding = !["all", "faction", "alerts", "info", "map"].includes(action.payload);
              break;
          }
        }
      });
    },

    onDestroy() {
      this.store_unsubscribe();
    }
  };
</script>

<style scoped lang="scss">
  @import '../app';

  .page {
    background-color: $accent;
  }

  .hide {
    visibility: collapse;
  }
</style>
