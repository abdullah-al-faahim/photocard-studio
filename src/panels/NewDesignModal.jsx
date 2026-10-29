import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useStore } from '../state/store';
import { SIZE_PRESETS } from '../model/presets';
import { TEMPLATES, buildTemplate } from '../model/templates';
import { newDocument } from '../model/nodes';
import { NumberField, Select } from '../ui/controls';

export default function NewDesignModal() {
  const st = useStore.getState();
  const [w, setW] = useState(1080);
  const [h, setH] = useState(1350);
  const [start, setStart] = useState(TEMPLATES[0].id);

  const create = () => {
    const tpl = TEMPLATES.find((t) => t.id === start);
    st.loadDoc(tpl ? buildTemplate(tpl, w, h, st.brand) : newDocument(w, h));
    st.closeModal();
  };

  return (
    <div className="modal-backdrop" onMouseDown={st.closeModal}>
      <div className="modal narrow" onMouseDown={(e) => e.stopPropagation()}>
        <header><h3>New design</h3><button className="icon-btn" onClick={st.closeModal}><X size={16} /></button></header>
        <div className="size-grid">
          {SIZE_PRESETS.map((p) => {
            const s = 46 / Math.max(p.w, p.h);
            return (
              <button key={p.id} className={`size-card${p.w === w && p.h === h ? ' on' : ''}`} onClick={() => { setW(p.w); setH(p.h); }}>
                <span className="size-shape" style={{ width: p.w * s, height: p.h * s }} />
                <strong>{p.label}</strong>
                <span className="muted">{p.w} × {p.h}</span>
              </button>
            );
          })}
        </div>
        <div className="row">
          <NumberField label="W" value={w} min={50} max={8000} onChange={(v) => setW(Math.round(v))} />
          <NumberField label="H" value={h} min={50} max={8000} onChange={(v) => setH(Math.round(v))} />
        </div>
        <label className="field-label">Start from</label>
        <Select value={start} onChange={setStart} options={[...TEMPLATES.map((t) => ({ value: t.id, label: t.name })), { value: 'blank', label: 'Blank canvas' }]} />
        <p className="hint">Your current design is replaced. Save it first if you want to keep it.</p>
        <button className="btn primary wide" onClick={create}>Create</button>
      </div>
    </div>
  );
}
