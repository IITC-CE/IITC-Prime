// Copyright (C) 2021-2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

import {
  sharePosition,
  switchToPane,
  bootFinished,
  getVersionName,
  getZoomControl,
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
  copyToClipboardBridge,
  shareString,
  gmBridgeRequest,
} from '@/utils/events-from-iitc';
import { File, knownFolders, path } from '@nativescript/core';

export const router = async event => {
  const [eventName, eventData] = event;

  switch (eventName) {
    case 'intentPosLink':
      await sharePosition(
        eventData.lat,
        eventData.lng,
        eventData.zoom,
        eventData.title,
        eventData.isPortal,
        eventData.guid || null
      );
      break;
    case 'switchToPane':
      await switchToPane(eventData.id);
      break;
    case 'bootFinished':
      await bootFinished();
      break;
    case 'setLayers':
      await setLayers(JSON.parse(eventData.base_layer), JSON.parse(eventData.overlay_layer));
      break;
    case 'addPortalHighlighter':
      await addPortalHighlighter(eventData.name);
      break;
    case 'setActiveHighlighter':
      await setActiveHighlighter(eventData.name);
      break;
    case 'addPane':
      await addPane(eventData.name, eventData.label, eventData.icon);
      break;
    case 'setPortalStatus':
      await setPortalStatus(
        eventData.guid,
        eventData.team,
        eventData.level,
        eventData.title,
        eventData.health,
        eventData.resonators,
        eventData.levelColor,
        eventData.isLoading
      );
      break;
    case 'setMapStatus':
      await setMapStatus(eventData.portalLevels, eventData.mapStatus, eventData.requests);
      break;
    case 'setProgress':
      await setProgress(eventData.progress);
      break;
    case 'addInternalHostname':
      await addInternalHostname(eventData.domain);
      break;
    case 'setFollowMode':
      await setFollowMode(eventData.follow);
      break;
    case 'saveFile':
      return await saveFile(eventData.filename, eventData.dataType, eventData.content);
    case 'copy':
      await copyToClipboardBridge(eventData.s);
      break;
    case 'shareString':
      await shareString(eventData.str);
      break;
    case 'gmBridgeRequest':
      await gmBridgeRequest(eventData);
      break;
    case 'setPermalink':
      // Intentionally ignored
      break;
    case 'console:log':
      // This event is handled by direct listeners in BaseWebView
      break;
    default:
      console.warn('[Bridge Router] Unknown event:', eventName, eventData);
  }
};

const buildBridgeScript = () => {
  let bridge = '';

  const events = {
    intentPosLink: ['lat', 'lng', 'zoom', 'title', 'isPortal', 'guid'],
    shareString: ['str'],
    spinnerEnabled: ['en'],
    copy: ['s'],
    switchToPane: ['id'],
    dialogFocused: ['id'],
    dialogOpened: ['id', 'open'],
    bootFinished: [],
    setLayers: ['base_layer', 'overlay_layer'],
    addPortalHighlighter: ['name'],
    setActiveHighlighter: ['name'],
    addPane: ['name', 'label', 'icon'],
    setFollowMode: ['follow'],
    setPortalStatus: [
      'guid',
      'team',
      'level',
      'title',
      'health',
      'resonators',
      'levelColor',
      'isLoading',
    ],
    setMapStatus: ['portalLevels', 'mapStatus', 'requests'],
    setProgress: ['progress'],
    setPermalink: ['href'],
    addInternalHostname: ['domain'],
    saveFile: ['filename', 'dataType', 'content'],
    reloadIITC: ['clearCache'],
  };

  // regular sync bridge functions
  Object.entries(events).forEach(entry => {
    const [key, value] = entry;
    bridge +=
      'window.nsWebViewBridge.' +
      key +
      ' = function(' +
      value.join(', ') +
      ') {' +
      " return window.nsWebViewBridge.emit('JSBridge', ['" +
      key +
      "', {" +
      value.map(name => "'" + name + "': " + name).join(', ') +
      '}]); ' +
      '};\n';
  });
  bridge +=
    'window.nsWebViewBridge.getVersionName = function() {return window.__iitcVersionName;};\n';
  bridge +=
    'window.nsWebViewBridge.showZoom = function() {return window.__iitcShowZoom === true;};\n';

  // Set window.app at the END, after all functions are defined
  bridge += 'window.app = window.nsWebViewBridge;\n';

  return bridge;
};

const BRIDGE_SCRIPT_FILENAME = 'iitc-bridge.js';

/**
 * Write the bridge script to a file for registration via autoLoadJavaScriptFile
 * @returns {Promise<string>} Absolute path to the written file
 */
export const writeBridgeScriptFile = async () => {
  const filePath = path.join(knownFolders.documents().path, BRIDGE_SCRIPT_FILENAME);
  await File.fromPath(filePath).writeText(buildBridgeScript());
  return filePath;
};

/**
 * Inject the bridge directly via executeJavaScript.
 * Fallback for when the pre-registered script is not yet available at load finish.
 */
export const injectBridgeIITC = async webview => {
  await webview.executeJavaScript(buildBridgeScript());
};

const PRIME_PARAMS_FILENAME = 'prime-params.js';

// Native -> web parameters. Separate from the bridge so the bridge stays static.
// Add new parameters here; re-registration order is irrelevant for this script.
const buildPrimeParamsScript = () =>
  `window.__iitcVersionName = '${getVersionName()}';\n` +
  `window.__iitcShowZoom = ${getZoomControl()};`;

export const writePrimeParamsFile = async () => {
  const filePath = path.join(knownFolders.documents().path, PRIME_PARAMS_FILENAME);
  await File.fromPath(filePath).writeText(buildPrimeParamsScript());
  return filePath;
};

export const injectPrimeParams = async webview => {
  await webview.executeJavaScript(buildPrimeParamsScript());
};
