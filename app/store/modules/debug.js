//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

export const debug = {
  namespaced: true,
  state: () => ({
    logs: [],
    commandHistory: [],
    historyPosition: -1,
    tempCommand: "",
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

      // Skip if same as last command
      if (state.commandHistory.length > 0 && state.commandHistory[0] === command) {
        return;
      }

      // Add command to history
      state.commandHistory.unshift(command);
      if (state.commandHistory.length > state.maxHistoryEntries) {
        state.commandHistory.pop();
      }

      // Reset history navigation
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
    navigateHistory({ commit, state }, direction) {
      // If history is empty, nothing to navigate
      if (state.commandHistory.length === 0) return "";

      // Calculate new position
      const newPosition = state.historyPosition + direction;

      if (direction > 0) { // Down in history
        if (newPosition >= 0) { // Moving beyond history - return to temp command
          commit('SET_HISTORY_POSITION', -1);
          return state.tempCommand;
        } else { // Moving up in history but not to the end
          commit('SET_HISTORY_POSITION', newPosition);
          return state.commandHistory[Math.abs(newPosition)];
        }
      } else if (direction < 0) { // Up in history
        if (state.historyPosition === -1) { // First time going into history
          commit('SET_TEMP_COMMAND', ""); // Save current input
        }

        // Don't go past the end of history
        if (Math.abs(newPosition) > state.commandHistory.length) {
          return state.commandHistory[state.commandHistory.length - 1];
        }

        commit('SET_HISTORY_POSITION', newPosition);
        return state.commandHistory[Math.abs(newPosition)];
      }

      return "";
    }
  }
};
