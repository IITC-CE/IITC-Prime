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
      if (isDeveloperOnlyLog(message, category)) {
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

  // Intercept console methods to capture direct console usage
  const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info,
    debug: console.debug
  };

  // Override console methods
  console.log = function() {
    const args = Array.from(arguments);
    const message = args.map(arg => {
      if (arg === null) return 'null';
      if (arg === undefined) return 'undefined';
      if (typeof arg === 'object') {
        try { return JSON.stringify(arg); }
        catch (e) { return String(arg); }
      }
      return String(arg);
    }).join(' ');

    // Call original method
    originalConsole.log.apply(console, args);

    // Skip storing framework logs
    if (isDeveloperOnlyLog(message, 'console')) {
      return;
    }

    // Add to store
    store.dispatch('debug/addLog', {
      type: 'log',
      message: message,
      timestamp: Date.now(),
      source: 'app',
      category: 'console'
    });
  };

  console.warn = function() {
    const args = Array.from(arguments);
    const message = args.map(arg => String(arg)).join(' ');
    originalConsole.warn.apply(console, args);

    // Skip storing framework logs
    if (isDeveloperOnlyLog(message, 'console')) {
      return;
    }

    store.dispatch('debug/addLog', {
      type: 'warn',
      message: message,
      timestamp: Date.now(),
      source: 'app',
      category: 'console'
    });
  };

  console.error = function() {
    const args = Array.from(arguments);
    const message = args.map(arg => String(arg)).join(' ');
    originalConsole.error.apply(console, args);

    // Skip storing framework logs
    if (isDeveloperOnlyLog(message, 'console')) {
      return;
    }

    store.dispatch('debug/addLog', {
      type: 'error',
      message: message,
      timestamp: Date.now(),
      source: 'app',
      category: 'console'
    });
  };

  console.info = function() {
    const args = Array.from(arguments);
    const message = args.map(arg => String(arg)).join(' ');
    originalConsole.info.apply(console, args);

    // Skip storing framework logs
    if (isDeveloperOnlyLog(message, 'console')) {
      return;
    }

    store.dispatch('debug/addLog', {
      type: 'info',
      message: message,
      timestamp: Date.now(),
      source: 'app',
      category: 'console'
    });
  };

  console.debug = function() {
    const args = Array.from(arguments);
    const message = args.map(arg => String(arg)).join(' ');
    originalConsole.debug.apply(console, args);

    // Skip storing framework logs
    if (isDeveloperOnlyLog(message, 'console')) {
      return;
    }

    store.dispatch('debug/addLog', {
      type: 'debug',
      message: message,
      timestamp: Date.now(),
      source: 'app',
      category: 'console'
    });
  };

  // Register our trace writer and enable tracing
  Trace.addWriter(DebugConsoleTraceWriter);
  Trace.enable();
}
