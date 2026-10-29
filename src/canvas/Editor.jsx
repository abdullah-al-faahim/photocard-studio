import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Group, Rect, Line, Transformer } from 'react-konva';
import { useStore } from '../state/store';
import { createNode } from '../model/nodes';
import NodeShape from './NodeShape';
import TextEditor from './TextEditor';
import ContextMenu from './ContextMenu';
import { ensureFonts, fontKey, readFileAsDataURL, pickImageFile } from './assets';
import { placeImage } from './place';
import { registry } from './registry';

const SHAPE_TOOLS = ['rect', 'ellipse', 'triangle', 'star', 'line'];
const SNAP_PX = 6;
const ACCENT = '#0d99ff';
const TOOLBAR_SPACE = 64;

export default function Editor() {
  const doc = useStore((s) => s.doc);
  const selection = useStore((s) => s.selection);
  const tool = useStore((s) => s.tool);
  const view = useStore((s) => s.view);
  const editingTextId = useStore((s) => s.editingTextId);
  const fontVersion = useStore((s) => s.fontVersion);
  const fitRequest = useStore((s) => s.fitRequest);

  const wrapRef = useRef(null);
  const stageRef = useRef(null);
  const artboardRef = useRef(null);
  const uiLayerRef = useRef(null);
  const trRef = useRef(null);
  const gesture = useRef(null);
  const spaceDown = useRef(false);

  const [size, setSize] = useState(null);
  const [guides, setGuides] = useState([]);
  const [marquee, setMarquee] = useState(null);
  const [menu, setMenu] = useState(null);
  const [panning, setPanning] = useState(false);
  const [hoverId, setHoverId] = useState(null);

  // Track the canvas container size.
  useEffect(() => {
    const el = wrapRef.current;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  // Fit the artboard into view on load / when requested.
  const fit = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    const cw = el.clientWidth, ch = el.clientHeight;
    const { width, height } = useStore.getState().doc;
    if (cw < 50 || ch < 50) return;
    const pad = Math.min(96, cw * 0.1, ch * 0.1);
    const toolbar = ch > 300 ? TOOLBAR_SPACE : 0; // keep the card clear of the floating toolbar
    const scale = Math.max(0.02, Math.min((cw - pad) / width, (ch - pad - toolbar) / height, 4));
    useStore.getState().setView({ scale, x: (cw - width * scale) / 2, y: (ch - toolbar - height * scale) / 2 });
  }, []);
  useEffect(() => { fit(); }, [fitRequest, fit]);

  // First real size → fit; later resizes keep the view centred.
  const lastSize = useRef(null);
  useEffect(() => {
    if (!size) return;
    const prev = lastSize.current;
    lastSize.current = size;
    if (!prev || prev.w < 50 || prev.h < 50) { fit(); return; }
    const v = useStore.getState().view;
    useStore.getState().setView({ x: v.x + (size.w - prev.w) / 2, y: v.y + (size.h - prev.h) / 2 });
  }, [size, fit]);

  useEffect(() => {
    registry.stage = stageRef.current;
    registry.artboard = artboardRef.current;
    registry.uiLayer = uiLayerRef.current;
    registry.fit = fit;
  });

  // Load fonts used by text layers, then redraw so measurements are right.
  useEffect(() => {
    const keys = [...new Set(doc.nodes.filter((n) => n.type === 'text').map(fontKey))];
    ensureFonts(keys).then((changed) => { if (changed) useStore.getState().bumpFonts(); });
  }, [doc.nodes]);

  // Attach the transformer to the selected layers.
  const selectedNodes = doc.nodes.filter((n) => selection.includes(n.id) && n.visible && !n.locked);
  useEffect(() => {
    const tr = trRef.current;
    const stage = stageRef.current;
    if (!tr || !stage) return;
    const konvaNodes = editingTextId ? [] : selectedNodes.map((n) => stage.findOne(`#${n.id}`)).filter(Boolean);
    tr.nodes(konvaNodes);
    tr.getLayer().batchDraw();
  });

  const single = selectedNodes.length === 1 ? selectedNodes[0] : null;
  const anchors = single && single.type === 'line'
    ? ['middle-left', 'middle-right']
    : single && single.type === 'text' && single.autoWidth
      ? ['middle-left', 'middle-right']
      : undefined;

  // Space bar toggles temporary panning.
  useEffect(() => {
    const isTyping = () => /INPUT|TEXTAREA|SELECT/.test(document.activeElement && document.activeElement.tagName);
    const down = (e) => { if (e.code === 'Space' && !isTyping()) { spaceDown.current = true; setPanning(true); e.preventDefault(); } };
    const up = (e) => { if (e.code === 'Space') { spaceDown.current = false; setPanning(false); } };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  const pointer = () => stageRef.current.getRelativePointerPosition();

  const nodeIdFromTarget = (target) => {
    let t = target;
    while (t && t !== stageRef.current) {
      if (t.hasName && t.hasName('node')) return t.id();
      t = t.getParent();
    }
    return null;
  };

  const onMeasure = useCallback((id, patch) => {
    useStore.getState().updateNodes([id], patch, { record: false });
  }, []);

  // ── Snapping ──────────────────────────────────────────────
  const snap = (konvaNode) => {
    const { doc: d, view: v } = useStore.getState();
    const id = konvaNode.id();
    const box = konvaNode.getClientRect({ relativeTo: artboardRef.current, skipShadow: true, skipStroke: true });
    const xs = [0, d.width / 2, d.width];
    const ys = [0, d.height / 2, d.height];
    d.nodes.forEach((n) => {
      if (n.id === id || !n.visible || n.rotation) return;
      xs.push(n.x, n.x + n.width / 2, n.x + n.width);
      ys.push(n.y, n.y + n.height / 2, n.y + n.height);
    });
    const tol = SNAP_PX / v.scale;
    const best = (edges, targets) => {
      let found = null;
      edges.forEach((e) => targets.forEach((t) => {
        const diff = t - e;
        if (Math.abs(diff) <= tol && (!found || Math.abs(diff) < Math.abs(found.diff))) found = { diff, at: t };
      }));
      return found;
    };
    const bx = best([box.x, box.x + box.width / 2, box.x + box.width], xs);
    const by = best([box.y, box.y + box.height / 2, box.y + box.height], ys);
    const next = [];
    if (bx) { konvaNode.x(konvaNode.x() + bx.diff); next.push({ vertical: true, at: bx.at }); }
    if (by) { konvaNode.y(konvaNode.y() + by.diff); next.push({ vertical: false, at: by.at }); }
    setGuides(next);
  };

  // ── Node drag / transform handlers (shared, stable) ─────────
  const handlers = useMemo(() => ({
    onDragStart: () => { useStore.getState().checkpoint(); },
    onDragMove: (e) => {
      if (useStore.getState().selection.length <= 1) snap(e.target);
    },
    onDragEnd: () => {
      const st = useStore.getState();
      const stage = stageRef.current;
      const pos = {};
      st.selection.forEach((id) => {
        const k = stage.findOne(`#${id}`);
        if (k) pos[id] = { x: k.x(), y: k.y() };
      });
      st.change((d) => { d.nodes.forEach((n) => { if (pos[n.id]) Object.assign(n, pos[n.id]); }); }, { record: false });
      setGuides([]);
    },
    onTransformStart: () => { useStore.getState().checkpoint(); },
    onTransform: (e) => {
      const k = e.target;
      const st = useStore.getState();
      const n = st.doc.nodes.find((x) => x.id === k.id());
      if (!n) return;
      const sx = k.scaleX(), sy = k.scaleY();
      k.scaleX(1); k.scaleY(1);
      const patch = {
        x: k.x(), y: k.y(), rotation: k.rotation(),
        width: Math.max(2, n.width * sx),
        height: n.type === 'line' ? n.height : Math.max(2, n.height * sy),
      };
      if (n.type === 'text') {
        const anchor = trRef.current && trRef.current.getActiveAnchor();
        if (Math.abs(sx - 1) > 1e-3) patch.autoWidth = false;
        if (anchor && !/middle-(left|right)|rotater/.test(anchor) && Math.abs(sy - 1) > 1e-3) patch.autoHeight = false;
        if (patch.autoHeight !== false && n.autoHeight) delete patch.height;
      }
      st.updateNodes([n.id], patch, { record: false });
    },
    onDblClick: (e) => {
      const id = nodeIdFromTarget(e.target);
      const st = useStore.getState();
      const n = st.doc.nodes.find((x) => x.id === id);
      if (!n) return;
      if (n.type === 'text') st.setEditingText(id);
      if (n.type === 'image') {
        pickImageFile().then((src) => { if (src) st.updateNodes([id], { src }); });
      }
    },
    onMouseEnter: (e) => setHoverId(e.currentTarget.id()),
    onMouseLeave: () => setHoverId(null),
  }), []);

  // ── Stage mouse handling ──────────────────────────────────
  const onMouseDown = (e) => {
    setMenu(null);
    const st = useStore.getState();
    const evt = e.evt;
    if (evt.button === 2) return;
    if (evt.button === 1 || spaceDown.current || st.tool === 'hand') {
      gesture.current = { kind: 'pan', sx: evt.clientX, sy: evt.clientY, view: st.view };
      setPanning(true);
      return;
    }
    if (st.editingTextId) st.setEditingText(null);
    const p = pointer();

    if (SHAPE_TOOLS.includes(st.tool)) {
      const node = createNode(st.tool, { x: p.x, y: p.y, width: 1, height: st.tool === 'line' ? undefined : 1 });
      st.addNodes([node]);
      gesture.current = { kind: 'create', id: node.id, start: p, type: st.tool };
      return;
    }
    if (st.tool === 'text') {
      const u = Math.min(st.doc.width, st.doc.height) / 1080;
      const node = createNode('text', {
        x: p.x, y: p.y, width: 600 * u, fontSize: 48 * u, text: 'Type something',
        fill: { type: 'solid', color: st.doc.background === '#ffffff' ? '#111111' : '#ffffff' },
      });
      st.addNodes([node]);
      st.setTool('select');
      st.setEditingText(node.id);
      return;
    }

    const id = nodeIdFromTarget(e.target);
    if (id) {
      if (evt.shiftKey) st.toggleSelect(id);
      else if (!st.selection.includes(id)) st.select([id]);
      return;
    }
    if (e.target.getParent && e.target.getParent() === trRef.current) return; // transformer handle
    if (!evt.shiftKey) st.select([]);
    gesture.current = { kind: 'marquee', start: p, additive: evt.shiftKey };
  };

  const onMouseMove = (e) => {
    const g = gesture.current;
    if (!g) return;
    const st = useStore.getState();
    const evt = e.evt;
    if (g.kind === 'pan') {
      st.setView({ x: g.view.x + evt.clientX - g.sx, y: g.view.y + evt.clientY - g.sy });
      return;
    }
    const p = pointer();
    if (g.kind === 'create') {
      let w = p.x - g.start.x, h = p.y - g.start.y;
      const shift = evt.shiftKey;
      if (g.type === 'line') {
        const len = Math.hypot(w, h);
        let rot = (Math.atan2(h, w) * 180) / Math.PI;
        if (shift) rot = Math.round(rot / 45) * 45;
        st.updateNodes([g.id], { width: Math.max(1, len), rotation: rot }, { record: false });
        return;
      }
      if (shift) { const m = Math.max(Math.abs(w), Math.abs(h)); w = Math.sign(w || 1) * m; h = Math.sign(h || 1) * m; }
      st.updateNodes([g.id], {
        x: Math.min(g.start.x, g.start.x + w), y: Math.min(g.start.y, g.start.y + h),
        width: Math.max(1, Math.abs(w)), height: Math.max(1, Math.abs(h)),
      }, { record: false });
      return;
    }
    if (g.kind === 'marquee') {
      setMarquee({ x: Math.min(g.start.x, p.x), y: Math.min(g.start.y, p.y), w: Math.abs(p.x - g.start.x), h: Math.abs(p.y - g.start.y) });
    }
  };

  const onMouseUp = () => {
    const g = gesture.current;
    gesture.current = null;
    const st = useStore.getState();
    if (!g) return;
    if (g.kind === 'pan') { setPanning(spaceDown.current); return; }
    if (g.kind === 'create') {
      const n = st.doc.nodes.find((x) => x.id === g.id);
      const u = Math.min(st.doc.width, st.doc.height) / 1080;
      if (n && n.width < 4 && (n.type === 'line' || n.height < 4)) {
        const d = 240 * u;
        st.updateNodes([g.id], n.type === 'line'
          ? { width: d, rotation: 0 }
          : { x: n.x - d / 2, y: n.y - d / 2, width: d, height: d }, { record: false });
      }
      st.setTool('select');
      return;
    }
    if (g.kind === 'marquee' && marquee) {
      const m = marquee;
      const hits = st.doc.nodes.filter((n) => n.visible && !n.locked
        && n.x < m.x + m.w && n.x + n.width > m.x && n.y < m.y + m.h && n.y + n.height > m.y).map((n) => n.id);
      st.select(g.additive ? [...new Set([...st.selection, ...hits])] : hits);
    }
    setMarquee(null);
  };

  const onWheel = (e) => {
    e.evt.preventDefault();
    const st = useStore.getState();
    const v = st.view;
    if (e.evt.ctrlKey || e.evt.metaKey) {
      const stage = stageRef.current;
      const pt = stage.getPointerPosition();
      const scale = Math.min(8, Math.max(0.05, v.scale * Math.exp(-e.evt.deltaY * 0.0025)));
      const wx = (pt.x - v.x) / v.scale, wy = (pt.y - v.y) / v.scale;
      st.setView({ scale, x: pt.x - wx * scale, y: pt.y - wy * scale });
    } else {
      st.setView({ x: v.x - e.evt.deltaX, y: v.y - e.evt.deltaY });
    }
  };

  const onContextMenu = (e) => {
    e.evt.preventDefault();
    const st = useStore.getState();
    const id = nodeIdFromTarget(e.target);
    if (id && !st.selection.includes(id)) st.select([id]);
    const rect = wrapRef.current.getBoundingClientRect();
    setMenu({ x: e.evt.clientX - rect.left, y: e.evt.clientY - rect.top, hasSelection: !!(id || st.selection.length) });
  };

  // ── Drag & drop images from the desktop ───────────────────
  const onDrop = async (e) => {
    e.preventDefault();
    const file = [...(e.dataTransfer.files || [])].find((f) => f.type.startsWith('image/'));
    if (!file) return;
    const stage = stageRef.current;
    stage.setPointersPositions(e);
    const p = stage.getRelativePointerPosition();
    const src = await readFileAsDataURL(file);
    placeImage(src, p);
  };

  return (
    <div
      ref={wrapRef}
      className={`canvas-wrap${panning ? ' is-panning' : ''}${SHAPE_TOOLS.includes(tool) || tool === 'text' ? ' is-drawing' : ''}`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      {size && (
      <Stage
        ref={stageRef}
        width={size.w}
        height={size.h}
        scaleX={view.scale}
        scaleY={view.scale}
        x={view.x}
        y={view.y}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onWheel={onWheel}
        onContextMenu={onContextMenu}
      >
        <Layer>
          <Rect width={doc.width} height={doc.height} fill="#000" shadowColor="#000" shadowBlur={30 / view.scale} shadowOpacity={0.35} listening={false} />
          <Group ref={artboardRef} clipX={0} clipY={0} clipWidth={doc.width} clipHeight={doc.height}>
            <Rect name="artboard-bg" width={doc.width} height={doc.height} fill={doc.background} />
            {doc.nodes.map((n) => (
              <NodeShape
                key={n.id}
                n={n}
                draggable={tool === 'select' && !panning && !n.locked && editingTextId !== n.id}
                hiddenText={editingTextId === n.id}
                onMeasure={onMeasure}
                fontVersion={fontVersion}
                handlers={handlers}
              />
            ))}
          </Group>
        </Layer>
        <Layer ref={uiLayerRef}>
          {hoverId && !selection.includes(hoverId) && (() => {
            const n = doc.nodes.find((x) => x.id === hoverId);
            return n ? <Rect x={n.x} y={n.y} width={n.width} height={n.height} rotation={n.rotation} stroke={ACCENT} strokeWidth={1.5 / view.scale} listening={false} /> : null;
          })()}
          {guides.map((g, i) => (
            <Line
              key={i}
              points={g.vertical ? [g.at, -10000, g.at, 10000] : [-10000, g.at, 10000, g.at]}
              stroke="#ff2d78" strokeWidth={1 / view.scale} listening={false}
            />
          ))}
          {marquee && (
            <Rect x={marquee.x} y={marquee.y} width={marquee.w} height={marquee.h} fill="#0d99ff18" stroke={ACCENT} strokeWidth={1 / view.scale} listening={false} />
          )}
          <Transformer
            ref={trRef}
            rotateEnabled
            rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
            rotationSnapTolerance={4}
            keepRatio={false}
            enabledAnchors={anchors}
            anchorSize={9}
            anchorCornerRadius={2}
            anchorStroke={ACCENT}
            anchorFill="#ffffff"
            borderStroke={ACCENT}
            borderStrokeWidth={1.5}
            rotateAnchorOffset={24}
            ignoreStroke
            boundBoxFunc={(oldBox, newBox) => (Math.abs(newBox.width) < 3 || Math.abs(newBox.height) < 3 ? oldBox : newBox)}
          />
        </Layer>
      </Stage>
      )}
      {editingTextId && <TextEditor id={editingTextId} />}
      {menu && <ContextMenu {...menu} onClose={() => setMenu(null)} />}
    </div>
  );
}
