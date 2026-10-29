// Built-in news templates. Each builder lays out layers proportionally, so
// any template works at any canvas size, and pulls name/logo/colours from
// the brand kit.
import { createNode, solid, linear, newDocument } from './nodes';

const COPY = {
  bn: {
    tag: 'ব্রেকিং নিউজ',
    headline: 'রাজধানীতে টানা বৃষ্টিতে জলাবদ্ধতা, চরম দুর্ভোগে নগরবাসী',
    sub: 'আবহাওয়া অধিদপ্তর জানিয়েছে, আগামী ২৪ ঘণ্টায় ভারী বর্ষণ অব্যাহত থাকতে পারে।',
    quote: '“শিক্ষাই জাতির মেরুদণ্ড, আর সেই মেরুদণ্ড শক্ত করতে হবে আমাদের সবাইকে।”',
    speaker: 'ড. মুহাম্মদ আলী',
    role: 'শিক্ষাবিদ',
    date: '{date_bn}',
    more: 'বিস্তারিত কমেন্টে',
    headFont: 'Noto Serif Bengali', bodyFont: 'Hind Siliguri',
  },
  en: {
    tag: 'BREAKING NEWS',
    headline: 'Heavy rain floods the capital, commuters stranded for hours',
    sub: 'The Met Office says heavy rainfall is likely to continue over the next 24 hours.',
    quote: '“Education is the backbone of a nation, and all of us must make it stronger.”',
    speaker: 'Dr. Muhammad Ali',
    role: 'Educationist',
    date: '{date}',
    more: 'Read more in comments',
    headFont: 'Playfair Display', bodyFont: 'Inter',
  },
};

function logo(brand, x, y, h, u, color = '#ffffff') {
  if (brand.logo) {
    return createNode('image', { name: 'Logo', x, y, width: h * 3, height: h, src: brand.logo, fit: 'contain', focusX: 0 });
  }
  return createNode('text', {
    name: 'Logo', x, y, width: h * 6, text: brand.name, fontFamily: 'Oswald', fontWeight: '700',
    fontSize: h * 0.72, fill: solid(color), letterSpacing: 1 * u, uppercase: true, lineHeight: 1.2,
  });
}

function tag(text, x, y, u, bg, font) {
  return createNode('text', {
    name: 'Tag', x, y, width: 420 * u, text, fontFamily: font, fontWeight: '700', fontSize: 30 * u,
    fill: solid('#ffffff'), background: bg, padding: 12 * u, lineHeight: 1.3, cornerRadius: 4 * u,
    uppercase: true, letterSpacing: 2 * u, autoWidth: true,
  });
}

function footer(brand, c, W, H, u, bg) {
  const h = 70 * u;
  return [
    createNode('rect', { name: 'Footer bar', x: 0, y: H - h, width: W, height: h, fill: solid(bg) }),
    createNode('text', {
      name: 'Website', x: 40 * u, y: H - h, width: W / 2, height: h, autoHeight: false, verticalAlign: 'middle',
      text: brand.website, fontFamily: 'Inter', fontWeight: '600', fontSize: 26 * u, fill: solid('#ffffff'),
    }),
    createNode('text', {
      name: 'Date', x: W / 2 - 40 * u, y: H - h, width: W / 2, height: h, autoHeight: false, verticalAlign: 'middle',
      align: 'right', text: c.date, fontFamily: c.bodyFont, fontWeight: '500', fontSize: 26 * u, fill: solid('#ffffff'),
    }),
  ];
}

const breakingBold = (W, H, brand, c, u) => {
  const photoH = Math.round(H * 0.58);
  const pad = 48 * u;
  return {
    background: '#0d0d0d',
    nodes: [
      createNode('image', { name: 'Photo', x: 0, y: 0, width: W, height: photoH }),
      createNode('rect', { name: 'Photo fade', x: 0, y: photoH * 0.55, width: W, height: photoH * 0.45 + 2, fill: linear('#0d0d0d00', '#0d0d0dff', 180) }),
      createNode('rect', { name: 'Top bar', x: 0, y: 0, width: W, height: 10 * u, fill: linear(brand.primary, brand.secondary, 90) }),
      logo(brand, pad, pad, 64 * u, u),
      tag(c.tag, pad, photoH - 30 * u, u, brand.primary, c.bodyFont),
      createNode('text', {
        name: 'Headline', x: pad, y: photoH + 50 * u, width: W - pad * 2, text: c.headline,
        fontFamily: c.headFont, fontWeight: '700', fontSize: 64 * u, lineHeight: 1.35, fill: solid('#ffffff'),
      }),
      createNode('rect', { name: 'Accent', x: pad, y: H - 190 * u, width: 90 * u, height: 8 * u, cornerRadius: 4 * u, fill: solid(brand.secondary) }),
      createNode('text', {
        name: 'More', x: pad, y: H - 160 * u, width: W - pad * 2, text: c.more,
        fontFamily: c.bodyFont, fontWeight: '500', fontSize: 30 * u, fill: solid('#ffffffb3'),
      }),
      ...footer(brand, c, W, H, u, brand.primary),
    ],
  };
};

