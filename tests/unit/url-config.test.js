import { describe, expect, test } from 'vitest';
import {
  addViewportParam,
  deepLinkToIntelUrl,
  isDemoUrl,
  isExternalAppSchemeUrl,
  isIntelUrl,
  isLoginUrl,
  isMainWebViewUrlAllowed,
  isPluginUrl,
  isUrlOnHostnames,
  popupUrlTarget,
} from '@/utils/url-config';

const INTERNAL = ['intel.ingress.com', 'signin.nianticspatial.com', 'example.org'];

describe('deepLinkToIntelUrl', () => {
  test.each([
    [
      'iitc://intel.ingress.com/?pll=33.359844,47.618423',
      'https://intel.ingress.com/intel?pll=33.359844,47.618423',
    ],
    ['iitc://intel?ll=1.5,2.5&z=15', 'https://intel.ingress.com/intel?ll=1.5,2.5&z=15'],
    ['iitc://intel.ingress.com/intel?pll=1,2#frag', 'https://intel.ingress.com/intel?pll=1,2'],
    ['iitc://intel.ingress.com/', 'https://intel.ingress.com/intel'],
    ['iitc://', 'https://intel.ingress.com/intel'],
    ['https://intel.ingress.com/intel?pll=1,2', 'https://intel.ingress.com/intel?pll=1,2'],
  ])('%s -> %s', (link, expected) => {
    expect(deepLinkToIntelUrl(link)).toBe(expected);
  });

  test.each([null, undefined, '', 'https://example.com/?pll=1,2', 'not a url'])(
    'rejects %s',
    link => {
      expect(deepLinkToIntelUrl(link)).toBeNull();
    }
  );
});

describe('isPluginUrl', () => {
  test.each([
    ['https://example.com/plugin.user.js', true],
    ['https://example.com/plugin.user.js?v=2', true],
    ['content://downloads/plugin', true],
    ['file:///tmp/plugin.user.js', true],
    ['https://example.com/plugin.js', false],
    ['iitc://intel?pll=1,2', false],
    [null, false],
  ])('%s -> %s', (url, expected) => {
    expect(isPluginUrl(url)).toBe(expected);
  });
});

describe('host checks', () => {
  test.each([
    ['https://intel.ingress.com/intel', true],
    ['https://demo.iitc.app/intel', true],
    ['https://intel.ingress.com.example.com/', false],
    ['not a url', false],
  ])('isIntelUrl(%s) -> %s', (url, expected) => {
    expect(isIntelUrl(url)).toBe(expected);
  });

  test('isDemoUrl', () => {
    expect(isDemoUrl('https://demo.iitc.app/intel')).toBe(true);
    expect(isDemoUrl('https://intel.ingress.com/intel')).toBe(false);
  });

  test.each([
    ['https://accounts.google.com/signin', true],
    ['https://accounts.google.co.uk/signin', true],
    ['https://accounts.google.de/signin', true],
    ['https://appleid.apple.com/auth', true],
    ['https://accounts.google.com.example.com/', false],
    ['https://google.com/', false],
  ])('isLoginUrl(%s) -> %s', (url, expected) => {
    expect(isLoginUrl(url)).toBe(expected);
  });

  test.each([
    ['https://example.org/', true],
    ['https://sub.example.org/', true],
    ['https://notexample.org/', false],
  ])('isUrlOnHostnames(%s) -> %s', (url, expected) => {
    expect(isUrlOnHostnames(url, INTERNAL)).toBe(expected);
  });

  test.each([
    ['tg://resolve?domain=x', true],
    ['mailto:a@example.com', true],
    ['https://example.com/', false],
    ['about:blank', false],
    ['JavaScript:void(0)', false],
    ['relative/path', false],
    ['', false],
  ])('isExternalAppSchemeUrl(%s) -> %s', (url, expected) => {
    expect(isExternalAppSchemeUrl(url)).toBe(expected);
  });
});

describe('popupUrlTarget', () => {
  test.each([
    ['https://intel.ingress.com/intel', 'main'],
    ['tg://resolve?domain=x', 'external'],
    ['about:blank', 'popup'],
    ['data:text/html,hi', 'popup'],
    ['https://signin.nianticspatial.com/login', 'popup'],
    ['https://accounts.google.com/o/oauth2', 'popup'],
    ['https://example.com/', 'external'],
  ])('%s -> %s', (url, expected) => {
    expect(popupUrlTarget(url, INTERNAL)).toBe(expected);
  });
});

describe('isMainWebViewUrlAllowed', () => {
  test('allows everything before the hostnames are known', () => {
    expect(isMainWebViewUrlAllowed('https://example.com/', [])).toBe(true);
  });

  test.each([
    ['about:blank', true],
    ['file:///app/index.html', true],
    ['https://intel.ingress.com/intel', true],
    ['https://accounts.google.com/signin', true],
    ['https://example.com/', false],
  ])('%s -> %s', (url, expected) => {
    expect(isMainWebViewUrlAllowed(url, INTERNAL)).toBe(expected);
  });
});

describe('addViewportParam', () => {
  test('sets the mobile or desktop viewport', () => {
    expect(addViewportParam('https://intel.ingress.com/intel', false)).toBe(
      'https://intel.ingress.com/intel?vp=m'
    );
    expect(addViewportParam('https://intel.ingress.com/intel', true)).toBe(
      'https://intel.ingress.com/intel?vp=f'
    );
  });

  test('replaces an existing viewport and keeps other params', () => {
    expect(addViewportParam('https://intel.ingress.com/intel?vp=f&pll=1,2', false)).toBe(
      'https://intel.ingress.com/intel?vp=m&pll=1%2C2'
    );
  });

  test('passes an empty URL through', () => {
    expect(addViewportParam('', true)).toBe('');
  });
});
