import React from 'react';
import {
  AlignStartVertical, AlignCenterVertical, AlignEndVertical, AlignStartHorizontal, AlignCenterHorizontal,
  AlignEndHorizontal, AlignHorizontalDistributeCenter, AlignVerticalDistributeCenter, AlignLeft, AlignCenter,
  AlignRight, AlignJustify, AlignVerticalJustifyStart, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd,
  Italic, Underline, CaseUpper, Plus, Minus, ImageUp, Trash2, Copy, Lock, Unlock, FlipHorizontal2,
} from 'lucide-react';
import { useStore } from '../state/store';
import { FONTS, FONT_WEIGHTS, SIZE_PRESETS } from '../model/presets';
import { TYPE_LABEL } from '../model/nodes';
import { pickImageFile } from '../canvas/assets';
import { Section, Row, NumberField, Slider, Select, Segmented, IconButton, ColorField, Toggle } from '../ui/controls';

const I = 15;

function FillEditor({ fill, onChange, allowNone = true }) {
  const kind = fill ? fill.type : 'none';
  const opts = [{ value: 'solid', label: 'Solid' }, { value: 'linear', label: 'Gradient' }];
  if (allowNone) opts.unshift({ value: 'none', label: 'None' });
  const setKind = (k) => {
    if (k === 'none') return onChange(null);
    const base = fill && fill.type === 'solid' ? fill.color : fill ? fill.from : '#e53935';
    if (k === 'solid') return onChange({ type: 'solid', color: base });
    return onChange({ type: 'linear', from: base, to: '#000000', angle: 180 });
  };
  return (
    <>
      <Segmented value={kind} onChange={setKind} options={opts} />
      {kind === 'solid' && <ColorField value={fill.color} onChange={(color) => onChange({ ...fill, color })} />}
      {kind === 'linear' && (
        <>
          <ColorField label="From" value={fill.from} onChange={(from) => onChange({ ...fill, from })} />
          <ColorField label="To" value={fill.to} onChange={(to) => onChange({ ...fill, to })} />
          <Row>
            <NumberField label="∠" value={fill.angle} suffix="°" onChange={(angle) => onChange({ ...fill, angle })} />
            <IconButton icon={<FlipHorizontal2 size={I} />} title="Swap colours" onClick={() => onChange({ ...fill, from: fill.to, to: fill.from })} />
          </Row>
        </>
      )}
    </>
  );
}

function ShadowEditor({ n, upd }) {
  const sh = n.shadow;
  const u = Math.max(1, n.width / 300);
  return (
    <Section
      title="Shadow"
      action={<IconButton icon={sh ? <Minus size={I} /> : <Plus size={I} />} title={sh ? 'Remove shadow' : 'Add shadow'}
        onClick={() => upd({ shadow: sh ? null : { color: '#00000080', blur: 12 * u, x: 0, y: 4 * u } })} />}
    >
      {sh && (
        <>
          <ColorField value={sh.color} onChange={(color) => upd({ shadow: { ...sh, color } })} />
          <Row>
            <NumberField label="X" value={sh.x} onChange={(x) => upd({ shadow: { ...sh, x } })} />
            <NumberField label="Y" value={sh.y} onChange={(y) => upd({ shadow: { ...sh, y } })} />
            <NumberField label="Blur" value={sh.blur} min={0} onChange={(blur) => upd({ shadow: { ...sh, blur } })} />
          </Row>
        </>
      )}
    </Section>
  );
}

function StrokeEditor({ n, upd, title = 'Stroke' }) {
  const on = !!(n.stroke && n.strokeWidth);
  return (
    <Section
      title={title}
      action={<IconButton icon={on ? <Minus size={I} /> : <Plus size={I} />} title={on ? 'Remove stroke' : 'Add stroke'}
        onClick={() => upd(on ? { stroke: null, strokeWidth: 0 } : { stroke: '#ffffff', strokeWidth: 4 })} />}
    >
      {on && (
        <>
          <ColorField value={n.stroke} onChange={(stroke) => upd({ stroke })} />
          <NumberField label="Weight" value={n.strokeWidth} min={0} onChange={(strokeWidth) => upd({ strokeWidth })} />
        </>
      )}
    </Section>
  );
}

