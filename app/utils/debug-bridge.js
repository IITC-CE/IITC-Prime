// Copyright (C) 2025 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

import { File, knownFolders, path } from '@nativescript/core';

/**
 * Debug bridge for WebView console interception
 * Provides console logging and JavaScript execution capabilities
 */
const buildDebugBridgeScript = () => {
  return `
  (function() {
    function debugBridge() {
      if (window.__debugBridgeInstalled) return;

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

      // On iOS, override console methods to forward to native via bridge.
      // On Android, native onConsoleMessage handler captures all console output.
      var isAndroid = typeof androidWebViewBridge !== 'undefined';
      if (!isAndroid) {
        var originalConsole = {
          log: console.log,
          warn: console.warn,
          error: console.error,
          info: console.info,
          debug: console.debug
        };

        ['log', 'warn', 'error', 'info', 'debug'].forEach(function(level) {
          console[level] = function() {
            var args = Array.from(arguments);
            window.nsWebViewBridge.emit('console:log', {
              type: level,
              message: args.map(function(arg) { return formatArg(arg); }).join(' '),
              timestamp: new Date().toISOString(),
              source: 'webview'
            });
            return originalConsole[level].apply(console, args);
          };
        });

        // Catch uncaught exceptions (syntax errors, runtime errors not in try/catch)
        window.onerror = function(message, source, lineno, colno, error) {
          window.nsWebViewBridge.emit('console:log', {
            type: 'error',
            message: (error && error.stack) ? error.stack : message,
            timestamp: new Date().toISOString(),
            source: source ? source + ':' + lineno : 'webview'
          });
        };

        // Catch unhandled promise rejections
        window.addEventListener('unhandledrejection', function(event) {
          var reason = event.reason;
          window.nsWebViewBridge.emit('console:log', {
            type: 'error',
            message: 'Unhandled rejection: ' + ((reason && reason.stack) ? reason.stack : formatArg(reason)),
            timestamp: new Date().toISOString(),
            source: 'webview'
          });
        });
      }

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
};

const DEBUG_BRIDGE_SCRIPT_FILENAME = 'iitc-debug-bridge.js';

/**
 * Write the debug bridge script to a file for registration via autoLoadJavaScriptFile
 * @returns {Promise<string>} Absolute path to the written file
 */
export const writeDebugBridgeFile = async () => {
  const filePath = path.join(knownFolders.documents().path, DEBUG_BRIDGE_SCRIPT_FILENAME);
  await File.fromPath(filePath).writeText(buildDebugBridgeScript());
  return filePath;
};

/**
 * Inject the debug bridge directly via executeJavaScript.
 * Fallback for when the pre-registered script is not yet available at load finish.
 */
export const injectDebugBridge = async webview => {
  await webview.executeJavaScript(buildDebugBridgeScript());
};
