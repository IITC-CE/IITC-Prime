// Copyright (C) 2025 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

/**
 * Transport Manager - Isolates native transport objects from Vue reactivity
 */

class TransportManager {
  constructor() {
    this.transports = new Map();
    this.nextId = 1;
  }

  /**
   * Stores transport object and returns ID for Vue
   */
  storeTransport(resultMsg) {
    const transportId = `transport_${this.nextId++}`;

    this.transports.set(transportId, {
      obj: resultMsg.obj,
      sendToTarget: () => resultMsg.sendToTarget()
    });

    // Return only ID for Vue, URL empty because content loads via transport
    return {
      transportId,
      url: ''
    };
  }

  /**
   * Initializes transport for WebView
   */
  initializeTransport(transportId, webview) {
    const transport = this.transports.get(transportId);
    if (!transport) {
      console.error('Transport not found:', transportId);
      return false;
    }

    try {
      transport.obj?.setWebView(webview.android);

      if (transport.obj && transport.obj.getWebView()) {
        transport.sendToTarget();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error initializing transport:', error);
      return false;
    }
  }

  /**
   * Cleans up transport when popup closes
   */
  cleanupTransport(transportId) {
    this.transports.delete(transportId);
  }
}

export const transportManager = new TransportManager();
