// Copyright (C) 2025 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <StackLayout class="controls-container">
    <!-- Controls panel -->
    <GridLayout
      row="0"
      class="controls-panel"
      columns="auto, *, auto, auto, auto">

      <MDRipple
        col="0"
        class="control-button"
        @tap="handleClose"
      >
        <Label
          class="fa"
          :text="$filters.fonticon('fa-arrow-left')"
        />
      </MDRipple>
      <MDRipple
        col="2"
        class="control-button trash"
        @tap="$emit('clear')"
      >
        <Label
          class="fa"
          :text="$filters.fonticon('fa-trash')"
        />
      </MDRipple>
      <MDRipple
        col="3"
        class="control-button"
        @tap="navigateHistoryUp"
      >
        <Label
          class="fa"
          :text="$filters.fonticon('fa-arrow-up')"
        />
      </MDRipple>
      <MDRipple
        col="4"
        class="control-button"
        @tap="navigateHistoryDown"
      >
        <Label
          class="fa"
          :text="$filters.fonticon('fa-arrow-down')"
        />
      </MDRipple>
    </GridLayout>

    <!-- Command input -->
    <GridLayout row="1" columns="*, auto" class="command-input-container">
      <TextView
        ref="commandInput"
        col="0"
        class="command-input"
        v-model="commandText"
        @returnPress="executeCommand"
        hint="Enter JavaScript command..."
        autocorrect="false"
        maxLines="10"
      />
      <MDRipple
        col="1"
        class="btn-primary send-button"
        @tap="executeCommand"
      >
        <Label
          class="fa"
          :text="$filters.fonticon('fa-paper-plane')"
        />
      </MDRipple>
    </GridLayout>
  </StackLayout>
</template>

<script>
export default {
  props: {
    command: {
      type: String,
      default: ''
    },
    commandHistory: {
      type: Array,
      default: () => []
    },
    historyPosition: {
      type: Number,
      default: -1
    }
  },

  data() {
    return {
      commandText: ''
    }
  },

  watch: {
    command(newVal) {
      this.commandText = newVal;
    },
    commandText(newVal) {
      this.$emit('update:command', newVal);
    }
  },

  methods: {
    // Execute command and emit result to parent
    executeCommand() {
      if (!this.commandText || this.commandText.trim() === '') return;

      // Get the command text
      const cmdString = this.commandText;

      // Clear the input field
      this.commandText = '';

      // Emit the command to parent component
      this.$emit('command-executed', cmdString);
    },

    // Navigate up through command history using Vuex
    navigateHistoryUp() {
      this.$emit('history-navigate', { direction: 1, currentCommand: this.commandText });
    },

    // Navigate down through command history using Vuex
    navigateHistoryDown() {
      this.$emit('history-navigate', { direction: -1, currentCommand: this.commandText });
    },

    // Handle close button and reset state
    handleClose() {
      this.$emit('close');
    },

    // Focus on the command input field
    focusInput() {
      if (this.$refs.commandInput && this.$refs.commandInput.nativeView) {
        this.$refs.commandInput.nativeView.focus();
      }
    },

    // Remove focus from the command input field (closes keyboard)
    blurInput() {
      if (this.$refs.commandInput && this.$refs.commandInput.nativeView) {
        this.$refs.commandInput.nativeView.dismissSoftInput();
      }
    }
  }
}
</script>

<style scoped lang="scss">
@import '@/app';

.controls-container {
  width: 100%;
}

.controls-panel {
  background-color: rgba(0, 0, 0, 0.2);
  padding: $spacing-s $spacing-m;
  margin: 0 -4;
}

.control-button {
  font-size: 16;
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 4;
  margin: 0 $spacing-xs;
  padding: 0;
  height: 40;
  min-width: 40;
  width: 40;
  text-align: center;
  vertical-align: center;
  ripple-color: $ripple;
}

.control-button.trash {
  margin-right: $spacing-l;
  ripple-color: rgba(255, 0, 0, 0.3);
}

.command-input-container {
  background-color: rgba(0, 0, 0, 0.3);
  padding: $spacing-s $spacing-m $spacing-m $spacing-m;
}

.command-input {
  width: 100%;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: $radius-small;
  padding: $spacing-s;
  font-family: monospace;
  font-size: 14;
  height: auto;
  min-height: 40;
  max-height: 100;
  color: #ffffff;
  placeholder-color: #aaaaaa;
}

.send-button {
  background-color: $primary;
  color: white;
  margin-left: $spacing-s;
  font-size: 16;
  height: 40;
  width: 50;
  padding: 0 3 0 0;
  vertical-align: center;
  text-align: center;
}
</style>
