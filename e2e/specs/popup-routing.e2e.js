import {
  BROWSER_ID,
  MESSAGES_ID,
  addInternalHostname,
  mainPage,
  navigateCurrentPage,
  newPage,
  resetApp,
  returnToApp,
  tapBlankLink,
  waitForForegroundApp,
  waitForMainPageUrl,
} from '../helpers/app.js';
import { closePopup, expectNoPopup, waitForPopup } from '../helpers/popup.js';

const EXTERNAL_URL = 'https://example.com/';
const INTERNAL_HOST = 'example.org';
const INTERNAL_URL = `https://${INTERNAL_HOST}/`;

const reset = async () => {
  await resetApp();
  await closePopup();
  await mainPage();
};

describe('New window from the main page', () => {
  beforeEach(reset);

  it('opens an external site in the browser', async () => {
    await tapBlankLink(EXTERNAL_URL);
    await waitForForegroundApp(BROWSER_ID());
    await returnToApp();
    await expectNoPopup();
  });

  it('keeps Google sign-in in a popup', async () => {
    await tapBlankLink('https://accounts.google.com/');
    await waitForPopup();
  });

  it('keeps a country Google domain in a popup', async () => {
    await tapBlankLink('https://accounts.google.co.uk/');
    await waitForPopup();
  });

  it('keeps an addInternalHostname host in a popup', async () => {
    await addInternalHostname(INTERNAL_HOST);
    await tapBlankLink(INTERNAL_URL);
    await waitForPopup();
  });

  it('opens Intel in the main webview', async () => {
    await tapBlankLink('https://intel.ingress.com/intel?e2e=blank');
    await expectNoPopup();
    await waitForMainPageUrl(/e2e=blank/);
  });
});

describe('Navigation inside a popup', () => {
  beforeEach(async () => {
    await reset();
    await addInternalHostname(INTERNAL_HOST);
    await tapBlankLink(INTERNAL_URL);
    await waitForPopup();
    await newPage(/^https:\/\/example\.org\//);
  });

  it('opens an external site in the browser and closes the popup', async () => {
    await navigateCurrentPage(EXTERNAL_URL);
    await waitForForegroundApp(BROWSER_ID());
    await returnToApp();
    await waitForPopup({ shown: false });
  });

  it('moves Intel to the main webview and closes the popup', async () => {
    await navigateCurrentPage('https://intel.ingress.com/intel?e2e=popup');
    await waitForPopup({ shown: false });
    await waitForMainPageUrl(/e2e=popup/);
  });

  it('hands an app scheme to the system and closes the popup', async () => {
    await navigateCurrentPage('sms:+10000000000');
    await waitForForegroundApp(MESSAGES_ID());
    await returnToApp();
    await waitForPopup({ shown: false });
  });

  it('opens a new window in the browser and keeps the popup', async () => {
    await tapBlankLink(EXTERNAL_URL);
    await waitForForegroundApp(BROWSER_ID());
    await returnToApp();
    await waitForPopup();
  });
});
