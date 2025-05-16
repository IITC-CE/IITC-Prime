//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

<template>
  <StackLayout class="update-interval-container">
    <Label text="External plugins update frequency:" class="interval-label" />
    <SelectField
      :items="updateIntervals"
      :selectedIndex="selectedIntervalIndex"
      title="Select Update Interval"
      textField="name"
      idField="value"
      @change="onIntervalSelected"
    />
  </StackLayout>
</template>

<script>
import SelectField from '@/components/base/SelectField';

export default {
  name: 'ExternalPluginsIntervalSelector',

  components: {
    SelectField
  },

  props: {
    selectedInterval: {
      type: String,
      default: '86400'
    }
  },

  data() {
    return {
      updateIntervals: [
        { name: 'Every 6 hours', value: '21600' },
        { name: 'Every 12 hours', value: '43200' },
        { name: 'Every day', value: '86400' },
        { name: 'Every week', value: '604800' }
      ]
    };
  },

  computed: {
    selectedIntervalIndex() {
      return this.updateIntervals.findIndex(
        item => item.value === this.selectedInterval
      );
    }
  },

  methods: {
    onIntervalSelected(args) {
      if (!args.selectedId) return;
      this.$emit('intervalSelected', args.selectedId);
    }
  }
};
</script>

<style scoped lang="scss">
@import '@/app';

.update-interval-container {
  margin: 8 16;
}

.interval-label {
  margin-bottom: 8;
  font-size: 14;
}
</style>
