//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

<template>
  <GridLayout columns="*, auto" class="btn-primary select-field" @tap="showSelectDialog">
    <Label col="0" :text="selectedText" class="select-text" verticalAlignment="center" />
    <Label col="1" text="▼" class="select-icon" verticalAlignment="center" />
  </GridLayout>
</template>

<script>
import SelectDialog from '@/components/base/SelectDialog';

export default {
  props: {
    // Array of items to display in selector
    items: {
      type: Array,
      required: true
    },
    // Index of the currently selected item
    selectedIndex: {
      type: Number,
      default: 0
    },
    // For object arrays: property item id
    idField: {
      type: String,
      default: null
    },
    // For object arrays: property name to display
    textField: {
      type: String,
      default: null
    },
    // Title for the dialog
    title: {
      type: String,
      default: 'Select an item'
    }
  },

  data() {
    return {
      currentSelectedIndex: this.selectedIndex
    };
  },

  watch: {
    // Watch for changes to the selectedIndex prop
    selectedIndex(newVal) {
      this.currentSelectedIndex = newVal;
    }
  },

  computed: {
    /**
     * Returns the text to display in the selector
     */
    selectedText() {
      if (!this.items || this.items.length === 0) return 'No elements';
      if (this.currentSelectedIndex < 0 || this.currentSelectedIndex >= this.items.length) return 'Select...';

      const item = this.items[this.currentSelectedIndex];
      return this.getItemText(item);
    }
  },

  methods: {
    /**
     * Shows the selection dialog
     */
    async showSelectDialog() {
      try {
        // Create modal options with callback for selection change
        const options = {
          props: {
            items: this.items,
            title: this.title,
            initialSelectedIndex: this.currentSelectedIndex,
            idField: this.idField,
            textField: this.textField,
            onSelectionChange: this.onSelectionChanged
          },
          fullscreen: false,
          animated: true,
          stretched: false,
          android: {
            cancelable: true
          },
          ios: {
            presentationStyle: 2 // UIModalPresentationStyle.OverFullScreen
          }
        };

        // Show modal dialog (no need to wait for result)
        this.$showModal(SelectDialog, options);
      } catch (error) {
        console.error("Error showing dialog:", error);
      }
    },

    /**
     * Handles selection changes from the dialog
     */
    onSelectionChanged(args) {
      // Update the local currentSelectedIndex if changed
      if (args.selectedIndex !== undefined && args.selectedIndex !== this.currentSelectedIndex) {
        this.currentSelectedIndex = args.selectedIndex;

        // Emit change event
        this.$emit('change', {
          selectedIndex: args.selectedIndex,
          selectedId: args.selectedId,
          item: args.item
        });
      }
    },

    /**
     * Gets the display text for an item based on textField prop
     */
    getItemText(item) {
      if (this.textField && typeof item === 'object') {
        return item[this.textField] || 'Undefined';
      }
      return String(item);
    }
  }
}
</script>

<style scoped lang="scss">
@import '@/app';

.select-field {
  height: 52;
}

.select-field:active {
  background-color: $state-pressed;
}

.select-text {
  color: $on-surface;
  font-size: $font-size;
  text-overflow: ellipsis;
}

.select-icon {
  width: 18;
  font-size: 14;
  text-align: center;
  color: $primary-light;
}
</style>
