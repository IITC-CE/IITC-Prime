import { describe, expect, test } from 'vitest';
import { rasterDataUri, svgFromDataUri } from '@/utils/data-uri';

const SVG = '<svg xmlns="http://www.w3.org/2000/svg"><text>Ω</text></svg>';
const SVG_B64 = Buffer.from(SVG, 'utf8').toString('base64');

describe('svgFromDataUri', () => {
  test('decodes percent-encoded markup', () => {
    expect(svgFromDataUri(`data:image/svg+xml,${encodeURIComponent(SVG)}`)).toBe(SVG);
  });

  test('passes through unencoded markup with a charset parameter', () => {
    expect(svgFromDataUri(`data:image/svg+xml;utf8,${SVG}`)).toBe(SVG);
  });

  test('decodes UTF-8 base64', () => {
    expect(svgFromDataUri(`data:image/svg+xml;base64,${SVG_B64}`)).toBe(SVG);
  });

  test.each([
    'data:image/svg+xml;base64,@@@',
    'data:image/svg+xml,%E0%A4%A',
    'data:image/svg+xml,<svg width="100%"></svg>',
    'data:image/svg+xml,',
    'data:image/svg+xml;base64,',
    'data:image/svg+xml;base64,==',
    'data:image/svg+xml,not svg',
    'not a data uri',
  ])('returns null for %s', uri => {
    expect(svgFromDataUri(uri)).toBeNull();
  });
});

describe('rasterDataUri', () => {
  test('keeps valid base64 and drops whitespace', () => {
    expect(rasterDataUri('data:image/PNG;base64,ab+c/d==')).toBe('data:image/png;base64,ab+c/d==');
    expect(rasterDataUri('data:image/png;base64,ab+c\n/d==')).toBe(
      'data:image/png;base64,ab+c/d=='
    );
  });

  test.each([
    'data:image/png,abcd',
    'data:image/png;base64,',
    'data:image/png;base64,==',
    'data:image/png;base64,ab*c',
    'data:image/png;base64,abcde',
    'data:image/png;base64,ab-c_d==',
    'data:image/png;base64,ab%2Bc',
  ])('returns null for %s', uri => {
    expect(rasterDataUri(uri)).toBeNull();
  });
});
