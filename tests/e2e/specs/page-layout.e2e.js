import { mainPage, native, resetApp } from '../helpers/app.js';
import { MENU_BUTTON, openDemo, resetPanel, tap, waitForPanel } from '../helpers/panel.js';

const SETTINGS_BUTTON = 'Settings';
const BACK_BUTTON = 'Back';
// Back exists only on Settings, so it marks that screen as open
const BACK = `~${BACK_BUTTON}`;
const PANEL_TITLE = '~IITC Prime';

let mainContext = null;

/**
 * One map status update: it rewrites the MapStateBar counter, which schedules a layout pass.
 * On the open page that pass lays the page out normally; fired right after the tap on Settings it
 * lands inside the transition, which holds the page transformed, and the root is laid out off the
 * screen. Nothing follows a single update, so nothing lays the page back and the check has time.
 *
 * The count has to differ from the last one, or the store update changes nothing to lay out.
 */
const fireOneMapUpdate = async count => {
  await driver.switchAppiumContext(mainContext);
  await driver.execute(n => {
    window.app.setMapStatus(
      { hasPortals: false, minLinkLength: 0, formattedLength: '200km' },
      { short: 'refreshing', progressPercent: n % 100 },
      { active: n, hasActive: true, failed: 0, hasFailed: false }
    );
  }, count);
  await native();
};

/** The panel title stands in for the whole root: it is on screen only while the root is. */
const mainContentProblem = async () => {
  await native();
  const { width } = await driver.getWindowSize();
  const titles = await $$(PANEL_TITLE);
  const rect = titles.length ? await driver.getElementRect(await titles[0].elementId) : null;
  if (!rect) return 'the bottom panel is gone from the main page';
  if (rect.x < 0 || rect.x + rect.width > width) {
    return `the main content sits off the page: x=${rect.x}, width=${rect.width}, screen=${width}`;
  }
  return null;
};

/** A trip that found the bug leaves the page broken, with the Settings button off the screen. */
const settleMainPage = async seed => {
  for (let attempt = 1; attempt <= 5; attempt++) {
    if (!(await mainContentProblem())) return;
    await fireOneMapUpdate(seed * 10 + attempt);
  }
  throw new Error(`the main page could not be laid out again: ${await mainContentProblem()}`);
};

describe('Main page layout', function () {
  this.timeout(300000);

  before(async function () {
    // A Page shares its native view with the transition's controller only on iOS
    if (!driver.isIOS) this.skip();
    await resetApp();
    await openDemo();
    await mainPage();
    mainContext = await driver.getContext();
    await native();
  });

  beforeEach(resetPanel);

  it('keeps the root laid out over the page across trips to Settings', async () => {
    await tap(MENU_BUTTON);
    await waitForPanel('middle');

    for (let trip = 1; trip <= 6; trip++) {
      await settleMainPage(trip);
      await tap(SETTINGS_BUTTON);
      await fireOneMapUpdate(trip);
      await $(BACK).waitForDisplayed({ timeoutMsg: `Settings did not open (trip ${trip})` });
      await tap(BACK_BUTTON);
      // Off-screen content never becomes displayed; report the geometry, not a timeout
      await $(PANEL_TITLE)
        .waitForDisplayed({ timeout: 5000 })
        .catch(() => {});
      const problem = await mainContentProblem();
      if (problem) throw new Error(`${problem} (trip ${trip})`);
    }
  });
});
