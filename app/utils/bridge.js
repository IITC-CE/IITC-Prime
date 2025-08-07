// Copyright (C) 2021-2025 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

import {
  sharePosition,
  switchToPane,
  bootFinished,
  getVersionName,
  setLayers,
  addPane,
  setPortalStatus,
  setMapStatus,
  setProgress,
  addPortalHighlighter,
  setActiveHighlighter,
  addInternalHostname,
  setFollowMode,
  saveFile,
  chooseFiles,
  copyToClipboardBridge,
  shareString,
} from "@/utils/events-from-iitc";

export const router = async (event) => {
  const [eventName, eventData] = event;

  switch (eventName) {
    case "intentPosLink":
      await sharePosition(
        eventData.lat,
        eventData.lng,
        eventData.zoom,
        eventData.title,
        eventData.isPortal,
        eventData.guid || null
      );
      break;
    case "switchToPane":
      await switchToPane(eventData.id);
      break;
    case "bootFinished":
      await bootFinished();
      break;
    case "setLayers":
      await setLayers(JSON.parse(eventData.base_layer), JSON.parse(eventData.overlay_layer));
      break;
    case "addPortalHighlighter":
      await addPortalHighlighter(eventData.name);
      break;
    case "setActiveHighlighter":
      await setActiveHighlighter(eventData.name);
      break;
    case "addPane":
      await addPane(eventData.name, eventData.label, eventData.icon);
      break;
    case "setPortalStatus":
      await setPortalStatus(eventData.guid, eventData.team, eventData.level, eventData.title, eventData.health, eventData.resonators, eventData.levelColor, eventData.isLoading);
      break;
    case "setMapStatus":
      await setMapStatus(eventData.portalLevels, eventData.mapStatus, eventData.requests);
      break;
    case "setProgress":
      await setProgress(eventData.progress);
      break;
    case "addInternalHostname":
      await addInternalHostname(eventData.domain);
      break;
    case "setFollowMode":
      await setFollowMode(eventData.follow);
      break;
    case "saveFile":
      return await saveFile(eventData.filename, eventData.dataType, eventData.content);
    case "chooseFiles":
      return await chooseFiles(eventData.allowsMultipleSelection, eventData.acceptTypes, eventData.callbackId);
    case "copy":
      await copyToClipboardBridge(eventData.s);
      break;
    case "shareString":
      await shareString(eventData.str);
      break;
    case "console:log":
      // This event is handled by direct listeners in BaseWebView
      break;
    default:
      console.debug('[Bridge Router] Unknown event in JSBridge router');
      console.debug('[Bridge Router] Unknown event:', event);
      console.debug('[Bridge Router] Unknown eventName:', eventName);
      console.debug('[Bridge Router] Unknown eventData:', eventData);
  }
}

export const injectBridgeIITC = async (webview) => {
  let bridge = "window.app = window.nsWebViewBridge;";
  const events = {
    intentPosLink: ["lat", "lng", "zoom", "title", "isPortal", "guid"],
    shareString: ["str"],
    spinnerEnabled: ["en"],
    copy: ["s"],
    switchToPane: ["id"],
    dialogFocused: ["id"],
    dialogOpened: ["id", "open"],
    bootFinished: [],
    setLayers: ["base_layer", 'overlay_layer'],
    addPortalHighlighter: ["name"],
    setActiveHighlighter: ["name"],
    addPane: ["name", "label", "icon"],
    setFollowMode: ["follow"],
    setPortalStatus: ["guid", "team", "level", "title", "health", "resonators", "levelColor", "isLoading"],
    setMapStatus: ["portalLevels", "mapStatus", "requests"],
    setProgress: ["progress"],
    setPermalink: ["href"],
    addInternalHostname: ["domain"],
    saveFile: ["filename", "dataType", "content"],
    reloadIITC: ["clearCache"]
  }

  const asyncEvents = {
    chooseFiles: ["allowsMultipleSelection", "acceptTypes"]
  }

  // regular sync bridge functions
  Object.entries(events).forEach(entry => {
    const [key, value] = entry;
    bridge += "\n" +
      "window.nsWebViewBridge." + key + " = function(" + value.join(', ') + ") {" +
      " return window.nsWebViewBridge.emit('JSBridge', ['" + key + "', {" + value.map(name => "'" + name + "': " + name).join(', ') + "}]); " +
      "};"
  });
  bridge += "\nwindow.nsWebViewBridge.getVersionName = function() {return '" + getVersionName() + "'};";

  // async callback-based bridge functions
  Object.entries(asyncEvents).forEach(entry => {
    const [key, value] = entry;
    bridge += "\n" +
      "window.nsWebViewBridge." + key + " = function(" + value.join(', ') + ", callback) {" +
      " var callbackId = 'cb_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);" +
      " window._bridgeCallbacks = window._bridgeCallbacks || {};" +
      " if (callback && typeof callback === 'function') { window._bridgeCallbacks[callbackId] = callback; }" +
      " return window.nsWebViewBridge.emit('JSBridge', ['" + key + "', {" +
      value.map(name => "'" + name + "': " + name).join(', ') +
      (value.length > 0 ? ", " : "") + "'callbackId': callbackId}]); " +
      "};"
  });

  // callback helper for async bridge functions
  bridge += "\n" +
    "// Helper to execute callback from native\n" +
    "window.nsWebViewBridge._executeCallback = function(callbackId, result) {\n" +
    "  if (window._bridgeCallbacks && window._bridgeCallbacks[callbackId]) {\n" +
    "    var callback = window._bridgeCallbacks[callbackId];\n" +
    "    delete window._bridgeCallbacks[callbackId];\n" +
    "    callback(result);\n" +
    "  }\n" +
    "};";

  await webview.executeJavaScript(bridge);
}
