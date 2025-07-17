// Copyright (C) 2025 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

export default {
  methods: {
    // Format timestamp to display time with milliseconds
    formatTimestamp(timestamp) {
      if (!timestamp) return '';

      const date = new Date(timestamp);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const seconds = date.getSeconds().toString().padStart(2, '0');

      return `${hours}:${minutes}:${seconds}`;
    },

    // Format log header with timestamp, type and source
    formatLogHeader(item) {
      const timestamp = this.formatTimestamp(item.timestamp);
      const type = item.type ? item.type.toUpperCase() : 'LOG';
      const source = item.source ? item.source.toUpperCase() : 'UNKNOWN';
      const category = item.category ? `[${item.category}]` : '';

      return `${timestamp} ${type} ${source} ${category}`;
    },

    // Get full log text (header + message)
    getFullLogText(item) {
      const header = this.formatLogHeader(item);
      const message = item.message || '';
      return `${header}\n${message}`;
    }
  }
};