const fullBleed = (W, H, brand, c, u) => {
  const pad = 56 * u;
  return {
    background: '#000000',
    nodes: [
      createNode('image', { name: 'Photo', x: 0, y: 0, width: W, height: H }),
      createNode('rect', { name: 'Shade', x: 0, y: H * 0.3, width: W, height: H * 0.7, fill: linear('#00000000', '#000000f2', 180) }),
      logo(brand, pad, pad, 60 * u, u),
      createNode('text', {
        name: 'Headline', x: pad, y: H * 0.42, width: W - pad * 2, height: H * 0.4, autoHeight: false, verticalAlign: 'bottom',
        text: c.headline, fontFamily: c.headFont, fontWeight: '700', fontSize: 70 * u, lineHeight: 1.32, fill: solid('#ffffff'),
        shadow: { color: '#00000099', blur: 16 * u, x: 0, y: 4 * u },
      }),
      tag(c.tag, pad, H * 0.42 - 90 * u, u, brand.primary, c.bodyFont),
      createNode('line', { name: 'Divider', x: pad, y: H * 0.85, width: W - pad * 2, height: 3 * u, stroke: '#ffffff55', strokeWidth: 3 * u }),
      createNode('text', {
        name: 'Website', x: pad, y: H * 0.87, width: W / 2, text: brand.website,
        fontFamily: 'Inter', fontWeight: '600', fontSize: 28 * u, fill: solid('#ffffffcc'),
      }),
      createNode('text', {
        name: 'Date', x: W / 2 - pad, y: H * 0.87, width: W / 2, align: 'right', text: c.date,
        fontFamily: c.bodyFont, fontWeight: '500', fontSize: 28 * u, fill: solid('#ffffffcc'),
      }),
    ],
  };
};

const editorial = (W, H, brand, c, u) => {
  const pad = 60 * u;
  const photoH = Math.round(H * 0.46);
  return {
    background: '#f5f0e8',
    nodes: [
      logo(brand, pad, pad - 6 * u, 56 * u, u, '#1a1a2e'),
      createNode('text', {
        name: 'Date', x: W / 2 - pad, y: pad, width: W / 2, align: 'right', text: c.date,
        fontFamily: c.bodyFont, fontWeight: '500', fontSize: 26 * u, fill: solid('#1a1a2e99'),
      }),
      createNode('line', { name: 'Rule', x: pad, y: pad + 76 * u, width: W - pad * 2, height: 2 * u, stroke: '#1a1a2e', strokeWidth: 2 * u }),
      createNode('image', { name: 'Photo', x: pad, y: pad + 110 * u, width: W - pad * 2, height: photoH, cornerRadius: 14 * u }),
      createNode('text', {
        name: 'Kicker', x: pad, y: pad + 150 * u + photoH, width: W - pad * 2, text: c.tag,
        fontFamily: c.bodyFont, fontWeight: '700', fontSize: 28 * u, letterSpacing: 2 * u, uppercase: true, fill: solid(brand.primary),
      }),
      createNode('text', {
        name: 'Headline', x: pad, y: pad + 200 * u + photoH, width: W - pad * 2, text: c.headline,
        fontFamily: c.headFont, fontWeight: '700', fontSize: 60 * u, lineHeight: 1.35, fill: solid('#1a1a1a'),
      }),
      createNode('text', {
        name: 'Summary', x: pad, y: H - 210 * u, width: W - pad * 2, text: c.sub,
        fontFamily: c.bodyFont, fontWeight: '400', fontSize: 30 * u, lineHeight: 1.5, fill: solid('#1a1a1acc'),
      }),
      createNode('text', {
        name: 'Website', x: pad, y: H - 70 * u, width: W - pad * 2, text: brand.website,
        fontFamily: 'Inter', fontWeight: '600', fontSize: 24 * u, fill: solid('#1a1a2e88'),
      }),
    ],
  };
};

