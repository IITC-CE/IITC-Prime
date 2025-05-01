//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

import { Trace, TraceWriter } from '@nativescript/core';
import store from './store';

/**
 * Check if a log message is intended only for external developer debugging
 * and should not be displayed in the in-app debug console
 */
function isDeveloperOnlyLog(message) {
  return typeof message === 'string' &&
    (message.startsWith('{NSVue') || message.startsWith('[WebView'));
}

/**
 * Format log arguments to string representation consistently across all log types
 */
function formatLogArguments(args) {
  return args.map(arg => {
    if (arg === null) return 'null';
    if (arg === undefined) return 'undefined';

    // Special handling for Error objects
    if (arg instanceof Error) {
      return String(arg);
    }

    if (typeof arg === 'object') {
      try { return JSON.stringify(arg); }
      catch (e) { return String(arg); }
    }
    return String(arg);
  }).join(' ');
}

/**
 * Factory function to create console method wrappers
 */
function createConsoleWrapper(originalMethod, logType) {
  return function() {
    const args = Array.from(arguments);
    const message = formatLogArguments(args);

    // Call original method to maintain development visibility
    originalMethod.apply(console, args);

    // Skip storing developer-only logs
    if (isDeveloperOnlyLog(message)) {
      return;
    }

    // Add to store with app source
    store.dispatch('debug/addLog', {
      type: logType,
      message: message,
      timestamp: Date.now(),
      source: 'app',
      category: 'console'
    });
  };
}

/**
 * Initialize Trace system to capture application logs
 */
export function initializeTracing() {
  // Define trace categories we want to capture
  Trace.addCategories(Trace.categories.Debug);
  Trace.addCategories(Trace.categories.Error);
  Trace.addCategories(Trace.categories.Binding);
  Trace.addCategories(Trace.categories.BindingError);

  // Create custom trace writer that will forward logs to our store
  const DebugConsoleTraceWriter = {
    write(message, category, type) {
      // Original console logging to maintain visibility during development
      const originalConsole = console;
      let logType = 'debug';

      switch (type) {
        case Trace.messageType.error:
          originalConsole.error(`[${category}] ${message}`);
          logType = 'error';
          break;
        case Trace.messageType.warn:
          originalConsole.warn(`[${category}] ${message}`);
          logType = 'warn';
          break;
        case Trace.messageType.info:
          originalConsole.info(`[${category}] ${message}`);
          logType = 'info';
          break;
        default:
          originalConsole.log(`[${category}] ${message}`);
          logType = 'debug';
      }

      // Skip storing framework logs, but they remain visible in console
      if (isDeveloperOnlyLog(message)) {
        return;
      }

      // Forward to store with app source
      store.dispatch('debug/addLog', {
        type: logType,
        message: message,
        timestamp: Date.now(),
        source: 'app',
        category: category
      });
    }
  };

  // Store original console methods
  const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info,
    debug: console.debug
  };

  // Override console methods using factory function
  console.log = createConsoleWrapper(originalConsole.log, 'log');
  console.warn = createConsoleWrapper(originalConsole.warn, 'warn');
  console.error = createConsoleWrapper(originalConsole.error, 'error');
  console.info = createConsoleWrapper(originalConsole.info, 'info');
  console.debug = createConsoleWrapper(originalConsole.debug, 'debug');

  // Register our trace writer and enable tracing
  Trace.addWriter(DebugConsoleTraceWriter);
  Trace.enable();
}
