import React from 'react';
import { useStore } from '../state/store';
import { mod } from '../ui/keys';

export default function ContextMenu({ x, y, hasSelection, onClose }) {
  const st = useStore.getState();
  const items = hasSelection ? [
    ['Copy', `${mod}C`, st.copySelection],
    ['Paste', `${mod}V`, st.paste],
    ['Duplicate', `${mod}D`, st.duplicateSelection],
    null,
    ['Bring to front', `${mod}⇧]`, () => st.reorder('front')],
    ['Bring forward', `${mod}]`, () => st.reorder('forward')],
    ['Send backward', `${mod}[`, () => st.reorder('backward')],
    ['Send to back', `${mod}⇧[`, () => st.reorder('back')],
    null,
    ['Lock / unlock', `${mod}⇧L`, () => st.updateNodes(st.selection, (n) => ({ locked: !n.locked }))],
    ['Show / hide', `${mod}⇧H`, () => st.updateNodes(st.selection, (n) => ({ visible: !n.visible }))],
    null,
    ['Delete', 'Del', st.deleteSelection],
  ] : [
    ['Paste', `${mod}V`, st.paste],
    ['Select all', `${mod}A`, st.selectAll],
    ['Zoom to fit', '⇧1', st.requestFit],
  ];
  return (
    <div className="context-menu" style={{ left: x, top: y }} onMouseDown={(e) => e.stopPropagation()}>
      {items.map((it, i) => (it ? (
        <button key={i} onClick={() => { it[2](); onClose(); }}>
          <span>{it[0]}</span><kbd>{it[1]}</kbd>
        </button>
      ) : <hr key={i} />))}
    </div>
  );
}
