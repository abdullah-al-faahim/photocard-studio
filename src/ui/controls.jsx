import React, { useEffect, useRef, useState } from 'react';
import { SWATCHES } from '../model/presets';

export function Section({ title, action, children }) {
  return (
    <section className="section">
      {(title || action) && (
        <header className="section-head">
          <span>{title}</span>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export const Row = ({ children, className = '' }) => <div className={`row ${className}`}>{children}</div>;

const round = (v, p = 2) => Math.round(v * 10 ** p) / 10 ** p;

// Number field whose label can be dragged left/right to scrub the value.
export function NumberField({ label, value, onChange, min = -Infinity, max = Infinity, step = 1, suffix, title, width }) {
  const [draft, setDraft] = useState(null);
  const scrub = useRef(null);
  const shown = draft ?? (Number.isFinite(value) ? String(round(value)) : '');
  const clamp = (v) => Math.min(max, Math.max(min, v));

  const onPointerDown = (e) => {
    e.preventDefault();
    scrub.current = { x: e.clientX, v: Number(value) || 0 };
    const move = (ev) => {
      const dx = ev.clientX - scrub.current.x;
      const mult = ev.shiftKey ? 10 : 1;
      onChange(clamp(round(scrub.current.v + Math.round(dx / 2) * step * mult)));
    };
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const commit = () => {
    if (draft === null) return;
    const v = parseFloat(draft);
    if (Number.isFinite(v)) onChange(clamp(v));
    setDraft(null);
  };

  return (
    <label className="num" title={title} style={width ? { width } : undefined}>
      {label && <span className="num-label" onPointerDown={onPointerDown}>{label}</span>}
      <input
        value={shown}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { commit(); e.target.blur(); }
          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            const d = (e.key === 'ArrowUp' ? 1 : -1) * step * (e.shiftKey ? 10 : 1);
            onChange(clamp(round((Number(value) || 0) + d)));
            setDraft(null);
          }
          if (e.key === 'Escape') { setDraft(null); e.target.blur(); }
        }}
      />
      {suffix && <span className="num-suffix">{suffix}</span>}
    </label>
  );
}

export function Slider({ label, value, onChange, min = 0, max = 100, step = 1, format = (v) => v }) {
  return (
    <div className="slider">
      <div className="slider-top"><span>{label}</span><span className="muted">{format(value)}</span></div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} />
    </div>
  );
}

export function Select({ value, onChange, options, style }) {
  return (
    <select className="select" value={value} onChange={(e) => onChange(e.target.value)} style={style}>
      {options.map((o) => (typeof o === 'string'
        ? <option key={o} value={o}>{o}</option>
        : <option key={o.value} value={o.value} style={o.style}>{o.label}</option>))}
    </select>
  );
}

export function Segmented({ value, onChange, options }) {
  return (
    <div className="segmented">
      {options.map((o) => (
        <button key={o.value} title={o.title || o.value} className={value === o.value ? 'on' : ''} onClick={() => onChange(o.value)}>
          {o.icon || o.label}
        </button>
      ))}
    </div>
  );
}

export function IconButton({ icon, title, onClick, active, disabled, className = '' }) {
  return (
    <button className={`icon-btn ${active ? 'on' : ''} ${className}`} title={title} onClick={onClick} disabled={disabled}>
      {icon}
    </button>
  );
}

// Hex colours may carry alpha (#rrggbbaa).
export function splitColor(c) {
  let hex = (c || '#000000').replace('#', '');
  if (hex.length === 3) hex = hex.split('').map((x) => x + x).join('');
  const rgb = `#${hex.slice(0, 6).padEnd(6, '0')}`;
  const a = hex.length >= 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
  return { rgb, a };
}
export function joinColor(rgb, a) {
  if (a >= 0.999) return rgb;
  return rgb + Math.round(Math.max(0, a) * 255).toString(16).padStart(2, '0');
}

export function ColorField({ value, onChange, label }) {
  const { rgb, a } = splitColor(value);
  const [open, setOpen] = useState(false);
  const [hex, setHex] = useState(rgb);
  const wrap = useRef(null);
  useEffect(() => setHex(rgb), [rgb]);
  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (wrap.current && !wrap.current.contains(e.target)) setOpen(false); };
    window.addEventListener('mousedown', close);
    return () => window.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div className="color-field" ref={wrap}>
      {label && <span className="color-label">{label}</span>}
      <button className="swatch" onClick={() => setOpen(!open)} title="Pick colour">
        <span style={{ background: value }} />
      </button>
      <input
        className="hex"
        value={hex.replace('#', '').toUpperCase()}
        onChange={(e) => setHex(`#${e.target.value.replace(/[^0-9a-f]/gi, '').slice(0, 6)}`)}
        onBlur={() => { if (/^#[0-9a-f]{6}$/i.test(hex)) onChange(joinColor(hex, a)); else setHex(rgb); }}
        onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
      />
      <NumberField
        value={Math.round(a * 100)} min={0} max={100} suffix="%" width={56}
        onChange={(v) => onChange(joinColor(rgb, v / 100))}
      />
      {open && (
        <div className="color-pop">
          <input type="color" value={rgb} onChange={(e) => onChange(joinColor(e.target.value, a))} />
          <div className="swatches">
            {SWATCHES.map((s) => <button key={s} style={{ background: s }} onClick={() => onChange(joinColor(s, a))} />)}
          </div>
        </div>
      )}
    </div>
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle-track"><span /></span>
      <span>{label}</span>
    </label>
  );
}
