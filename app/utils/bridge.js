//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

import {
  switchToPane,
  bootFinished,
  getVersionName,
  setLayers,
  addPane,
  setPortalStatus,
  setMapStatus,
  setProgress,
  addPortalHighlighter,
  setActiveHighlighter
} from "@/utils/events-from-iitc";

export const router = async (event) => {
  const [eventName, eventData] = event;

  switch (eventName) {
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
      await setPortalStatus(eventData.guid, eventData.team, eventData.level, eventData.title, eventData.health, eventData.resonators, eventData.ui);
      break;
    case "setMapStatus":
      await setMapStatus(eventData.portalLevels, eventData.mapStatus, eventData.requests);
      break;
    case "setProgress":
      await setProgress(eventData.progress);
      break;
    default:
      console.log("Unknown event in JSBridge router");
      console.log(event);
  }
}

export const injectBridgeIITC = async (webview) => {
  let bridge = "window.android = window.nsWebViewBridge;";
  const events = {
    intentPosLink: ["lat", "lng", "zoom", "title", "isPortal"],
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
    setPortalStatus: ["guid", "team", "level", "title", "health", "resonators", "ui"],
    setMapStatus: ["portalLevels", "mapStatus", "requests"],
    setProgress: ["progress"],
    setPermalink: ["href"],
    saveFile: ["filename", "type", "content"],
    reloadIITC: ["clearCache"]
  }
  Object.entries(events).forEach(entry => {
    const [key, value] = entry;
    bridge += "\n" +
      "window.nsWebViewBridge." + key + " = function(" + value.join(', ') + ") {" +
      " return window.nsWebViewBridge.emit('JSBridge', ['" + key + "', {" + value.map(name => "'" + name + "': " + name).join(', ') + "}]); " +
      "};"
  });
  bridge += "\nwindow.nsWebViewBridge.getVersionName = function() {return '" + getVersionName() + "'};";

  await webview.executeJavaScript(bridge);
}
