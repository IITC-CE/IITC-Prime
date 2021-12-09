//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

<template>
  <Page actionBarHidden="true" @layoutChanged="onLayoutChanged">
    <RootLayout height="100%" width="100%">
      <AbsoluteLayout class="page">

        <AppWebView
          left="0"
          top="0"
          width="100%"
          height="100%"
        ></AppWebView>

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

  import { runExtension } from '~/background/manager'

  export default {
    data() {
      return {
        status_bar_height: 0,
        navigation_bar_height: 0
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

    created() {
      console.log("IITC create event fired");
      runExtension().then(() => {});
    },
  };
</script>

<style scoped lang="scss">
  @import '../app';

  .page {
    background-color: $accent;
  }
</style>
