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
      // Add log entry and maintain max size
      state.logs.push(log);
      if (state.logs.length > state.maxLogEntries) {
        state.logs.shift();
      }
    },
    CLEAR_LOGS(state) {
      state.logs = [];
    },
    ADD_COMMAND(state, command) {
      // Skip if command is empty or same as last one
      if (!command || command.trim() === '' ||
          (state.commandHistory.length > 0 && state.commandHistory[0] === command)) {
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
      // direction: 1 for down, -1 for up in history
      const newPosition = state.historyPosition + direction;

      // Going down in history (or exiting history)
      if (direction > 0 && newPosition >= 0) {
        commit('SET_HISTORY_POSITION', -1);
        return state.tempCommand;
      }
      // Going up in history
      else if (direction < 0 && newPosition >= -1 &&
                Math.abs(newPosition) <= state.commandHistory.length) {

        // Save current command when entering history
        if (state.historyPosition === -1) {
          commit('SET_TEMP_COMMAND', state.currentCommand || "");
        }

        commit('SET_HISTORY_POSITION', newPosition);

        if (newPosition === -1) {
          return state.tempCommand;
        }
        return state.commandHistory[newPosition];
      }

      // Return current command or history item
      return state.historyPosition === -1 ?
             state.tempCommand :
             state.commandHistory[state.historyPosition];
    }
  }
};
