// Copyright (C) 2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

// SVGView parses only SVG markup, and Image decodes every data URI as base64 and
// throws on bad input, so plugin icons are checked here and fall back to a placeholder.

const DATA_URI_RE = /^data:([^,]*?),(.*)$/s;
const BASE64_RE = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

export const parseDataUri = uri => {
  const match = typeof uri === 'string' && uri.match(DATA_URI_RE);
  if (!match) return null;
  const params = match[1].split(';').map(p => p.trim().toLowerCase());
  return {
    mimeType: params[0],
    isBase64: params.includes('base64'),
    data: match[2],
  };
};

// Whitespace-free base64, or null
const cleanBase64 = data => {
  const b64 = data.replace(/\s+/g, '');
  return b64 && BASE64_RE.test(b64) ? b64 : null;
};

const decodeBase64Utf8 = b64 => {
  // atob yields bytes as Latin-1 characters; percent-encode them to decode as UTF-8
  const bytes = atob(b64);
  let percent = '';
  for (let i = 0; i < bytes.length; i++) {
    percent += '%' + bytes.charCodeAt(i).toString(16).padStart(2, '0');
  }
  return decodeURIComponent(percent);
};

// Base64 or percent-encoded SVG; null for anything else
export const svgFromDataUri = uri => {
  const parsed = parseDataUri(uri);
  if (!parsed) return null;
  let svg;
  try {
    if (parsed.isBase64) {
      const b64 = cleanBase64(parsed.data);
      if (!b64) return null;
      svg = decodeBase64Utf8(b64);
    } else {
      svg = decodeURIComponent(parsed.data);
    }
  } catch {
    return null;
  }
  return /<svg[\s>]/i.test(svg) ? svg : null;
};

// The data URI if Image can decode it, otherwise null
export const rasterDataUri = uri => {
  const parsed = parseDataUri(uri);
  const b64 = parsed?.isBase64 && cleanBase64(parsed.data);
  return b64 ? `data:${parsed.mimeType};base64,${b64}` : null;
};
