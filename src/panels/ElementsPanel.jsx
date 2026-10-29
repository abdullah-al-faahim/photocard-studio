import React from 'react';
import { Square, Circle, Triangle, Star, Minus, ImagePlus } from 'lucide-react';
import { useStore } from '../state/store';
import { createNode, solid, linear } from '../model/nodes';
import { pickImageFile } from '../canvas/assets';
import { placeImage } from '../canvas/place';

// Each preset returns layers sized for the current canvas.
function presets(doc, brand) {
  const u = Math.min(doc.width, doc.height) / 1080;
  const bn = brand.language === 'bn';
  const head = bn ? 'Noto Serif Bengali' : 'Playfair Display';
  const body = bn ? 'Hind Siliguri' : 'Inter';
  const cx = doc.width / 2, cy = doc.height / 2;
  const centered = (n) => ({ ...n, x: cx - n.width / 2, y: cy - n.height / 2 });

  return {
    text: [
      { label: bn ? 'শিরোনাম' : 'Headline', font: head, weight: 700, make: () => [centered(createNode('text', {
        name: 'Headline', width: doc.width * 0.85, text: bn ? 'এখানে শিরোনাম লিখুন' : 'Add a headline', fontFamily: head,
        fontWeight: '700', fontSize: 68 * u, lineHeight: 1.3, height: 90 * u,
      }))] },
      { label: bn ? 'উপশিরোনাম' : 'Subheading', font: body, weight: 600, make: () => [centered(createNode('text', {
        name: 'Subheading', width: doc.width * 0.8, text: bn ? 'উপশিরোনাম' : 'Add a subheading', fontFamily: body,
        fontWeight: '600', fontSize: 40 * u, height: 50 * u,
      }))] },
      { label: bn ? 'বিবরণ' : 'Body text', font: body, weight: 400, make: () => [centered(createNode('text', {
        name: 'Body', width: doc.width * 0.8, text: bn ? 'বিস্তারিত সংবাদ এখানে লিখুন।' : 'Add a short summary of the story.', fontFamily: body,
        fontWeight: '400', fontSize: 30 * u, lineHeight: 1.5, height: 45 * u,
      }))] },
      { label: '{date}', font: body, weight: 500, make: () => [centered(createNode('text', {
        name: 'Date', width: 400 * u, text: bn ? '{date_bn}' : '{date}', fontFamily: body, fontWeight: '500', fontSize: 28 * u, height: 40 * u,
      }))] },
    ],
    news: [
      { label: bn ? 'ব্রেকিং ট্যাগ' : 'Breaking tag', swatch: brand.primary, make: () => [centered(createNode('text', {
        name: 'Tag', width: 300 * u, height: 60 * u, text: bn ? 'ব্রেকিং নিউজ' : 'BREAKING NEWS', fontFamily: body, fontWeight: '700',
        fontSize: 30 * u, background: brand.primary, padding: 12 * u, cornerRadius: 4 * u, autoWidth: true, uppercase: true, letterSpacing: 2 * u,
      }))] },
      { label: bn ? 'লাইভ ব্যাজ' : 'Live badge', swatch: '#e53935', make: () => [centered(createNode('text', {
        name: 'Live badge', width: 160 * u, height: 50 * u, text: bn ? '● সরাসরি' : '● LIVE', fontFamily: body, fontWeight: '800',
        fontSize: 28 * u, background: '#e53935', padding: 10 * u, cornerRadius: 30 * u, autoWidth: true,
      }))] },
      { label: bn ? 'নিচের বার' : 'Lower bar', swatch: brand.primary, make: () => {
        const h = 90 * u;
        return [
          createNode('rect', { name: 'Lower bar', x: 0, y: doc.height - h, width: doc.width, height: h, fill: solid(brand.primary) }),
          createNode('text', {
            name: 'Lower bar text', x: 40 * u, y: doc.height - h, width: doc.width - 80 * u, height: h, autoHeight: false,
            verticalAlign: 'middle', text: brand.website, fontFamily: 'Inter', fontWeight: '600', fontSize: 30 * u,
          }),
        ];
      } },
      { label: bn ? 'গ্রেডিয়েন্ট ছায়া' : 'Photo shade', swatch: 'linear-gradient(#0000, #000)', make: () => [createNode('rect', {
        name: 'Shade', x: 0, y: doc.height * 0.4, width: doc.width, height: doc.height * 0.6, fill: linear('#00000000', '#000000e6', 180),
      })] },
      { label: bn ? 'ছবির জায়গা' : 'Photo slot', swatch: '#3a4150', make: () => [centered(createNode('image', {
        name: 'Photo', width: doc.width * 0.8, height: doc.height * 0.45, cornerRadius: 12 * u,
      }))] },
      { label: bn ? 'লোগো' : 'Logo', swatch: brand.secondary, make: () => [brand.logo
        ? createNode('image', { name: 'Logo', x: 40 * u, y: 40 * u, width: 200 * u, height: 70 * u, src: brand.logo, fit: 'contain', focusX: 0 })
        : createNode('text', { name: 'Logo', x: 40 * u, y: 40 * u, width: 300 * u, height: 60 * u, text: brand.name, fontFamily: 'Oswald', fontWeight: '700', fontSize: 44 * u, uppercase: true, autoWidth: true })] },
      { label: bn ? 'উদ্ধৃতি চিহ্ন' : 'Quote mark', swatch: brand.primary, make: () => [centered(createNode('text', {
        name: 'Quote mark', width: 200 * u, height: 200 * u, text: '“', fontFamily: 'Playfair Display', fontWeight: '900',
        fontSize: 260 * u, lineHeight: 1, fill: solid(brand.primary), autoWidth: true,
      }))] },
      { label: bn ? 'অ্যাকসেন্ট দাগ' : 'Accent line', swatch: brand.secondary, make: () => [centered(createNode('rect', {
        name: 'Accent', width: 120 * u, height: 10 * u, cornerRadius: 5 * u, fill: solid(brand.secondary),
      }))] },
    ],
    shapes: [
      { icon: Square, type: 'rect' }, { icon: Circle, type: 'ellipse' }, { icon: Triangle, type: 'triangle' },
      { icon: Star, type: 'star' }, { icon: Minus, type: 'line' },
    ].map((s) => ({ ...s, make: () => [centered(createNode(s.type, { width: 240 * u, ...(s.type === 'line' ? { width: 400 * u, height: 6 * u, strokeWidth: 6 * u } : { height: 240 * u }) }))] })),
  };
}

