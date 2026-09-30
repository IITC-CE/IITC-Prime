import { native } from './app.js';

// On iOS a focused form field adds another "Done" button, above the keyboard
const CLOSE_BUTTON = () =>
  driver.isIOS
    ? '-ios class chain:**/XCUIElementTypeNavigationBar/XCUIElementTypeButton[`name == "Done"`]'
    : 'android=new UiSelector().text("✕")';

// $$ makes one element query, $().isExisting() two, and each is slow on iOS
const isPopupShown = async () => (await $$(CLOSE_BUTTON()).length) > 0;

export const waitForPopup = async ({ shown = true, timeout } = {}) => {
  await native();
  await driver.waitUntil(async () => (await isPopupShown()) === shown, {
    timeout,
    timeoutMsg: shown ? 'popup did not appear' : 'popup did not close',
  });
};

/** Asserts that no popup appears within a short window. */
export const expectNoPopup = async () => {
  await native();
  await driver.pause(2000);
  expect(await isPopupShown()).toBe(false);
};

export const closePopup = async () => {
  await native();
  // A tap during the sheet's own animation can be lost
  for (let attempt = 0; attempt < 3 && (await isPopupShown()); attempt++) {
    await $(CLOSE_BUTTON())
      .click()
      .catch(() => {});
    await waitForPopup({ shown: false, timeout: 3000 }).catch(() => {});
  }
  if (await isPopupShown()) throw new Error('popup did not close');
};
