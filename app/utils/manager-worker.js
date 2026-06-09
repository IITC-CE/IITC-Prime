// Copyright (C) 2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

/**
 * manager-worker - runs lib-iitc-manager on a background thread.
 *
 * The real Manager instance lives here so its heavy work (plugin parsing,
 * wrapPluginCode, update fetching) does not block the single UI thread.
 * The main thread talks to it through a small RPC protocol via postMessage:
 *
 *   main -> worker:  { id, method, args }
 *   worker -> main:  { id, result }                (resolves the RPC promise)
 *                    { id, error }                 (rejects the RPC promise)
 *                    { callback, args }            (a Manager callback fired)
 *
 * Note: NativeScript workers pass JSON-serializable data by copy only.
 * Plugin code never crosses the boundary: getEnabledPluginScripts and the
 * injectPlugin callback both write scripts to disk and return paths; getPlugins
 * / onPluginsViewChanged strip `code` from metadata.
 */

import '@nativescript/core/globals';
import { Manager, wrapPluginCode, GM_API_UID } from 'lib-iitc-manager';
import storage from '@/utils/storage';
import { writePluginScriptFile } from '@/utils/plugin-scripts';

// Worker global scope (NativeScript exposes onmessage/postMessage on global).
const ctx = global;

let manager = null;

const stripCode = plugin => {
  if (!plugin) return plugin;
  const { code, ...meta } = plugin;
  return meta;
};

const stripCodeMap = plugins => {
  const out = {};
  for (const uid in plugins) out[uid] = stripCode(plugins[uid]);
  return out;
};

const emitCallback = (callback, args) => {
  ctx.postMessage({ callback, args });
};

const getManager = () => {
  if (manager) {
    return manager;
  }

  manager = new Manager({
    storage: {
      async get(keys) {
        return await storage.get(keys);
      },
      async set(obj) {
        await storage.set(obj);
      },
    },
    gmApi: {
      bridgeAdapterCode: `
        window.__iitc_gm_bridge__ = {
          send(data) {
            window.nsWebViewBridge.emit('gmBridgeRequest', JSON.stringify(data));
          },
          onResponse(cb) {
            window.addEventListener('gmBridgeResponse', function(e) { cb(e.detail); });
          }
        };
      `,
    },
    message: (message, args) => {
      emitCallback('onMessage', [message, args]);
    },
    onProgress: isShow => {
      emitCallback('onProgress', [isShow]);
    },
    injectPlugin: async plugin => {
      // Write to disk so plugin code never crosses the worker boundary via postMessage
      if (!plugin || !plugin.code) return;
      const filePath = await writePluginScriptFile(plugin.uid, plugin.code);
      emitCallback('onInjectPlugin', [{ uid: plugin.uid, filePath }]);
    },
    onPluginEvent: event => {
      emitCallback('onPluginEvent', [event]);
    },
    onPluginsViewChanged: view => {
      emitCallback('onPluginsViewChanged', [
        stripCodeMap(view.plugins),
        stripCode(view.core) || null,
      ]);
    },
    useFetchHeadMethod: false,
    isDaemon: false,
  });

  return manager;
};

const handlers = {
  async startup() {
    const m = getManager();
    await m.run();
    const channel = m.channel;
    const customUrl = m.networkHost?.custom ?? '';
    return { isRunning: true, currentChannel: channel, customChannelUrl: customUrl };
  },

  async checkUpdates(force = false) {
    await getManager().checkUpdates(force);
    return { success: true };
  },

  async getEnabledPluginScripts() {
    const m = getManager();
    const plugins = await m.getEnabledPlugins();
    const scripts = [];
    for (const uid in plugins) {
      const plugin = plugins[uid];
      if (!plugin || !plugin.code) continue;
      // GM API component is injected as-is; everything else gets GM bindings.
      const code = uid === GM_API_UID ? plugin.code : wrapPluginCode(plugin, m.sourceUrlPrefix);
      const filePath = await writePluginScriptFile(uid, code);
      scripts.push({ uid, filePath });
    }
    return scripts;
  },

  async getUpdateChannel() {
    return getManager().channel;
  },

  async setUpdateChannel(channel) {
    await getManager().setChannel(channel);
    return { currentChannel: channel };
  },

  async getUpdateInterval(channel) {
    return await getManager().getUpdateCheckInterval(channel);
  },

  async setUpdateInterval(interval, channel) {
    await getManager().setUpdateCheckInterval(interval, channel);
    return { success: true };
  },

  async getCustomChannelUrl() {
    return getManager().networkHost?.custom ?? '';
  },

  async setCustomChannelUrl(url) {
    await getManager().setCustomChannelUrl(url);
    return { customChannelUrl: url };
  },

  async getPlugins() {
    const view = await getManager().getPluginsView();
    return { plugins: stripCodeMap(view.plugins), core: stripCode(view.core) || null };
  },

  async managePlugin(uid, action) {
    await getManager().managePlugin(uid, action);
    return { success: true };
  },

  async addUserScripts(scripts) {
    return await getManager().addUserScripts(scripts);
  },
};

ctx.onmessage = async msg => {
  const { id, method, args = [] } = msg.data || {};
  const handler = handlers[method];

  if (!handler) {
    ctx.postMessage({ id, error: { message: `Unknown manager method: ${method}` } });
    return;
  }

  try {
    const result = await handler(...args);
    ctx.postMessage({ id, result });
  } catch (error) {
    ctx.postMessage({
      id,
      error: {
        message: error?.message || String(error),
        name: error?.name,
        stack: error?.stack,
      },
    });
  }
};

ctx.onerror = error => {
  console.error('[ManagerWorker] Uncaught error:', error);
  // Returning true marks the error as handled so the worker is not torn down.
  return true;
};