function TextProps({ n, upd }) {
  const fontOptions = [
    ...FONTS.filter((f) => f.script === 'bn').map((f) => ({ value: f.family, label: `${f.family} · বাংলা`, style: { fontFamily: f.family } })),
    ...FONTS.filter((f) => f.script === 'en').map((f) => ({ value: f.family, label: f.family, style: { fontFamily: f.family } })),
  ];
  return (
    <>
      <Section title="Text">
        <textarea className="text-content" value={n.text} rows={3} onChange={(e) => upd({ text: e.target.value }, 'text')} />
        <p className="hint">Tokens: {'{date}'} · {'{date_bn}'} · {'{time}'}</p>
        <Select value={n.fontFamily} onChange={(fontFamily) => upd({ fontFamily })} options={fontOptions} style={{ fontFamily: n.fontFamily }} />
        <Row>
          <Select value={n.fontWeight} onChange={(fontWeight) => upd({ fontWeight })} options={FONT_WEIGHTS} />
          <NumberField label="Size" value={n.fontSize} min={4} onChange={(fontSize) => upd({ fontSize })} width={92} />
        </Row>
        <Row>
          <NumberField label="Line" value={n.lineHeight} step={0.05} min={0.5} max={4} onChange={(lineHeight) => upd({ lineHeight })} title="Line height" />
          <NumberField label="Letter" value={n.letterSpacing} step={0.5} onChange={(letterSpacing) => upd({ letterSpacing })} title="Letter spacing (ignored for Bengali)" />
        </Row>
        <Row>
          <Segmented value={n.align} onChange={(align) => upd({ align })} options={[
            { value: 'left', icon: <AlignLeft size={I} /> }, { value: 'center', icon: <AlignCenter size={I} /> },
            { value: 'right', icon: <AlignRight size={I} /> }, { value: 'justify', icon: <AlignJustify size={I} /> },
          ]} />
          <Segmented value={n.verticalAlign} onChange={(verticalAlign) => upd({ verticalAlign, autoHeight: false })} options={[
            { value: 'top', icon: <AlignVerticalJustifyStart size={I} /> }, { value: 'middle', icon: <AlignVerticalJustifyCenter size={I} /> },
            { value: 'bottom', icon: <AlignVerticalJustifyEnd size={I} /> },
          ]} />
        </Row>
        <Row>
          <IconButton icon={<Italic size={I} />} title="Italic" active={n.italic} onClick={() => upd({ italic: !n.italic })} />
          <IconButton icon={<Underline size={I} />} title="Underline" active={n.underline} onClick={() => upd({ underline: !n.underline })} />
          <IconButton icon={<CaseUpper size={I} />} title="Uppercase" active={n.uppercase} onClick={() => upd({ uppercase: !n.uppercase })} />
          <Segmented
            value={n.autoWidth ? 'width' : n.autoHeight ? 'height' : 'fixed'}
            onChange={(v) => upd({ autoWidth: v === 'width', autoHeight: v !== 'fixed' })}
            options={[{ value: 'width', label: 'Auto W', title: 'Grow width to fit' }, { value: 'height', label: 'Auto H', title: 'Fixed width, grow height' }, { value: 'fixed', label: 'Fixed', title: 'Fixed box' }]}
          />
        </Row>
      </Section>
      <Section title="Text colour">
        <FillEditor fill={n.fill} onChange={(fill) => upd({ fill })} allowNone={false} />
      </Section>
      <Section
        title="Text outline"
        action={<IconButton icon={n.textStroke ? <Minus size={I} /> : <Plus size={I} />} title="Outline"
          onClick={() => upd(n.textStroke ? { textStroke: null, textStrokeWidth: 0 } : { textStroke: '#000000', textStrokeWidth: Math.max(1, n.fontSize / 16) })} />}
      >
        {n.textStroke && (
          <>
            <ColorField value={n.textStroke} onChange={(textStroke) => upd({ textStroke })} />
            <NumberField label="Weight" value={n.textStrokeWidth} min={0} step={0.5} onChange={(textStrokeWidth) => upd({ textStrokeWidth })} />
          </>
        )}
      </Section>
      <Section
        title="Text background"
        action={<IconButton icon={n.background ? <Minus size={I} /> : <Plus size={I} />} title="Background box"
          onClick={() => upd(n.background ? { background: null, padding: 0 } : { background: '#c62828', padding: Math.round(n.fontSize * 0.35) })} />}
      >
        {n.background && (
          <>
            <ColorField value={n.background} onChange={(background) => upd({ background })} />
            <Row>
              <NumberField label="Pad" value={n.padding} min={0} onChange={(padding) => upd({ padding })} />
              <NumberField label="Radius" value={n.cornerRadius} min={0} onChange={(cornerRadius) => upd({ cornerRadius })} />
            </Row>
          </>
        )}
      </Section>
    </>
  );
}

