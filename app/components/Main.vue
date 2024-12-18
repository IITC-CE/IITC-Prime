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

          <AppWebView flexGrow="1" @show-popup="showPopup"></AppWebView>
          <label text="" :height="webviewBottomPadding" />

        </FlexboxLayout>

        <ProgressBar
          left="0"
          top="0"
          width="100%"
        />

        <SlidingPanel
          top="0"
          left="0"
          width="100%"
          height="100%"
        />

        <PopupWebView
          v-if="isShowPopup"
          :url="popupUrl"
          :transport="popupTransport"
          @close="closePopup"
        />
      </AbsoluteLayout>
    </RootLayout>
  </Page>
</template>

<script>
  import { Screen } from '@nativescript/core/platform';
  import { getStatusBarHeight, getNavigationBarHeight } from '~/utils/platform'
  import { AndroidApplication, Application } from "@nativescript/core";

  import AppWebView from './AppWebView';
  import ProgressBar from './ProgressBar';
  import SlidingPanel from './SlidingPanel/SlidingPanel.vue';
  import PopupWebView from './PopupWebView.vue';

  import storage from "~/utils/storage"
  import { Manager } from 'lib-iitc-manager'

  export default {
    data() {
      return {
        status_bar_height: 0,
        navigation_bar_height: 0,
        webviewBottomPadding: 100,
        store_unsubscribe: function() {},
        isShowPopup: false,
        popupUrl: null,
        popupTransport: null,
      }
    },

    components: {
      AppWebView,
      ProgressBar,
      SlidingPanel,
      PopupWebView
    },

    methods: {
      async onLayoutChanged() {
        this.status_bar_height = getStatusBarHeight();
        this.navigation_bar_height = getNavigationBarHeight();

        const screen_width = Screen.mainScreen.widthDIPs;
        const screen_height = Screen.mainScreen.heightDIPs;

        if (screen_width > screen_height) {
          this.webviewBottomPadding = screen_width > 600 ? 0 : 100;
        } else {
          this.webviewBottomPadding = 100;
        }

        await this.$store.dispatch('setSlidingPanelWidth', this.getSlidingPanelWidth());
        await this.$store.dispatch('setScreenHeight', Screen.mainScreen.heightDIPs - this.status_bar_height);
      },

      getSlidingPanelWidth() {
        const screen_width = Screen.mainScreen.widthDIPs;
        const screen_height = Screen.mainScreen.heightDIPs;

        let sliding_panel_width = 0;
        if (screen_width > screen_height) {
          if (screen_width > 600) {
            sliding_panel_width = 500;
          } else {
            sliding_panel_width = screen_width - this.navigation_bar_height;
          }
        } else {
          sliding_panel_width = screen_width;
        }
        return sliding_panel_width
      },

      showPopup(data) {
        this.popupUrl = data.url || null;
        this.popupTransport = data.transport || null;
        this.isShowPopup = true;
      },

      closePopup() {
        this.isShowPopup = false;
        this.popupUrl = null;
        this.popupTransport = null;
      },
    },

    computed: {
      webviewBottomPadding() {
        console.log('compute ', Screen.mainScreen.widthDIPs);
        return Screen.mainScreen.widthDIPs > 600 ? 0 : 100;
      }
    },

    async created() {
      console.log("IITC create event fired");
      await this.$store.dispatch('setScreenHeight', Screen.mainScreen.heightDIPs);

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
