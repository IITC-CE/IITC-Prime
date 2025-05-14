//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

<template>
  <Page actionBarHidden="true">
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
        />
        <Label col="1" :text="title" class="settings-header-title" />
        <slot name="headerRight" col="2"></slot>
      </GridLayout>

      <!-- Content -->
      <ScrollView row="1" orientation="vertical" class="settings-content">
        <StackLayout>
          <slot></slot>
        </StackLayout>
      </ScrollView>
    </GridLayout>
  </Page>
</template>

<script>
export default {
  name: 'SettingsBase',

  props: {
    title: {
      type: String,
      required: true
    }
  },

  methods: {
    goBack() {
      this.$navigateBack({
        animated: true,
        transition: {
          name: 'slideRight',
          duration: 300
        }
      });
    }
  }
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