function ImageProps({ n, upd }) {
  return (
    <>
      <Section title="Image">
        <button className="btn wide" onClick={() => pickImageFile().then((src) => src && upd({ src, zoom: 1, focusX: 0.5, focusY: 0.5 }))}>
          <ImageUp size={I} /> {n.src ? 'Replace photo' : 'Choose photo'}
        </button>
        <Segmented value={n.fit} onChange={(fit) => upd({ fit })} options={[
          { value: 'cover', label: 'Fill' }, { value: 'contain', label: 'Fit' }, { value: 'stretch', label: 'Stretch' },
        ]} />
        <Slider label="Zoom" value={n.zoom} min={0.2} max={4} step={0.01} format={(v) => `${Math.round(v * 100)}%`} onChange={(zoom) => upd({ zoom })} />
        <Slider label="Horizontal position" value={n.focusX} min={0} max={1} step={0.005} format={(v) => `${Math.round(v * 100)}%`} onChange={(focusX) => upd({ focusX })} />
        <Slider label="Vertical position" value={n.focusY} min={0} max={1} step={0.005} format={(v) => `${Math.round(v * 100)}%`} onChange={(focusY) => upd({ focusY })} />
        <NumberField label="Radius" value={n.cornerRadius} min={0} onChange={(cornerRadius) => upd({ cornerRadius })} />
      </Section>
      <Section title="Adjust">
        <Slider label="Brightness" value={n.brightness} min={-0.6} max={0.6} step={0.01} format={(v) => Math.round(v * 100)} onChange={(brightness) => upd({ brightness })} />
        <Slider label="Contrast" value={n.contrast} min={-60} max={60} step={1} onChange={(contrast) => upd({ contrast })} />
        <Slider label="Blur" value={n.blur} min={0} max={40} step={1} onChange={(blur) => upd({ blur })} />
        <Toggle label="Black & white" checked={n.grayscale} onChange={(grayscale) => upd({ grayscale })} />
      </Section>
      <StrokeEditor n={n} upd={upd} title="Border" />
    </>
  );
}

function ShapeProps({ n, upd }) {
  if (n.type === 'line') {
    return (
      <Section title="Line">
        <ColorField value={n.stroke} onChange={(stroke) => upd({ stroke })} />
        <Row>
          <NumberField label="Weight" value={n.strokeWidth} min={1} onChange={(strokeWidth) => upd({ strokeWidth, height: strokeWidth })} />
          <Toggle label="Dashed" checked={n.dash} onChange={(dash) => upd({ dash })} />
        </Row>
      </Section>
    );
  }
  return (
    <>
      <Section title="Fill">
        <FillEditor fill={n.fill} onChange={(fill) => upd({ fill })} />
      </Section>
      {n.type === 'rect' && (
        <Section title="Corners">
          <NumberField label="Radius" value={n.cornerRadius} min={0} onChange={(cornerRadius) => upd({ cornerRadius })} />
        </Section>
      )}
      {n.type === 'star' && (
        <Section title="Star">
          <Row>
            <NumberField label="Points" value={n.points} min={3} max={40} onChange={(points) => upd({ points: Math.round(points) })} />
            <NumberField label="Inner" value={n.innerRatio} min={0.05} max={1} step={0.05} onChange={(innerRatio) => upd({ innerRatio })} />
          </Row>
        </Section>
      )}
      <StrokeEditor n={n} upd={upd} />
    </>
  );
}

function AlignBar({ count }) {
  const st = useStore.getState();
  const b = (edge, icon, title) => <IconButton key={edge} icon={icon} title={title} onClick={() => st.align(edge)} />;
  return (
    <Section title={count === 1 ? 'Align to canvas' : `Align ${count} layers`}>
      <div className="align-bar">
        {b('left', <AlignStartVertical size={I} />, 'Align left')}
        {b('hcenter', <AlignCenterVertical size={I} />, 'Align horizontal centres')}
        {b('right', <AlignEndVertical size={I} />, 'Align right')}
        {b('top', <AlignStartHorizontal size={I} />, 'Align top')}
        {b('vcenter', <AlignCenterHorizontal size={I} />, 'Align vertical centres')}
        {b('bottom', <AlignEndHorizontal size={I} />, 'Align bottom')}
        <IconButton icon={<AlignHorizontalDistributeCenter size={I} />} title="Distribute horizontally" disabled={count < 3} onClick={() => st.distribute('h')} />
        <IconButton icon={<AlignVerticalDistributeCenter size={I} />} title="Distribute vertically" disabled={count < 3} onClick={() => st.distribute('v')} />
      </div>
    </Section>
  );
}

