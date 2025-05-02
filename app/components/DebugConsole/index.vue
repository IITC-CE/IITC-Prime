//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

<template>
  <GridLayout rows="*, auto, auto" class="debug-console">
    <!-- Logs list -->
    <CollectionView
      ref="logsList"
      row="0"
      class="logs-list"
      :items="displayLogs"
      @scroll="handleScroll"
      @scrollEnd="handleScrollEnd"
    >
      <v-template>
        <StackLayout
          class="log-item"
          :class="'log-' + item.type"
          @touch="onLogTouch($event)"
          @longPress="copyLogToClipboard(item)"
        >
          <!-- Header row with timestamp, log level and source -->
          <Label :text="formatLogHeader(item)" class="log-header" once="true" />

          <!-- Message content -->
          <Label :text="item.message" textWrap="true" class="log-message" once="true" />
        </StackLayout>
      </v-template>
    </CollectionView>

    <!-- Controls panel -->
    <GridLayout row="1" columns="auto, *, auto, auto" class="controls-panel">
      <Button col="0" class="control-button" text="Clear" @tap="clearLogs" />
      <Label col="1" />
      <Button col="2" class="control-button" text="↑" @tap="navigateHistoryUp" />
      <Button col="3" class="control-button" text="↓" @tap="navigateHistoryDown" />
    </GridLayout>

    <!-- Command input -->
    <GridLayout row="2" columns="*, auto" class="command-input-container">
      <TextView
        ref="commandInput"
        col="0"
        class="command-input"
        v-model="command"
        @returnPress="executeCommand"
        hint="Enter JavaScript command..."
      />
      <Button col="1" class="send-button" text="Send" @tap="executeCommand" />
    </GridLayout>

    <Button
      v-show="!isAtBottom && showControls"
      class="scroll-bottom-button"
      text="↓"
      @tap="scrollToBottom"
    />
  </GridLayout>
</template>

<script>
import { mapState, mapActions } from 'vuex';
import logFormattingMixin from './mixins/logFormatting';
import touchInteractionMixin from './mixins/touchInteraction';
import clipboardUtilsMixin from './mixins/clipboardUtils';

