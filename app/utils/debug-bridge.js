// Copyright (C) 2025 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

/**
 * Debug bridge for WebView console interception
 * Provides console logging and JavaScript execution capabilities
 */
export const injectDebugBridge = async (webview) => {
  const script = `
  (function() {
    function debugBridge() {
      if (window.__debugBridgeInstalled) return;

      // Store original console methods
      const originalConsole = {
        log: console.log,
        warn: console.warn,
        error: console.error,
        info: console.info,
        debug: console.debug
      };

      // Helper function to safely stringify any type of value
      function formatArg(arg) {
        if (arg === null) return 'null';
        if (arg === undefined) return 'undefined';
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg);
          } catch (e) {
            return String(arg);
          }
        }
        return String(arg);
      }

      // Override console methods
      console.log = function() {
        const args = Array.from(arguments);
        window.nsWebViewBridge.emit('console:log', {
          type: 'log',
          message: args.map(arg => formatArg(arg)).join(' '),
          timestamp: new Date().toISOString(),
          source: 'webview'
        });
        return originalConsole.log.apply(console, args);
      };

      console.warn = function() {
        const args = Array.from(arguments);
        window.nsWebViewBridge.emit('console:log', {
          type: 'warn',
          message: args.map(arg => formatArg(arg)).join(' '),
          timestamp: new Date().toISOString(),
          source: 'webview'
        });
        return originalConsole.warn.apply(console, args);
      };

      console.error = function() {
        const args = Array.from(arguments);
        window.nsWebViewBridge.emit('console:log', {
          type: 'error',
          message: args.map(arg => formatArg(arg)).join(' '),
          timestamp: new Date().toISOString(),
          source: 'webview'
        });
        return originalConsole.error.apply(console, args);
      };

      console.info = function() {
        const args = Array.from(arguments);
        window.nsWebViewBridge.emit('console:log', {
          type: 'info',
          message: args.map(arg => formatArg(arg)).join(' '),
          timestamp: new Date().toISOString(),
          source: 'webview'
        });
        return originalConsole.info.apply(console, args);
      };

      console.debug = function() {
        const args = Array.from(arguments);
        window.nsWebViewBridge.emit('console:log', {
          type: 'debug',
          message: args.map(arg => formatArg(arg)).join(' '),
          timestamp: new Date().toISOString(),
          source: 'webview'
        });
        return originalConsole.debug.apply(console, args);
      };

      // Handler for executing JavaScript commands from app
      window.nsWebViewBridge.on('console:execute', function(data) {
        try {
          console.log(">>> " + data.command);
          const result = eval(data.command);
          if (result !== undefined) {
            console.log(formatArg(result));
          }
        } catch (error) {
          console.error(error.stack || error.message);
        }
      });

      window.__debugBridgeInstalled = true;
    };
    // Wait for bridge to be ready
    if ("nsWebViewBridge" in window) {
      debugBridge();
    } else {
      window.addEventListener('ns-bridge-ready', function() {
        debugBridge();
      });
    }
  })();
  `;

  await webview.executeJavaScript(script);
};
