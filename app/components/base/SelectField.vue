// Copyright (C) 2025-2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <GridLayout columns="*, auto" class="list-item select-field" @tap="showSelectDialog">
    <Label col="0" :text="selectedText" class="select-text" verticalAlignment="center" />
    <Label col="1" text="▼" class="select-icon" verticalAlignment="center" />
  </GridLayout>
</template>

<script>
import { RadioDialog } from 'nativescript-radio-dialog';

export default {
  props: {
    // Array of items to display in selector
    items: {
      type: Array,
      required: true,
    },
    // Index of the currently selected item
    selectedIndex: {
      type: Number,
      default: 0,
    },
    // For object arrays: property item id
    idField: {
      type: String,
      default: null,
    },
    // For object arrays: property name to display
    textField: {
      type: String,
      default: null,
    },
    // Title for the dialog
    title: {
      type: String,
      default: '',
    },
    // Emit change immediately on each tap without waiting for dialog confirmation
    immediateChange: {
      type: Boolean,
      default: false,
    },
  },

  data() {
    return {
      currentSelectedIndex: this.selectedIndex,
    };
  },

  watch: {
    // Watch for changes to the selectedIndex prop
    selectedIndex(newVal) {
      this.currentSelectedIndex = newVal;
    },
  },

  computed: {
    /**
     * Returns the text to display in the selector
     */
    selectedText() {
      if (!this.items || this.items.length === 0) return this.$L('select_field.no_elements');
      if (this.currentSelectedIndex < 0 || this.currentSelectedIndex >= this.items.length)
        return this.$L('select_field.select');

      const item = this.items[this.currentSelectedIndex];
      return this.getItemText(item);
    },
  },

  methods: {
    /**
     * Shows the selection dialog
     */
    async showSelectDialog() {
      try {
        // Convert items to string array for radio dialog
        const dialogItems = this.items.map(item => this.getItemText(item));

        const options = {
          title: this.title,
          items: dialogItems,
          selectedIndex: this.currentSelectedIndex >= 0 ? this.currentSelectedIndex : undefined,
          cancelButtonText: this.immediateChange ? this.$L('dialog.ok') : this.$L('dialog.cancel'),
        };

        if (this.immediateChange) {
          options.onItemSelect = ({ selectedIndex }) => {
            this.onSelectionChanged({
              selectedIndex,
              selectedId: this.getItemId(this.items[selectedIndex]),
              item: this.items[selectedIndex],
            });
          };
        }

        const result = await RadioDialog.show(options);

        // liveSelection: onItemSelect already handled each tap; Promise resolves cancelled on Android
        if (!this.immediateChange && !result.cancelled) {
          this.onSelectionChanged({
            selectedIndex: result.selectedIndex,
            selectedId: this.getItemId(this.items[result.selectedIndex]),
            item: this.items[result.selectedIndex],
          });
        }
      } catch (error) {
        console.error('Error showing dialog:', error);
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
          item: args.item,
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
    },

    /**
     * Gets the ID for an item based on idField prop
     */
    getItemId(item) {
      if (this.idField && typeof item === 'object') {
        return item[this.idField];
      }
      return item;
    },
  },
};
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
  width: 24;
  font-size: 14;
  text-align: center;
  color: $accent;
}
</style>
