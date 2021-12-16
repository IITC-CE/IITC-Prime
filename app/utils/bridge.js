//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

import {
  switchToPane,
  getVersionName,
  setLayers,
  addPane,
  setProgress
} from "@/utils/events-from-iitc";

export const router = (event) => {
  const [eventName, eventData] = event;

  switch (eventName) {
    case "switchToPane":
      switchToPane(eventData.id);
      break;
    case "setLayers":
      setLayers(JSON.parse(eventData.base_layer), JSON.parse(eventData.overlay_layer));
      break;
    case "addPane":
      addPane(eventData.name, eventData.label, eventData.icon);
      break;
    case "setProgress":
      setProgress(eventData.progress);
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
