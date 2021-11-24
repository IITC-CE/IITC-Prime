import {getVersionName, setLayers} from "@/utils/events-from-iitc";

export const router = (event) => {
  console.log("JSBridge router data");
  console.log(event);
  const [eventName, eventData] = event;

  switch (eventName) {
    case "setLayers":
      setLayers(JSON.parse(eventData.base_layer), JSON.parse(eventData.overlay_layer))
      break;
  }
}

export const injectBridgeIITC = () => {
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
      "window.nsWebViewBridge."+key+" = function("+value.join(', ')+") {" +
      " return window.nsWebViewBridge.emit('JSBridge', ['"+key+"', {"+value.map(name => "'"+name+"': "+name).join(', ')+"}]); " +
      "};"
  });
  bridge += "\nwindow.nsWebViewBridge.getVersionName = function() {return '"+getVersionName()+"'};";
  return bridge;
}
