//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

export const debug = {
  namespaced: true,
  state: () => ({
    logs: [],
    commandHistory: [],     // Array of commands with newest at the end (index length-1)
    historyPosition: -1,    // -1 means "input mode", 0-N represent history positions
    tempCommand: "",        // Stores current input when navigating through history
    maxLogEntries: 1000,
    maxHistoryEntries: 50
  }),
  mutations: {
    ADD_LOG(state, log) {
      state.logs.push(log);
      if (state.logs.length > state.maxLogEntries) {
        state.logs.shift();
      }
    },
    CLEAR_LOGS(state) {
      state.logs = [];
    },
    ADD_COMMAND(state, command) {
      if (!command || command.trim() === '') return;

      // Skip if command is identical to the most recent one
      if (state.commandHistory.length > 0 &&
          state.commandHistory[state.commandHistory.length - 1] === command) {
        return;
      }

      // Add command to the end of history array
      state.commandHistory.push(command);

      // Maintain maximum history size by removing oldest entries
      if (state.commandHistory.length > state.maxHistoryEntries) {
        state.commandHistory.shift();
      }

      // Reset to input mode after adding a command
      state.historyPosition = -1;
      state.tempCommand = "";
    },
    SET_HISTORY_POSITION(state, position) {
      state.historyPosition = position;
    },
    SET_TEMP_COMMAND(state, command) {
      state.tempCommand = command;
    }
  },
  actions: {
    addLog({ commit }, log) {
      commit('ADD_LOG', log);
    },
    clearLogs({ commit }) {
      commit('CLEAR_LOGS');
    },
    addCommand({ commit }, command) {
      commit('ADD_COMMAND', command);
    },
    navigateHistory({ commit, state }, { direction, currentCommand }) {
      // Return empty string if history is empty
      if (state.commandHistory.length === 0) return "";

      const currentPosition = state.historyPosition;
      let newPosition;

      // Direction < 0 means down (toward newer commands)
      // Direction > 0 means up (toward older commands)
      if (direction < 0) {
        newPosition = currentPosition - 1;
      } else {
        newPosition = currentPosition + 1;
      }

      // Apply boundary constraints to position
      if (newPosition < -1) {
        // Can't go below input mode
        newPosition = -1;
      } else if (newPosition >= state.commandHistory.length) {
        // Can't go beyond oldest command
        newPosition = state.commandHistory.length - 1;
      }

      // When first moving from input mode to history, store current input
      if (currentPosition === -1 && newPosition !== -1) {
        commit('SET_TEMP_COMMAND', currentCommand || "");
      }

      // Update history position
      commit('SET_HISTORY_POSITION', newPosition);

      // When position is -1, return to input mode with saved input
      if (newPosition === -1) {
        return state.tempCommand;
      } else {
        // Convert position to actual array index (since newest is at the end)
        const historyIndex = state.commandHistory.length - 1 - newPosition;
        return state.commandHistory[historyIndex];
      }
    }
  }
};
