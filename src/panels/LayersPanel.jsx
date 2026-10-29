import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Unlock, Square, Circle, Triangle, Star, Minus, Type, Image as ImageIcon } from 'lucide-react';
import { useStore } from '../state/store';

const ICONS = { rect: Square, ellipse: Circle, triangle: Triangle, star: Star, line: Minus, text: Type, image: ImageIcon };

export default function LayersPanel() {
  const nodes = useStore((s) => s.doc.nodes);
  const selection = useStore((s) => s.selection);
  const [renaming, setRenaming] = useState(null);
  const [dragId, setDragId] = useState(null);
  const [dropAt, setDropAt] = useState(null);
  const st = useStore.getState();
  const list = [...nodes].reverse(); // top layer first

  const onClick = (e, id) => {
    if (e.shiftKey) st.toggleSelect(id);
    else st.select([id]);
  };

  const drop = () => {
    if (dragId != null && dropAt != null) {
      const from = nodes.findIndex((n) => n.id === dragId);
      // dropAt is a slot in the reversed list; convert to an index in nodes.
      let to = nodes.length - dropAt;
      if (from < to) to -= 1;
      st.moveLayer(dragId, to);
    }
    setDragId(null);
    setDropAt(null);
  };

  if (!list.length) return <p className="empty">No layers yet. Pick a template or draw with the toolbar.</p>;

  return (
    <ul className="layers" onDragOver={(e) => e.preventDefault()} onDrop={drop}>
      {list.map((n, i) => {
        const Icon = ICONS[n.type] || Square;
        const sel = selection.includes(n.id);
        return (
          <li
            key={n.id}
            className={`layer${sel ? ' sel' : ''}${n.visible ? '' : ' hidden'}${dropAt === i ? ' drop-before' : ''}${dropAt === i + 1 && i === list.length - 1 ? ' drop-after' : ''}`}
            draggable={renaming !== n.id}
            onDragStart={(e) => { setDragId(n.id); e.dataTransfer.effectAllowed = 'move'; }}
            onDragOver={(e) => {
              e.preventDefault();
              const r = e.currentTarget.getBoundingClientRect();
              setDropAt(e.clientY < r.top + r.height / 2 ? i : i + 1);
            }}
            onDragEnd={() => { setDragId(null); setDropAt(null); }}
            onClick={(e) => onClick(e, n.id)}
            onDoubleClick={() => setRenaming(n.id)}
          >
            <Icon size={14} className="layer-icon" />
            {renaming === n.id ? (
              <input
                autoFocus
                className="rename"
                defaultValue={n.name}
                onBlur={(e) => { st.updateNodes([n.id], { name: e.target.value || n.name }); setRenaming(null); }}
                onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter' || e.key === 'Escape') e.target.blur(); }}
              />
            ) : (
              <span className="layer-name">{n.name}</span>
            )}
            <button className={`layer-act${n.locked ? ' pinned' : ''}`} title={n.locked ? 'Unlock' : 'Lock'}
              onClick={(e) => { e.stopPropagation(); st.updateNodes([n.id], { locked: !n.locked }); }}>
              {n.locked ? <Lock size={13} /> : <Unlock size={13} />}
            </button>
            <button className={`layer-act${n.visible ? '' : ' pinned'}`} title={n.visible ? 'Hide' : 'Show'}
              onClick={(e) => { e.stopPropagation(); st.updateNodes([n.id], { visible: !n.visible }); }}>
              {n.visible ? <Eye size={13} /> : <EyeOff size={13} />}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
