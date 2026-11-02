import { mainPage, native, resetApp } from '../helpers/app.js';
import {
  BETWEEN_MIDDLE_AND_BOTTOM,
  LAYERS_BUTTON,
  MENU_BUTTON,
  dragList,
  dragPanel,
  flingList,
  openDemo,
  resetPanel,
  tap,
  waitForPanel,
} from '../helpers/panel.js';

const screenHeight = async () => (await driver.getWindowSize()).height;

// The layers tab needs a booted IITC
describe('Bottom panel', function () {
  this.timeout(180000);

  before(async () => {
    await resetApp();
    await openDemo();
    // Enough layers for the list to scroll even at the top step
    await mainPage();
    await driver.execute(() => {
      for (let i = 1; i <= 20; i++)
        window.layerChooser.addOverlay(L.layerGroup(), `e2e layer ${i}`);
    });
  });

  beforeEach(resetPanel);

  it('opens and closes on a button tap', async () => {
    await tap(MENU_BUTTON);
    await waitForPanel('middle');
    await tap(MENU_BUTTON);
    await waitForPanel('bottom');
  });

  it('switches tabs in place', async () => {
    await tap(MENU_BUTTON);
    await waitForPanel('middle');
    await tap(LAYERS_BUTTON);
    await $(
      driver.isIOS ? '~Base layer' : 'android=new UiSelector().text("Base layer")'
    ).waitForDisplayed();
    await waitForPanel('middle');
    await tap(LAYERS_BUTTON);
    await waitForPanel('bottom');
  });

  it('snaps to the nearest step when the panel is released between steps', async () => {
    await dragPanel((await screenHeight()) * BETWEEN_MIDDLE_AND_BOTTOM);
    await waitForPanel('middle');
  });

  it('expands before scrolling a scrolled list on a swipe up', async () => {
    await tap(LAYERS_BUTTON);
    await waitForPanel('middle');
    const height = await screenHeight();
    await dragPanel(0);
    await waitForPanel('top');
    await flingList();
    await dragPanel(height / 2);
    await waitForPanel('middle');
    await dragList(height * 0.85, height * 0.4);
    await waitForPanel('top');
  });

  it('scrolls a scrolled list back before collapsing', async () => {
    await tap(LAYERS_BUTTON);
    await waitForPanel('middle');
    const height = await screenHeight();
    await dragPanel(0);
    await waitForPanel('top');
    await flingList();
    await dragList(height * 0.35, height * 0.6);
    await waitForPanel('top');
  });

  it('hides while the keyboard is shown and comes back', async () => {
    await mainPage();
    await driver.execute(() => {
      const input = document.createElement('input');
      input.id = 'e2e-input';
      // Covers the whole page, so a tap anywhere above the panel focuses it
      input.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:2147483647';
      document.body.appendChild(input);
    });
    // WKWebView shows the keyboard only for a focus from a real tap
    await native();
    const { width, height } = await driver.getWindowSize();
    await driver
      .action('pointer', { parameters: { pointerType: 'touch' } })
      .move({ x: Math.round(width / 2), y: Math.round(height / 2) })
      .down()
      .up()
      .perform();
    await waitForPanel('hidden');
    await mainPage();
    await driver.execute(() => document.getElementById('e2e-input').remove());
    await waitForPanel('bottom');
  });

  it('keeps its step across a trip to the background', async () => {
    await tap(MENU_BUTTON);
    await waitForPanel('middle');
    await driver.background(3);
    await native();
    await waitForPanel('middle');
  });

  it('keeps its step after a rotation', async () => {
    await tap(MENU_BUTTON);
    await waitForPanel('middle');
    await driver.setOrientation('LANDSCAPE');
    await driver.pause(1500);
    await driver.setOrientation('PORTRAIT');
    await waitForPanel('middle');
  });
});
