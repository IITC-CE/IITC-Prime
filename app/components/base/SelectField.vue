// Copyright (C) 2025-2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <GridLayout
    columns="*, auto"
    class="list-item select-field"
    v-on="pressFeedback"
    @tap="showSelectDialog"
  >
    <Label
      col="0"
      :text="selectedText"
      class="list-item-title select-text"
      verticalAlignment="center"
      textWrap="true"
    />
    <template v-if="isIOS">
      <!-- MenuButton draws the indicator in this column -->
      <ContentView col="1" class="select-icon" />
      <MenuButton
        colSpan="2"
        :items="itemTexts"
        :selectedIndex="currentSelectedIndex"
        @select="({ index }) => selectIndex(index)"
      />
    </template>
    <!-- Material 3 exposed dropdown menus use this icon -->
    <Label
      v-else
      col="1"
      :text="$filters.fonticon('ms-arrow-drop-down')"
      class="ms select-icon select-icon--android"
      verticalAlignment="center"
    />
  </GridLayout>
</template>

<script>
import { isIOS } from '@nativescript/core';
import { RadioDialog } from 'nativescript-radio-dialog';
import { pressFeedback } from '@/utils/platform/ui';

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
      isIOS,
      pressFeedback,
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
    itemTexts() {
      return this.items.map(item => this.getItemText(item));
    },

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
        const options = {
          title: this.title,
          items: this.itemTexts,
          selectedIndex: this.currentSelectedIndex >= 0 ? this.currentSelectedIndex : undefined,
          cancelButtonText: this.immediateChange ? this.$L('dialog.ok') : this.$L('dialog.cancel'),
        };

        if (this.immediateChange) {
          options.onItemSelect = ({ selectedIndex }) => this.selectIndex(selectedIndex);
        }

        const result = await RadioDialog.show(options);

        // liveSelection: onItemSelect already handled each tap; Promise resolves cancelled on Android
        if (!this.immediateChange && !result.cancelled) this.selectIndex(result.selectedIndex);
      } catch (error) {
        console.error('Error showing dialog:', error);
      }
    },

    selectIndex(selectedIndex) {
      if (selectedIndex === undefined || selectedIndex === this.currentSelectedIndex) return;
      this.currentSelectedIndex = selectedIndex;
      const item = this.items[selectedIndex];
      this.$emit('change', { selectedIndex, selectedId: this.getItemId(item), item });
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

// Fits the layers tab, where the field takes half a row
.select-field--compact .select-text {
  font-size: $font-size;
}

.select-icon {
  width: $icon-size;
}

.select-icon--android {
  font-size: $icon-size;
  text-align: center;
  color: $accent;
}
</style>
