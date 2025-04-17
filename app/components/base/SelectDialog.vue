//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

<template>
  <Page @shownModally="onShownModally" margin="0" class="dialog-page">
    <StackLayout class="dialog-container">
      <!-- Header -->
      <StackLayout class="dialog-header">
        <Label class="dialog-title" :text="title" />
      </StackLayout>

      <!-- Divider (spans full width) -->
      <StackLayout class="dialog-divider" />

      <!-- List of items with radio buttons -->
      <ListView
        class="dialog-list"
        :items="items"
        ref="listView"
        separatorColor="#00000000"
        :height="getListHeight"
      >
        <v-template>
          <GridLayout columns="auto, *" rows="auto" class="dialog-item" @tap="onItemTap(item, $index)">
            <!-- Radio button using CheckBox with boxType="circle" -->
            <CheckBox
              col="0"
              :checked="selectedIndex === $index"
              @checkedChange="onCheckBoxChange($index, $event)"
              boxType="circle"
              fillColor="#56b0b9"
              class="radio-button"
            />

            <!-- Item text -->
            <Label
              col="1"
              :text="getItemText(item)"
              class="dialog-item-text"
              verticalAlignment="center"
              textWrap="true"
            />
          </GridLayout>
        </v-template>
      </ListView>

      <!-- Divider (spans full width) -->
      <StackLayout class="dialog-divider" />

      <!-- Action buttons -->
      <StackLayout class="dialog-actions">
        <MDButton
          text="ОК"
          variant="text"
          class="btn-text"
          rippleColor="#ffffff"
          @tap="onClose"
        />
      </StackLayout>
    </StackLayout>
  </Page>
</template>

<script>
import { MDButton } from '@nativescript-community/ui-material-button';

export default {
  name: 'MaterialSelectDialog',

  components: {
    MDButton
  },

  props: {
    // Items array to display in the dialog
    items: {
      type: Array,
      required: true
    },
    // Dialog title
    title: {
      type: String,
      default: 'Select an item'
    },
    // Index of the initially selected item
    initialSelectedIndex: {
      type: Number,
      default: -1
    },
    // Property id for object arrays
    idField: {
      type: String,
      default: null
    },
    // Property name to display for object arrays
    textField: {
      type: String,
      default: null
    },
    // Callback for selection change
    onSelectionChange: {
      type: Function,
      default: null
    }
  },

  data() {
    return {
      selectedIndex: this.initialSelectedIndex,
      modalPage: null
    };
  },

  computed: {
    /**
     * Calculate appropriate ListView height based on number of items
     * Maximum is 500, minimum is 150
     */
    getListHeight() {
      if (!this.items) return 200;

      // Each item is approximately 56 units tall
      const estimatedHeight = Math.min(500, Math.max(150, this.items.length * 56));
      return estimatedHeight;
    }
  },

  methods: {
    /**
     * Store reference to modal page when shown
     */
    onShownModally(args) {
      this.modalPage = args.object;
    },

    /**
     * Gets id for an item based on idField prop
     */
    getItemId(item) {
      if (this.idField && typeof item === 'object') {
        return item[this.idField];
      }
      return item;
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
     * Handle tap on the entire row
     */
    onItemTap(item, index) {
      this.selectItem(index);
    },

    /**
     * Handle checkbox change event directly
     */
    onCheckBoxChange(index, event) {
      // Only process if checked (to avoid double events)
      if (event.value) {
        this.selectItem(index);
      } else {
        // Re-check the item if unchecked (radio button behavior)
        this.forceListViewRefresh();
      }
    },

    /**
     * Select item, force update the ListView and also calls the selection callback if provided
     */
    selectItem(index) {
      if (index < 0 || index >= this.items.length) {
        return; // Ignore invalid indices
      }

      this.selectedIndex = index;
      const item = this.items[index];
      const id = this.getItemId(item);

      // Call the selection change callback if provided
      if (this.onSelectionChange && typeof this.onSelectionChange === 'function') {
        this.onSelectionChange({
          selectedIndex: index,
          selectedId: id,
          item: item
        });
      }

      // Force refresh ListView to update UI
      this.forceListViewRefresh();
    },

    /**
     * Force ListView to refresh its items
     */
    forceListViewRefresh() {
      if (this.$refs.listView && this.$refs.listView.nativeView) {
        const listView = this.$refs.listView.nativeView;
        requestAnimationFrame(() => {
          listView.refresh();
        });
      }
    },

    /**
     * Close dialog
     */
    onClose() {
      if (this.modalPage) {
        this.modalPage.closeModal();
      }
    }
  }
};
</script>

<style scoped lang="scss">
@import '@/app';

.dialog-page {
  height: 100%;
  width: 100%;
  background-color: $surface-bright;
}

.dialog-container {
  background-color: $surface-bright;
  width: 100%;
  height: auto;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.dialog-header {
  padding: $spacing-l $spacing-l $spacing-s $spacing-l;
}

.dialog-title {
  color: $on-surface;
  font-size: $font-size-headline;
  font-weight: bold;
}

.dialog-divider {
  height: 1;
  background-color: $surface-variant;
  width: 100%;
}

.dialog-list {
  background-color: transparent;
}

.dialog-item {
  padding: $spacing-xs $spacing-m;
  margin: 0;
  height: auto;
  border-radius: $radius-small;
}

.dialog-item:active {
  background-color: $state-pressed;
}

.radio-button {
  margin-right: 0;
  vertical-alignment: center;
}

.dialog-item-text {
  color: $on-surface;
  font-size: $font-size;
  vertical-alignment: center;
}

.dialog-actions {
  padding: $spacing-s $spacing-s $spacing-s 0;
  horizontal-alignment: right;
}

.btn-text {
  margin: $spacing-s $spacing-m;
  color: $on-surface;
  min-width: 64;
  height: 36;
  font-weight: bold;
  font-size: $font-size;
}
</style>
