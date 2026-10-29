import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { useStore } from '../state/store';

// In-place text editing: a textarea laid exactly over the canvas text.
export default function TextEditor({ id }) {
  const n = useStore((s) => s.doc.nodes.find((x) => x.id === id));
  const view = useStore((s) => s.view);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    el.select();
  }, []);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = '0px';
    el.style.height = `${el.scrollHeight}px`;
  });

  if (!n) return null;
  const s = view.scale;
  const color = n.fill ? (n.fill.type === 'solid' ? n.fill.color : n.fill.from) : '#000';

  const finish = () => {
    const st = useStore.getState();
    const node = st.doc.nodes.find((x) => x.id === id);
    if (node && !node.text.trim()) {
      st.change((d) => { d.nodes = d.nodes.filter((x) => x.id !== id); });
      st.select([]);
    }
    st.setEditingText(null);
  };

  return (
    <textarea
      ref={ref}
      className="text-editor"
      value={n.text}
      spellCheck={false}
      onChange={(e) => useStore.getState().updateNodes([id], { text: e.target.value }, { key: `text-${id}` })}
      onBlur={finish}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === 'Escape' || (e.key === 'Enter' && (e.ctrlKey || e.metaKey))) { e.preventDefault(); finish(); }
      }}
      style={{
        left: view.x + n.x * s,
        top: view.y + n.y * s,
        width: n.autoWidth ? Math.max(n.width * s, 40) + 40 : n.width * s,
        minHeight: n.autoHeight ? undefined : n.height * s,
        transform: `rotate(${n.rotation}deg)`,
        font: `${n.italic ? 'italic ' : ''}${n.fontWeight} ${n.fontSize * s}px "${n.fontFamily}"`,
        lineHeight: n.lineHeight,
        letterSpacing: `${n.letterSpacing * s}px`,
        padding: n.padding * s,
        textAlign: n.align,
        textTransform: n.uppercase ? 'uppercase' : 'none',
        color: color.length === 9 ? color.slice(0, 7) : color,
        whiteSpace: n.autoWidth ? 'pre' : 'pre-wrap',
      }}
    />
  );
}
