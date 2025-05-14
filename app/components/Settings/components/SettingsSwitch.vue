//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

<template>
  <SettingsItem :title="title" :description="description">
    <Switch
      slot="right"
      :checked="value"
      @checkedChange="onChange"
      />
  </SettingsItem>
</template>

<script>
import SettingsItem from './SettingsItem';

export default {
  name: 'SettingsSwitch',

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
    value: {
      type: Boolean,
      default: false
    }
  },

  methods: {
    onChange(args) {
      this.$emit('change', args.value);
    }
  }
};
</script>