export default {
  mixins: [
    logFormattingMixin,
    touchInteractionMixin,
    clipboardUtilsMixin
  ],

  props: {
    isVisible: {
      type: Boolean,
      default: false
    },
    isKeyboardOpen: {
      type: Boolean,
      default: false
    }
  },

  data() {
    return {
      command: '',
      isAtBottom: true,
      scrollTimeout: null,
      showControls: false, // Controls UI elements visibility
      logsVisible: false,  // Controls whether logs should be shown or not
    }
  },

  computed: {
    ...mapState({
      logs: state => state.debug.logs,
      commandHistory: state => state.debug.commandHistory,
      historyPosition: state => state.debug.historyPosition
    }),

    // Display logs only when both component is visible and logs should be shown
    displayLogs() {
      if (this.isVisible && this.logsVisible) {
        return this.logs.map((log, index) => ({ ...log, index }));
      }
      return [];
    }
  },

  watch: {
    isVisible(newValue) {
      if (newValue) {
        this.showControls = true;
        this.logsVisible = false;

        this.$nextTick(() => {
          if (this.$refs.commandInput && this.$refs.commandInput.nativeView) {
            this.$refs.commandInput.nativeView.focus();
          }
        });

        // Add logs with delay to prevent UI freezing
        setTimeout(() => {
          this.logsVisible = true;
        }, 10);
      } else {
        // Console being hidden
        this.logsVisible = false;
        this.showControls = false;

        // Clean up any active highlights when console is hidden
        this.resetTouchState();
      }
    },

    // When logs change and console is visible, update and scroll
    displayLogs(newLogs) {
      if (this.isVisible && this.isAtBottom) {
        // Schedule scroll to bottom for next UI update
        this.$nextTick(() => {
          setTimeout(() => {
            this.scrollToBottom();
          }, 0);
        });
      }
    },

    isKeyboardOpen(newValue, oldValue) {
      if (newValue !== oldValue && this.isVisible && this.logsVisible) {
        this.$nextTick(() => {
          this.scrollToBottom();
        });
      }
    }
  },

  methods: {
    ...mapActions('debug', [
      'clearLogs',
      'addCommand',
      'navigateHistory'
    ]),

    // Execute JavaScript command in WebView
    executeCommand() {
      if (!this.command || this.command.trim() === '') return;

      // Get the command as string
      const cmdString = this.command;

      // Clear the input first to prevent issues with history
      this.command = '';

      // Store command in history
      this.addCommand(cmdString);

      // Emit event to parent component
      this.$emit('execute-command', cmdString);

      // Scroll to bottom
      this.scrollToBottom();
    },

    // Handle scroll events to detect if we're at the bottom
    handleScroll(args) {
      if (!this.isVisible) return;

      // Clear previous timeout if it exists
      if (this.scrollTimeout) {
        clearTimeout(this.scrollTimeout);
      }

      // Set a timeout to check if we're at the bottom after scrolling stops
      this.scrollTimeout = setTimeout(() => {
        this.checkScrollPosition();
      }, 200);
    },

    // Additional handler for scrollEnd event
    handleScrollEnd(args) {
      if (!this.isVisible) return;
      this.checkScrollPosition();
    },

    // Check if the scroll position is at the bottom
    checkScrollPosition() {
      if (!this.$refs.logsList || !this.displayLogs.length) return;

      try {
        const nativeCollectionView = this.$refs.logsList.nativeView;

        const lastVisibleIndex = nativeCollectionView.findLastVisibleItemIndex();

        this.isAtBottom = lastVisibleIndex >= (this.logs.length - 2);
      } catch (e) {
        console.error("Error checking scroll position:", e);
        this.isAtBottom = true;
      }
    },

    // Scroll to the bottom of the list
    scrollToBottom() {
      // Skip if not visible or no logs
      if (!this.isVisible || !this.displayLogs.length || !this.$refs.logsList) return;

      try {
        // CollectionView has a convenient scrollToIndex method
        const lastIndex = this.displayLogs.length - 1;
        this.$refs.logsList.scrollToIndex(lastIndex);
        this.isAtBottom = true;
      } catch (e) {
        console.error("Error scrolling to bottom:", e);
      }
    },

    // Navigate up through command history
    async navigateHistoryUp() {
      const result = await this.$store.dispatch('debug/navigateHistory', {
        direction: 1,
        currentCommand: this.command
      });
      if (result !== undefined) {
        this.command = result;
      }
    },

    // Navigate down through command history
    async navigateHistoryDown() {
      const result = await this.$store.dispatch('debug/navigateHistory', {
        direction: -1,
        currentCommand: this.command
      });
      if (result !== undefined) {
        this.command = result;
      }
    }
  }
}
</script>

<style scoped lang="scss">
@import '@/app';

.debug-console {
  background-color: $accent;
  width: 100%;
  height: 100%;
}

.logs-list {
  background-color: $accent;
}

.log-item {
  padding: 4 8;
  border-bottom-width: 1;
  border-bottom-color: rgba(255, 255, 255, 0.1);
}

.log-header {
  color: rgba(255, 255, 255, 0.7);
  font-size: 12;
  font-family: monospace;
  height: 20;
}

.log-message {
  color: #ffffff;
  font-size: 14;
  font-family: monospace;
  padding-left: 8;
}

.log-error .log-header {
  color: #ff5252;
}

.log-error .log-message {
  color: #ff5252;
}

.log-warn .log-header {
  color: #ffd740;
}

.log-warn .log-message {
  color: #ffd740;
}

.log-info .log-header {
  color: #40c4ff;
}

.log-info .log-message {
  color: #40c4ff;
}

.log-debug .log-header {
  color: #b0bec5;
}

.log-debug .log-message {
  color: #b0bec5;
}

.log-result .log-header {
  color: #69f0ae;
}

.log-result .log-message {
  color: #69f0ae;
}

.controls-panel {
  background-color: rgba(0, 0, 0, 0.2);
  padding: 4;
}

.control-button {
  font-size: 14;
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 4;
  margin: 0 2;
  padding: 4 8;
  height: 32;
}

.command-input-container {
  background-color: rgba(0, 0, 0, 0.3);
  padding: 8;
}

.command-input {
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 4;
  padding: 8;
  font-family: monospace;
  font-size: 14;
  height: auto;
  min-height: 40;
  max-height: 100;
}

.send-button {
  background-color: $primary;
  color: white;
  border-radius: 4;
  margin-left: 8;
  font-size: 16;
  height: 40;
  width: 50;
  text-align: center;
}

.scroll-bottom-button {
  width: 40;
  height: 40;
  border-radius: 20;
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 18;
  vertical-align: bottom;
  horizontal-align: right;
  margin: 16;
  text-align: center;
}
</style>