function DocumentProps() {
  const doc = useStore((s) => s.doc);
  const st = useStore.getState();
  const preset = SIZE_PRESETS.find((p) => p.w === doc.width && p.h === doc.height);
  const setDoc = (patch, key) => st.change((d) => { Object.assign(d, patch); }, { key });
  return (
    <>
      <Section title="Design">
        <input className="text-input" value={doc.name} onChange={(e) => setDoc({ name: e.target.value }, 'docname')} />
      </Section>
      <Section title="Canvas size">
        <Select
          value={preset ? preset.id : 'custom'}
          onChange={(id) => { const p = SIZE_PRESETS.find((x) => x.id === id); if (p) { setDoc({ width: p.w, height: p.h }); st.requestFit(); } }}
          options={[...SIZE_PRESETS.map((p) => ({ value: p.id, label: `${p.label} — ${p.w}×${p.h}` })), { value: 'custom', label: 'Custom' }]}
        />
        <Row>
          <NumberField label="W" value={doc.width} min={50} max={8000} onChange={(width) => setDoc({ width: Math.round(width) }, 'docw')} />
          <NumberField label="H" value={doc.height} min={50} max={8000} onChange={(height) => setDoc({ height: Math.round(height) }, 'doch')} />
        </Row>
        <p className="hint">Resizing the canvas keeps layers where they are. Pick a template again to re-flow it for the new size.</p>
      </Section>
      <Section title="Background">
        <ColorField value={doc.background} onChange={(background) => setDoc({ background }, 'docbg')} />
      </Section>
      <Section title="Tips">
        <ul className="tips">
          <li>Drop a photo onto a photo slot to fill it.</li>
          <li>Double-click text to edit it on the canvas.</li>
          <li>Hold <kbd>Space</kbd> and drag to pan; <kbd>Ctrl</kbd> + scroll to zoom.</li>
          <li>Hold <kbd>Shift</kbd> while drawing for perfect squares / circles.</li>
        </ul>
      </Section>
    </>
  );
}

export default function PropertiesPanel() {
  const selection = useStore((s) => s.selection);
  const nodes = useStore((s) => s.doc.nodes);
  const selected = nodes.filter((n) => selection.includes(n.id));
  const st = useStore.getState();

  if (!selected.length) return <aside className="panel right"><DocumentProps /></aside>;

  const ids = selected.map((n) => n.id);
  const upd = (patch, key) => st.updateNodes(ids, patch, { key: `${key || Object.keys(patch).join(',')}:${ids.join()}` });
  const n = selected.length === 1 ? selected[0] : null;

  return (
    <aside className="panel right">
      <div className="panel-title">
        <span>{n ? (n.name || TYPE_LABEL[n.type]) : `${selected.length} layers`}</span>
        <div className="row tight">
          <IconButton icon={selected.every((x) => x.locked) ? <Lock size={I} /> : <Unlock size={I} />} title="Lock" onClick={() => upd({ locked: !selected.every((x) => x.locked) })} />
          <IconButton icon={<Copy size={I} />} title="Duplicate" onClick={st.duplicateSelection} />
          <IconButton icon={<Trash2 size={I} />} title="Delete" onClick={st.deleteSelection} />
        </div>
      </div>
      <AlignBar count={selected.length} />
      {n && (
        <Section title="Position & size">
          <Row>
            <NumberField label="X" value={n.x} onChange={(x) => upd({ x })} />
            <NumberField label="Y" value={n.y} onChange={(y) => upd({ y })} />
          </Row>
          <Row>
            <NumberField label="W" value={n.width} min={1} onChange={(width) => upd(n.type === 'text' ? { width, autoWidth: false } : { width })} />
            <NumberField label="H" value={n.height} min={1} disabled={n.type === 'line'}
              onChange={(height) => upd(n.type === 'text' ? { height, autoHeight: false, autoWidth: false } : { height })} />
          </Row>
          <NumberField label="↻" value={n.rotation} suffix="°" onChange={(rotation) => upd({ rotation })} title="Rotation" />
        </Section>
      )}
      <Section title="Layer">
        <Slider label="Opacity" value={Math.round((n ? n.opacity : selected[0].opacity) * 100)} min={0} max={100}
          format={(v) => `${v}%`} onChange={(v) => upd({ opacity: v / 100 })} />
      </Section>
      {n && n.type === 'text' && <TextProps n={n} upd={upd} />}
      {n && n.type === 'image' && <ImageProps n={n} upd={upd} />}
      {n && !['text', 'image'].includes(n.type) && <ShapeProps n={n} upd={upd} />}
      {n && <ShadowEditor n={n} upd={upd} />}
    </aside>
  );
}
