import { APP_ID } from '../wdio.shared.conf.js';

export { APP_ID };
export const BROWSER_ID = () => (driver.isIOS ? 'com.apple.mobilesafari' : 'com.android.chrome');
// sms: opens on both platforms; the iOS simulator has no handler for mailto: or tel:
export const MESSAGES_ID = () =>
  driver.isIOS ? 'com.apple.MobileSMS' : 'com.google.android.apps.messaging';

const MAIN_PAGE = /^https:\/\/intel\.ingress\.com\//;

export const native = () => driver.switchAppiumContext('NATIVE_APP');

const foregroundApp = async () =>
  driver.isIOS
    ? (await driver.execute('mobile: activeAppInfo')).bundleId
    : driver.getCurrentPackage();

export const waitForForegroundApp = async appId => {
  await native();
  await driver.waitUntil(async () => (await foregroundApp()) === appId, {
    timeoutMsg: `${appId} did not come to the foreground`,
  });
};

// The other app may still be starting and come back on top of the first activation
export const returnToApp = async () => {
  await native();
  await driver.waitUntil(
    async () => {
      if ((await foregroundApp()) === APP_ID) return true;
      await driver.activateApp(APP_ID);
      return false;
    },
    { interval: 1000, timeoutMsg: `${APP_ID} did not come to the foreground` }
  );
};

// WebView pages: on iOS each WebView is a context, on Android each page is a
// window of the app's single webview context
const listPages = async () => {
  if (driver.isIOS) {
    const contexts = await driver.getContexts({ returnDetailedContexts: true });
    return contexts.filter(c => c.bundleId === APP_ID).map(c => ({ id: c.id, url: c.url ?? '' }));
  }
  await driver.switchAppiumContext(`WEBVIEW_${APP_ID}`);
  const pages = [];
  for (const handle of await driver.getWindowHandles()) {
    await driver.switchToWindow(handle);
    pages.push({ id: handle, url: await driver.getUrl() });
  }
  return pages;
};

// Pages that existed at the last reset; a closed popup's WebView can outlive it
let knownPages = new Set();

const switchToPage = (urlPattern, { isNew = false } = {}) =>
  driver.waitUntil(async () => {
    const pages = await listPages().catch(() => []);
    const page = pages.find(p => urlPattern.test(p.url) && !(isNew && knownPages.has(p.id)));
    if (!page) return false;
    await (driver.isIOS ? driver.switchAppiumContext(page.id) : driver.switchToWindow(page.id));
    return true;
  });

export const mainPage = () => switchToPage(MAIN_PAGE);

/** Switches to a WebView page opened after the last reset, such as a popup. */
export const newPage = urlPattern => switchToPage(urlPattern, { isNew: true });

export const waitForMainPageUrl = urlPattern =>
  driver.waitUntil(async () => {
    await mainPage();
    return urlPattern.test(await driver.getUrl());
  });

/** Brings the app to the front on its main page, with the other apps closed. */
export const resetApp = async () => {
  await native();
  // Left in the background they can hang and cover the app with a system dialog
  await driver.terminateApp(BROWSER_ID());
  await driver.terminateApp(MESSAGES_ID());
  await returnToApp();
  knownPages = new Set((await listPages()).map(p => p.id));
  await mainPage();
  // Right after returning from another app the page may be hidden and drop taps
  await driver.waitUntil(() =>
    driver.execute(() => typeof window.app === 'object' && document.visibilityState === 'visible')
  );
};

let linkCount = 0;

/**
 * Adds a target="_blank" link to the current page and taps it natively: a
 * synthetic click right after returning from another app can be dropped.
 */
export const tapBlankLink = async url => {
  // Links left on the main page stay in the tree under a popup
  const text = `e2e-link-${++linkCount}`;
  await driver.execute(
    (href, label) => {
      const a = document.createElement('a');
      a.href = href;
      a.target = '_blank';
      a.textContent = label;
      a.style.cssText =
        'position:fixed;top:30%;left:10%;width:80%;height:80px;z-index:2147483647;background:#f0f';
      document.body.appendChild(a);
    },
    url,
    text
  );
  await native();
  await $(driver.isIOS ? `~${text}` : `android=new UiSelector().text("${text}")`).click();
};

export const navigateCurrentPage = url =>
  driver.execute(href => {
    location.href = href;
  }, url);

export const addInternalHostname = async domain => {
  await mainPage();
  await driver.execute(d => window.app.addInternalHostname(d), domain);
};
