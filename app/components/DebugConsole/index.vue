//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

<template>
  <GridLayout rows="*, auto" class="debug-console">
    <!-- Logs list -->
    <CollectionView
      ref="logsList"
      row="0"
      class="logs-list"
      :items="displayLogs"
      @scroll="handleScroll"
      @scrollEnd="handleScrollEnd"
      @loaded="onCollectionViewLoaded"
    >
      <template #default="{ item }">
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
      </template>
    </CollectionView>

    <!-- Controls panel -->
    <ControlsPanel
      row="1"
      v-model:command="command"
      :commandHistory="commandHistory"
      :historyPosition="historyPosition"
      @clear="clearLogs"
      @command-executed="onCommandExecuted"
      @history-navigate="handleHistoryNavigation"
      @close="closeDebugConsole"
      ref="controlsPanel"
    />

    <MDButton
      v-show="!isAtBottom && showControls"
      class="fa scroll-bottom-button"
      :text="$filters.fonticon('fa-arrow-down')"
      variant="flat"
      rippleColor="#ffffff"
      @tap="scrollToBottom"
    />
  </GridLayout>
</template>

<script>
import { mapState, mapActions } from 'vuex';
import { performanceOptimizationMixin, optimizeMapState, Cache } from '~/utils/performance-optimization';
import logFormattingMixin from './mixins/logFormatting';
import touchInteractionMixin from './mixins/touchInteraction';
import clipboardUtilsMixin from './mixins/clipboardUtils';
import ControlsPanel from './ControlsPanel.vue';

export default {
  components: {
    ControlsPanel
  },

  mixins: [
    performanceOptimizationMixin,
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
      showControls: false, // Controls UI elements visibility
      logsVisible: false,  // Controls whether logs should be shown or not

      _logFormattingCache: new Cache(200, 600000), // Cache formatted logs for 10 minutes
      _displayLogsCache: null,
      _lastLogsHash: null,
      _collectionView: null
    }
  },

  computed: {
    ...mapState(optimizeMapState({
      logs: 'debug.logs',
      commandHistory: 'debug.commandHistory',
      historyPosition: 'debug.historyPosition'
    })),

    // Display logs only when both component is visible and logs should be shown
    displayLogs() {
      if (!this.isVisible || !this.logsVisible) {
        return [];
      }

      // Create hash of logs for cache invalidation
      const logsHash = this.logs.length + '-' + (this.logs[0]?.timestamp || 0) + '-' + (this.logs[this.logs.length - 1]?.timestamp || 0);

      // Return cached result if logs haven't changed
      if (this._lastLogsHash === logsHash && this._displayLogsCache) {
        return this._displayLogsCache;
      }

      // Compute new display logs
      this._displayLogsCache = this.logs.map((log, index) => ({ ...log, index }));
      this._lastLogsHash = logsHash;

      return this._displayLogsCache;
    }
  },

  watch: {
    isVisible(newValue) {
      if (newValue) {
        this.showControls = true;
        this.logsVisible = false;

        this.$nextTick(() => {
          if (this.$refs.controlsPanel) {
            this.$refs.controlsPanel.focusInput();
          }
        });

        // Add logs with delay to prevent UI freezing
        this.createTimeout(() => {
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
        // Use RAF batching for smooth scrolling
        this.scheduleUpdate(() => {
          this.scrollToBottom();
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

    // Handle executed command from ControlsPanel
    onCommandExecuted(cmdString) {
      // Add to command history
      this.addCommand(cmdString);

      // Emit event to parent component
      this.$emit('execute-command', cmdString);

      // Scroll to bottom
      this.scrollToBottom();
    },

    async handleHistoryNavigation(params) {
      const result = await this.navigateHistory(params);
      if (result !== undefined) {
        this.command = result;
      }
    },

    // Handle scroll events to detect if we're at the bottom
    handleScroll(args) {
      if (!this.isVisible) return;

      // Use RAF batching with debouncing for scroll position checks
      this.scheduleUpdate(() => {
        this.checkScrollPosition();
      });
    },

    // Additional handler for scrollEnd event
    handleScrollEnd(args) {
      if (!this.isVisible) return;
      this.checkScrollPosition();
    },

    // Check if the scroll position is at the bottom
    checkScrollPosition() {
      if (!this._collectionView || !this.displayLogs.length) return;

      try {
        const lastIndex = this.displayLogs.length - 1;
        const secondToLastIndex = Math.max(0, lastIndex - 1);

        // Check if the last or second-to-last item is visible
        const isLastVisible = this._collectionView.isItemAtIndexVisible(lastIndex);
        const isSecondToLastVisible = this._collectionView.isItemAtIndexVisible(secondToLastIndex);

        this.isAtBottom = isLastVisible || isSecondToLastVisible;
      } catch (e) {
        console.error("Error checking scroll position:", e);
        this.isAtBottom = true;
      }
    },

    // Scroll to the bottom of the list
    scrollToBottom() {
      // Skip if not visible or no logs
      if (!this.isVisible || !this.displayLogs.length || !this._collectionView) return;

      try {
        const lastIndex = this.displayLogs.length - 1;

        // scrollToIndex(index, animated)
        this._collectionView.scrollToIndex(lastIndex, true);
        this.isAtBottom = true;
      } catch (e) {
        console.error("Error scrolling to bottom:", e);
      }
    },

    // Close debug console directly
    closeDebugConsole() {
      this.$store.dispatch('ui/toggleDebugMode');
    },

    onCollectionViewLoaded(args) {
      this._collectionView = args.object;
    },
  },
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

.scroll-bottom-button {
  width: 50;
  height: 50;
  border-radius: $radius-full;
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 18;
  vertical-align: bottom;
  horizontal-align: right;
  margin: $spacing-l $spacing-m;
  text-align: center;
  padding-top: 15;
}
</style>
