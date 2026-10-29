import React, { useMemo, useState } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import { Trash2, BookmarkPlus } from 'lucide-react';
import { useStore } from '../state/store';
import { TEMPLATES, buildTemplate } from '../model/templates';
import { SIZE_PRESETS } from '../model/presets';
import { uid } from '../model/nodes';
import { loadUserTemplates, saveUserTemplates } from '../state/brand';
import NodeShape from '../canvas/NodeShape';
import { Select } from '../ui/controls';

const THUMB_W = 132;

function Thumb({ doc }) {
  const fontVersion = useStore((s) => s.fontVersion);
  const s = THUMB_W / doc.width;
  return (
    <Stage width={THUMB_W} height={doc.height * s} scaleX={s} scaleY={s} listening={false}>
      <Layer listening={false}>
        <Rect width={doc.width} height={doc.height} fill={doc.background} />
        {doc.nodes.map((n) => <NodeShape key={n.id} n={n} fontVersion={fontVersion} />)}
      </Layer>
    </Stage>
  );
}

// Content the user already put in (photo, headline…) carries over when
// switching to another layout, matched by layer name.
const CARRY = ['Photo', 'Headline', 'Tag', 'Kicker', 'Summary', 'Quote', 'Speaker', 'Role', 'Speaker photo'];
function carryOver(fromDoc, toDoc) {
  const src = {};
  fromDoc.nodes.forEach((n) => { if (CARRY.includes(n.name)) src[n.name] = n; });
  toDoc.nodes.forEach((n) => {
    const s = src[n.name] || (n.name === 'Kicker' && src.Tag) || (n.name === 'Tag' && src.Kicker);
    if (!s || s.type !== n.type) return;
    if (n.type === 'image' && s.src) Object.assign(n, { src: s.src, zoom: s.zoom, focusX: s.focusX, focusY: s.focusY });
    if (n.type === 'text') n.text = s.text;
  });
  return toDoc;
}

export default function TemplatesPanel() {
  const doc = useStore((s) => s.doc);
  const brand = useStore((s) => s.brand);
  const [sizeId, setSizeId] = useState(() => (SIZE_PRESETS.find((p) => p.w === doc.width && p.h === doc.height) || SIZE_PRESETS[1]).id);
  const [userTpls, setUserTpls] = useState(loadUserTemplates);
  const size = SIZE_PRESETS.find((p) => p.id === sizeId);
  const st = useStore.getState();

  const builtIns = useMemo(
    () => TEMPLATES.map((t) => ({ tpl: t, doc: buildTemplate(t, size.w, size.h, brand) })),
    [size, brand],
  );

  const apply = (next) => {
    const fresh = carryOver(st.doc, JSON.parse(JSON.stringify(next)));
    fresh.nodes.forEach((n) => { n.id = uid(); });
    st.change(() => fresh);
    st.select([]);
    st.requestFit();
  };

  const [naming, setNaming] = useState(null);
  const saveCurrent = () => {
    const name = (naming || '').trim();
    setNaming(null);
    if (!name) return;
    const list = [{ id: uid(), name, doc: { ...JSON.parse(JSON.stringify(doc)), name } }, ...userTpls];
    if (saveUserTemplates(list)) { setUserTpls(list); st.showToast('Saved to My templates'); } else {
      st.showToast('Not enough storage — try removing large photos first', 'error');
    }
  };

  const remove = (id) => {
    const list = userTpls.filter((t) => t.id !== id);
    saveUserTemplates(list);
    setUserTpls(list);
  };

  return (
    <div className="templates">
      <label className="field-label">Size</label>
      <Select value={sizeId} onChange={setSizeId} options={SIZE_PRESETS.map((p) => ({ value: p.id, label: `${p.label} — ${p.w}×${p.h}` }))} />
      <p className="hint">Your photo and headline carry over when you switch layouts.</p>
      <div className="tpl-grid">
        {builtIns.map(({ tpl, doc: d }) => (
          <button key={tpl.id} className="tpl" onClick={() => apply(d)} title={`Use “${tpl.name}”`}>
            <Thumb doc={d} />
            <span>{tpl.name}</span>
          </button>
        ))}
      </div>
      <div className="section-head spaced">
        <span>My templates</span>
        <button className="btn small" onClick={() => setNaming(doc.name || 'My template')}><BookmarkPlus size={14} /> Save current</button>
      </div>
      {naming !== null && (
        <div className="row">
          <input
            autoFocus className="text-input" value={naming} placeholder="Template name"
            onChange={(e) => setNaming(e.target.value)}
            onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') saveCurrent(); if (e.key === 'Escape') setNaming(null); }}
          />
          <button className="btn small primary" onClick={saveCurrent}>Save</button>
        </div>
      )}
      {!userTpls.length && <p className="hint">Save any design here to reuse it for future news cards.</p>}
      <div className="tpl-grid">
        {userTpls.map((t) => (
          <div key={t.id} className="tpl">
            <button className="tpl-hit" onClick={() => apply(t.doc)} title={`Use “${t.name}”`}><Thumb doc={t.doc} /></button>
            <span>{t.name}</span>
            <button className="tpl-del" title="Delete template" onClick={() => remove(t.id)}><Trash2 size={13} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
