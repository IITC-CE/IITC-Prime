import vm from 'node:vm';
import { describe, expect, test, vi } from 'vitest';
import {
  switchToPane,
  userLocationLocate,
  userLocationOrientation,
  userLocationUpdate,
} from '@/utils/bridge/events-to-iitc';

const run = (script, window = {}) => vm.runInNewContext(script, { window });

describe('scripts sent before IITC has booted', () => {
  test.each([
    ['switchToPane', switchToPane('map')],
    ['userLocationLocate', userLocationLocate(1, 2, 10, true)],
    ['userLocationUpdate', userLocationUpdate(1, 2)],
    ['userLocationOrientation', userLocationOrientation(90)],
  ])('%s does not throw', (_, script) => {
    expect(run(script)).toBe(true);
  });
});

describe('scripts sent to a booted IITC', () => {
  test('switchToPane shows the pane', () => {
    const show = vi.fn();
    run(switchToPane('info'), { show });
    expect(show).toHaveBeenCalledWith('info');
  });

  test('userLocation scripts reach the plugin', () => {
    const userLocation = {
      locate: vi.fn(),
      onLocationChange: vi.fn(),
      onOrientationChange: vi.fn(),
    };
    const window = { plugin: { userLocation } };
    run(userLocationLocate(1, 2, 10, true), window);
    run(userLocationUpdate(3, 4), window);
    run(userLocationOrientation(null), window);
    expect(userLocation.locate).toHaveBeenCalledWith(1, 2, 10, true);
    expect(userLocation.onLocationChange).toHaveBeenCalledWith(3, 4);
    expect(userLocation.onOrientationChange).toHaveBeenCalledWith(null);
  });
});