export default function ElementsPanel() {
  const doc = useStore((s) => s.doc);
  const brand = useStore((s) => s.brand);
  const p = presets(doc, brand);
  const add = (item) => useStore.getState().addNodes(item.make());

  return (
    <div className="elements">
      <button className="btn wide primary" onClick={() => pickImageFile().then((src) => src && placeImage(src, null))}>
        <ImagePlus size={15} /> Upload photo
      </button>
      <p className="hint">Or drag photos straight onto the canvas, or paste with Ctrl+V.</p>

      <div className="section-head spaced"><span>Text</span></div>
      <div className="el-list">
        {p.text.map((t) => (
          <button key={t.label} className="el-text" style={{ fontFamily: t.font, fontWeight: t.weight }} onClick={() => add(t)}>{t.label}</button>
        ))}
      </div>

      <div className="section-head spaced"><span>News elements</span></div>
      <div className="el-grid">
        {p.news.map((t) => (
          <button key={t.label} className="el-tile" onClick={() => add(t)}>
            <span className="el-swatch" style={{ background: t.swatch }} />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      <div className="section-head spaced"><span>Shapes</span></div>
      <div className="el-shapes">
        {p.shapes.map((s) => (
          <button key={s.type} className="el-shape" title={s.type} onClick={() => add(s)}><s.icon size={22} /></button>
        ))}
      </div>
    </div>
  );
}
