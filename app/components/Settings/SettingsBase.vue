//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

<template>
  <Page
    actionBarHidden="true"
    @navigatedTo="onNavigatedTo"
  >
    <GridLayout rows="auto, *">
      <!-- Header -->
      <GridLayout
        row="0"
        columns="auto, *, auto"
        rows="auto"
        class="settings-header"
      >
        <MDButton
          col="0"
          class="fa back-button"
          :text="'fa-arrow-left' | fonticon"
          @tap="goBack"
          variant="flat"
          rippleColor="#ffffff"
          once="true"
        />
        <Label col="1" :text="title" class="settings-header-title" once="true" />
        <slot name="headerRight" col="2"></slot>
      </GridLayout>

      <!-- Content -->
      <ScrollView v-if="useScroll === 'true'" row="1" orientation="vertical" class="settings-content">
        <StackLayout>
          <slot></slot>
        </StackLayout>
      </ScrollView>

      <StackLayout v-else row="1" class="settings-content">
        <slot></slot>
      </StackLayout>
    </GridLayout>
  </Page>
</template>

<script>
import { AndroidApplication, Application, Frame, isAndroid } from "@nativescript/core";

export default {
  name: 'SettingsBase',

  props: {
    title: {
      type: String,
      required: true
    },
    useScroll: {
      type: String,
      required: false,
      default: "true",
    }
  },

  methods: {
    goBack() {
      Frame.topmost().goBack();
    },

    // Forward navigation event to parent component
    onNavigatedTo(event) {
      this.$emit('navigatedTo', event);
    }
  },

  mounted() {
    if (isAndroid) {
      Application.android.on(
        AndroidApplication.activityBackPressedEvent,
        (args) => {
          args.cancel = true;
          this.goBack();
        }
      );
    }
  },
};
</script>

<style scoped lang="scss">
@import '@/app';

.settings-header {
  background-color: $primary;
  height: 56;
  padding: 0 4;
}

.back-button {
  width: 48;
  height: 48;
  padding-top: 13;
  font-size: 18;
  color: white;
  background-color: transparent;
  text-align: center;
}

.settings-header-title {
  color: white;
  font-size: 20;
  font-weight: bold;
  text-align: center;
  vertical-alignment: center;
}

.settings-content {
  background-color: $surface;
}
</style>
