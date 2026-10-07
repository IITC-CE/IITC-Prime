import { mainPage, native } from './app.js';

// The title marks the panel's place on the screen
const TITLE = () => (driver.isIOS ? '~IITC Prime' : 'android=new UiSelector().text("IITC Prime")');
export const MENU_BUTTON = 'Menu';
export const LAYERS_BUTTON = 'Layers';
export const RESTORE_BUTTON = 'Show panel';

const rectOf = async selector => {
  const els = await $$(selector);
  return els.length ? driver.getElementRect(await els[0].elementId) : null;
};

// At rest the title sits near 0.16, 0.54 and 0.86 of the screen height for the
// top, middle and bottom steps; the gaps between the bands catch a panel left between steps
export const BETWEEN_MIDDLE_AND_BOTTOM = 0.66;

/** The step the panel rests at, judged by the title's place on the screen, or 'between'. */
const positionOf = (y, height) => {
  if (y === null || y >= height - 10) return 'hidden';
  const at = y / height;
  if (at < 0.3) return 'top';
  if (at > 0.4 && at < 0.62) return 'middle';
  if (at > 0.78) return 'bottom';
  return 'between';
};

const titleY = async () => (await rectOf(TITLE()))?.y ?? null;

export const panelPosition = async () => {
  await native();
  const { height } = await driver.getWindowSize();
  return positionOf(await titleY(), height);
};

/** Waits until the panel stops at the given step. */
export const waitForPanel = async (position, { timeout } = {}) => {
  await native();
  const { height } = await driver.getWindowSize();
  let last = null;
  let seen;
  await driver
    .waitUntil(
      async () => {
        const y = await titleY();
        seen = positionOf(y, height);
        const settled = y === last;
        last = y;
        return settled && seen === position;
      },
      { timeout, interval: 300, timeoutMsg: `panel did not settle at ${position}` }
    )
    .catch(error => {
      throw new Error(`${error.message}, last seen at ${seen}`);
    });
};

const touch = () => driver.action('pointer', { parameters: { pointerType: 'touch' } });

/** A finger drag that stops before lifting, so the release carries no fling. */
export const drag = async (x, fromY, toY, { duration = 400 } = {}) => {
  await native();
  await touch()
    .move({ x: Math.round(x), y: Math.round(fromY) })
    .down()
    .pause(100)
    .move({ duration, x: Math.round(x), y: Math.round(toY) })
    .pause(300)
    .up()
    .perform();
};

/** A quick swipe up the middle of the screen that flings an open panel's list to its end. */
export const flingList = async () => {
  await native();
  const { width, height } = await driver.getWindowSize();
  await touch()
    .move({ x: Math.round(width / 2), y: Math.round(height * 0.8) })
    .down()
    .move({ duration: 150, x: Math.round(width / 2), y: Math.round(height * 0.3) })
    .up()
    .perform();
  await driver.pause(1500);
};

/** Drags the panel by its title row. */
export const dragPanel = async toY => {
  const { y, height } = await rectOf(TITLE());
  const { width } = await driver.getWindowSize();
  await drag(width / 2, y + height / 2, toY);
};

/** Drags across the screen's middle, over the panel's list when it is open. */
export const dragList = async (fromY, toY) => {
  const { width } = await driver.getWindowSize();
  await drag(width / 2, fromY, toY);
};

// Android appends the icon glyph of a button to its label
const button = label =>
  $(driver.isIOS ? `~${label}` : `android=new UiSelector().descriptionStartsWith("${label}")`);

export const tap = async label => {
  await native();
  await button(label).click();
};

export const resetPanel = async () => {
  const position = await panelPosition();
  if (position === 'bottom') return;
  if (position === 'hidden') {
    await tap(RESTORE_BUTTON);
  } else {
    // A release near the bottom step, as a drag to the screen edge hides the panel
    await dragPanel((await driver.getWindowSize()).height * 0.9);
  }
  await waitForPanel('bottom');
};

/**
 * Closes the dialogs shown on the first demo boot: the location permission
 * prompts and the demo welcome alert.
 */
export const dismissDialogs = async () => {
  await native();
  for (let quiet = 0; quiet < 3; ) {
    await driver.pause(1000);
    // In-app alerts are in the app's tree, system prompts only reachable as alerts
    const buttons = await $$(
      driver.isIOS
        ? '-ios class chain:**/XCUIElementTypeAlert/**/XCUIElementTypeButton'
        : 'android=new UiSelector().resourceIdMatches(".*:id/button[12]")'
    );
    if (buttons.length) {
      await buttons[0].click();
    } else if (driver.isIOS && (await driver.getAlertText().catch(() => null)) !== null) {
      await driver.execute('mobile: alert', { action: 'accept' });
    } else {
      quiet++;
      continue;
    }
    quiet = 0;
  }
};

/** Switches the main WebView to the demo server and waits for IITC to boot there. */
export const openDemo = async () => {
  await mainPage();
  const isDemo = () =>
    driver.execute(() => location.hostname === 'demo.iitc.app' && window.iitcLoaded === true);
  if (!(await isDemo())) {
    await driver.execute(() => window.app.openDemo());
    await driver.waitUntil(
      async () => {
        await mainPage();
        return isDemo().catch(() => false);
      },
      { timeout: 90000, interval: 1000, timeoutMsg: 'IITC did not boot on the demo server' }
    );
  }
  await dismissDialogs();
};