const quoteCard = (W, H, brand, c, u) => {
  const pad = 80 * u;
  const r = 130 * u;
  return {
    background: '#111827',
    nodes: [
      createNode('rect', { name: 'Side band', x: 0, y: 0, width: 18 * u, height: H, fill: linear(brand.primary, brand.secondary, 180) }),
      createNode('text', {
        name: 'Quote mark', x: pad - 10 * u, y: H * 0.12, width: 260 * u, text: '“', fontFamily: 'Playfair Display',
        fontWeight: '900', fontSize: 320 * u, lineHeight: 1, fill: solid(brand.primary),
      }),
      createNode('text', {
        name: 'Quote', x: pad, y: H * 0.32, width: W - pad * 2, text: c.quote,
        fontFamily: c.headFont, fontWeight: '600', fontSize: 58 * u, lineHeight: 1.45, fill: solid('#ffffff'),
      }),
      createNode('image', { name: 'Speaker photo', x: pad, y: H - 330 * u, width: r, height: r, cornerRadius: r / 2, stroke: brand.secondary, strokeWidth: 5 * u }),
      createNode('text', {
        name: 'Speaker', x: pad + r + 30 * u, y: H - 320 * u, width: W - pad * 2 - r, text: c.speaker,
        fontFamily: c.bodyFont, fontWeight: '700', fontSize: 38 * u, fill: solid('#ffffff'),
      }),
      createNode('text', {
        name: 'Role', x: pad + r + 30 * u, y: H - 260 * u, width: W - pad * 2 - r, text: c.role,
        fontFamily: c.bodyFont, fontWeight: '400', fontSize: 28 * u, fill: solid('#ffffff99'),
      }),
      ...footer(brand, c, W, H, u, '#000000'),
      logo(brand, W - pad - 300 * u, pad * 0.7, 52 * u, u),
    ],
  };
};

const splitPanel = (W, H, brand, c, u) => {
  const landscape = W > H;
  const pad = 50 * u;
  const photo = landscape
    ? { x: 0, y: 0, width: W * 0.5, height: H }
    : { x: 0, y: 0, width: W, height: H * 0.5 };
  const panel = landscape
    ? { x: W * 0.5, y: 0, w: W * 0.5, h: H }
    : { x: 0, y: H * 0.5, w: W, h: H * 0.5 };
  return {
    background: brand.primary,
    nodes: [
      createNode('image', { name: 'Photo', ...photo }),
      createNode('rect', { name: 'Panel', x: panel.x, y: panel.y, width: panel.w, height: panel.h, fill: linear(brand.primary, '#000000', 160) }),
      tag(c.tag, panel.x + pad, panel.y + pad, u, '#000000', c.bodyFont),
      createNode('text', {
        name: 'Headline', x: panel.x + pad, y: panel.y + pad + 90 * u, width: panel.w - pad * 2, text: c.headline,
        fontFamily: c.headFont, fontWeight: '700', fontSize: 58 * u, lineHeight: 1.35, fill: solid('#ffffff'),
      }),
      createNode('text', {
        name: 'Website', x: panel.x + pad, y: panel.y + panel.h - pad - 30 * u, width: panel.w - pad * 2, text: brand.website,
        fontFamily: 'Inter', fontWeight: '600', fontSize: 26 * u, fill: solid('#ffffffcc'),
      }),
      logo(brand, pad, pad, 56 * u, u),
    ],
  };
};

const headlineOnly = (W, H, brand, c, u) => {
  const pad = 80 * u;
  return {
    background: brand.primary,
    nodes: [
      createNode('ellipse', { name: 'Glow', x: W * 0.45, y: -H * 0.25, width: W, height: W, fill: solid('#ffffff14') }),
      logo(brand, pad, pad, 60 * u, u),
      tag(c.tag, pad, H * 0.3, u, '#000000', c.bodyFont),
      createNode('text', {
        name: 'Headline', x: pad, y: H * 0.3 + 100 * u, width: W - pad * 2, text: c.headline,
        fontFamily: c.headFont, fontWeight: '800', fontSize: 78 * u, lineHeight: 1.32, fill: solid('#ffffff'),
      }),
      ...footer(brand, c, W, H, u, '#00000055'),
    ],
  };
};

export const TEMPLATES = [
  { id: 'breaking', name: 'Breaking bold', build: breakingBold },
  { id: 'fullbleed', name: 'Full-bleed photo', build: fullBleed },
  { id: 'editorial', name: 'Editorial', build: editorial },
  { id: 'quote', name: 'Quote card', build: quoteCard },
  { id: 'split', name: 'Split panel', build: splitPanel },
  { id: 'headline', name: 'Headline only', build: headlineOnly },
];

export function buildTemplate(tpl, W, H, brand) {
  const c = COPY[brand.language] || COPY.bn;
  const u = Math.min(W, H) / 1080;
  const { background, nodes } = tpl.build(W, H, brand, c, u);
  const doc = newDocument(W, H, nodes, background);
  doc.name = tpl.name;
  return doc;
}
