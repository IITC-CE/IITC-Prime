//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

<template>
  <SettingsItem
    :title="title"
    :description="description"
    @tap="onTap"
  >
    <Label
      slot="right"
      class="fa settings-nav-icon"
      :text="'fa-chevron-right' | fonticon"
    />
  </SettingsItem>
</template>

<script>
import SettingsItem from './SettingsItem';

export default {
  name: 'SettingsNavItem',

  components: {
    SettingsItem
  },

  props: {
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: null
    },
    targetScreen: {
      type: Object,
      required: true
    },
    props: {
      type: Object,
      default: () => ({})
    }
  },

  methods: {
    onTap() {
      this.$navigateTo(this.targetScreen, {
        props: this.props,
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

.settings-nav-icon {
  color: $surface-variant;
  font-size: 16;
  margin-right: 4;
  vertical-alignment: center;
}
</style>
