import { useEffect } from 'react';
import { useStore } from '../state/store';
import { saveProject, openProject } from '../io/files';
import { placeImage } from '../canvas/place';
import { readFileAsDataURL } from '../canvas/assets';

const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);
export const mod = isMac ? '⌘' : 'Ctrl+';

const TOOL_KEYS = { v: 'select', h: 'hand', r: 'rect', o: 'ellipse', l: 'line', t: 'text' };

export function useShortcuts() {
  useEffect(() => {
    const typing = () => {
      const el = document.activeElement;
      return el && (/INPUT|TEXTAREA|SELECT/.test(el.tagName) || el.isContentEditable);
    };

    const onKey = (e) => {
      if (typing()) return;
      const st = useStore.getState();
      const k = e.key.toLowerCase();
      const cmd = e.ctrlKey || e.metaKey;

      if (cmd) {
        const actions = {
          z: () => (e.shiftKey ? st.redo() : st.undo()),
          y: st.redo,
          c: st.copySelection,
          x: () => { st.copySelection(); st.deleteSelection(); },
          d: st.duplicateSelection,
          a: st.selectAll,
          s: () => saveProject().then((f) => f && st.showToast('Design saved')),
          o: () => openProject().catch((err) => st.showToast(err.message, 'error')),
          e: () => st.openModal('export'),
          ']': () => st.reorder(e.shiftKey ? 'front' : 'forward'),
          '[': () => st.reorder(e.shiftKey ? 'back' : 'backward'),
          '0': () => st.setView({ scale: 1 }),
          '=': () => st.setView({ scale: Math.min(8, st.view.scale * 1.25) }),
          '-': () => st.setView({ scale: Math.max(0.05, st.view.scale / 1.25) }),
        };
        if (e.shiftKey && k === 'l') { e.preventDefault(); st.updateNodes(st.selection, (n) => ({ locked: !n.locked })); return; }
        if (e.shiftKey && k === 'h') { e.preventDefault(); st.updateNodes(st.selection, (n) => ({ visible: !n.visible })); return; }
        const fn = actions[k];
        if (fn) { e.preventDefault(); fn(); }
        return; // leave Ctrl+V to the paste event
      }

      if (k === 'delete' || k === 'backspace') { e.preventDefault(); st.deleteSelection(); return; }
      if (k === 'escape') { st.select([]); st.setTool('select'); return; }
      if (k === 'enter' && st.selection.length === 1) {
        const n = st.doc.nodes.find((x) => x.id === st.selection[0]);
        if (n && n.type === 'text') { e.preventDefault(); st.setEditingText(n.id); }
        return;
      }
      if (e.shiftKey && k === '!') { st.requestFit(); return; }
      if (e.shiftKey && e.code === 'Digit1') { st.requestFit(); return; }

      const arrows = { arrowleft: [-1, 0], arrowright: [1, 0], arrowup: [0, -1], arrowdown: [0, 1] };
      if (arrows[k] && st.selection.length) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const [dx, dy] = arrows[k];
        st.updateNodes(st.selection, (n) => ({ x: n.x + dx * step, y: n.y + dy * step }), { key: 'nudge' });
        return;
      }
      if (TOOL_KEYS[k] && !e.altKey) st.setTool(TOOL_KEYS[k]);
    };

    // Paste: an image from the clipboard becomes a layer; otherwise paste copied layers.
    const onPaste = async (e) => {
      if (typing()) return;
      const items = [...(e.clipboardData ? e.clipboardData.items : [])];
      const imgItem = items.find((it) => it.type.startsWith('image/'));
      if (imgItem) {
        e.preventDefault();
        const src = await readFileAsDataURL(imgItem.getAsFile());
        placeImage(src, null);
        return;
      }
      useStore.getState().paste();
    };

    window.addEventListener('keydown', onKey);
    window.addEventListener('paste', onPaste);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('paste', onPaste); };
  }, []);
}
