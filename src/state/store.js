import { create } from 'zustand';
import { produce } from 'immer';
import { newDocument, cloneNodes } from '../model/nodes';
import { buildTemplate, TEMPLATES } from '../model/templates';
import { loadBrand, saveBrand } from './brand';

const HISTORY_LIMIT = 120;
const COALESCE_MS = 600;
const AUTOSAVE_KEY = 'pcs.autosave.v2';

function initialDoc() {
  try {
    const saved = localStorage.getItem(AUTOSAVE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) { /* storage unavailable */ }
  return buildTemplate(TEMPLATES[0], 1080, 1350, loadBrand());
}

export const useStore = create((set, get) => ({
  doc: initialDoc(),
  selection: [],
  tool: 'select',
  view: { scale: 0.5, x: 0, y: 0 },
  past: [],
  future: [],
  lastRecord: { key: null, time: 0 },
  editingTextId: null,
  fontVersion: 0,
  clipboard: [],
  brand: loadBrand(),
  toast: null,
  modal: null,
  fitRequest: 0,

  // Applies an immer recipe to the document and records undo history.
  // Calls sharing a `key` within COALESCE_MS merge into one undo step, so
  // dragging a slider produces a single entry.
  change(recipe, { record = true, key = null } = {}) {
    const { doc, past, lastRecord } = get();
    const next = produce(doc, recipe);
    if (next === doc) return;
    const now = Date.now();
    const merge = key && lastRecord.key === key && now - lastRecord.time < COALESCE_MS;
    if (record && !merge) {
      set({ doc: next, past: [...past.slice(-HISTORY_LIMIT), doc], future: [], lastRecord: { key, time: now } });
    } else {
      set({ doc: next, lastRecord: record ? { key, time: now } : lastRecord });
    }
  },

  // Pushes the current doc onto history without changing it; used before a
  // live interaction (drag/transform) that updates with record:false.
  checkpoint() {
    const { doc, past } = get();
    set({ past: [...past.slice(-HISTORY_LIMIT), doc], future: [], lastRecord: { key: null, time: 0 } });
  },

  updateNodes(ids, patch, opts) {
    const idSet = new Set(ids);
    get().change((d) => {
      d.nodes.forEach((n) => {
        if (!idSet.has(n.id)) return;
        Object.assign(n, typeof patch === 'function' ? patch(n) : patch);
      });
    }, opts);
  },

  addNodes(nodes, { select = true } = {}) {
    get().change((d) => { d.nodes.push(...nodes); });
    if (select) set({ selection: nodes.map((n) => n.id) });
  },

  deleteSelection() {
    const sel = new Set(get().selection);
    if (!sel.size) return;
    get().change((d) => { d.nodes = d.nodes.filter((n) => !sel.has(n.id)); });
    set({ selection: [] });
  },

  duplicateSelection() {
    const { doc, selection } = get();
    const nodes = doc.nodes.filter((n) => selection.includes(n.id));
    if (nodes.length) get().addNodes(cloneNodes(nodes));
  },

  copySelection() {
    const { doc, selection } = get();
    set({ clipboard: JSON.parse(JSON.stringify(doc.nodes.filter((n) => selection.includes(n.id)))) });
  },

  paste() {
    const { clipboard } = get();
    if (clipboard.length) get().addNodes(cloneNodes(clipboard));
  },

  select(ids) { set({ selection: ids }); },
  toggleSelect(id) {
    const { selection } = get();
    set({ selection: selection.includes(id) ? selection.filter((s) => s !== id) : [...selection, id] });
  },
  selectAll() {
    set({ selection: get().doc.nodes.filter((n) => n.visible && !n.locked).map((n) => n.id) });
  },

  setTool(tool) { set({ tool, editingTextId: null }); },
  setView(view) { set({ view: { ...get().view, ...view } }); },
  requestFit() { set({ fitRequest: get().fitRequest + 1 }); },
  setEditingText(id) { set({ editingTextId: id }); },
  bumpFonts() { set({ fontVersion: get().fontVersion + 1 }); },

  undo() {
    const { past, future, doc } = get();
    if (!past.length) return;
    set({ doc: past[past.length - 1], past: past.slice(0, -1), future: [doc, ...future], lastRecord: { key: null, time: 0 } });
    get().pruneSelection();
  },
  redo() {
    const { past, future, doc } = get();
    if (!future.length) return;
    set({ doc: future[0], future: future.slice(1), past: [...past, doc], lastRecord: { key: null, time: 0 } });
    get().pruneSelection();
  },
  pruneSelection() {
    const ids = new Set(get().doc.nodes.map((n) => n.id));
    set({ selection: get().selection.filter((id) => ids.has(id)) });
  },

  loadDoc(doc) {
    set({ doc, selection: [], past: [], future: [], editingTextId: null });
    get().requestFit();
  },

  // Layer order: nodes[0] is the bottom-most layer.
  reorder(direction) {
    const sel = new Set(get().selection);
    if (!sel.size) return;
    get().change((d) => {
      const picked = d.nodes.filter((n) => sel.has(n.id));
      const rest = d.nodes.filter((n) => !sel.has(n.id));
      if (direction === 'front') { d.nodes = [...rest, ...picked]; return; }
      if (direction === 'back') { d.nodes = [...picked, ...rest]; return; }
      const arr = d.nodes;
      if (direction === 'forward') {
        for (let i = arr.length - 2; i >= 0; i--) {
          if (sel.has(arr[i].id) && !sel.has(arr[i + 1].id)) [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
        }
      } else {
        for (let i = 1; i < arr.length; i++) {
          if (sel.has(arr[i].id) && !sel.has(arr[i - 1].id)) [arr[i], arr[i - 1]] = [arr[i - 1], arr[i]];
        }
      }
    });
  },
  moveLayer(id, toIndex) {
    get().change((d) => {
      const from = d.nodes.findIndex((n) => n.id === id);
      if (from < 0) return;
      const [node] = d.nodes.splice(from, 1);
      d.nodes.splice(Math.max(0, Math.min(toIndex, d.nodes.length)), 0, node);
    });
  },

  // Aligns the selection to each other, or to the canvas when one node is selected.
  align(edge) {
    const { doc, selection } = get();
    const nodes = doc.nodes.filter((n) => selection.includes(n.id));
    if (!nodes.length) return;
    const box = nodes.length === 1
      ? { x: 0, y: 0, w: doc.width, h: doc.height }
      : bounds(nodes);
    get().change((d) => {
      d.nodes.forEach((n) => {
        if (!selection.includes(n.id)) return;
        if (edge === 'left') n.x = box.x;
        if (edge === 'hcenter') n.x = box.x + (box.w - n.width) / 2;
        if (edge === 'right') n.x = box.x + box.w - n.width;
        if (edge === 'top') n.y = box.y;
        if (edge === 'vcenter') n.y = box.y + (box.h - n.height) / 2;
        if (edge === 'bottom') n.y = box.y + box.h - n.height;
      });
    });
  },
  distribute(axis) {
    const { doc, selection } = get();
    const nodes = doc.nodes.filter((n) => selection.includes(n.id));
    if (nodes.length < 3) return;
    const pos = axis === 'h' ? 'x' : 'y';
    const size = axis === 'h' ? 'width' : 'height';
    const sorted = [...nodes].sort((a, b) => a[pos] - b[pos]);
    const first = sorted[0], last = sorted[sorted.length - 1];
    const total = sorted.reduce((s, n) => s + n[size], 0);
    const gap = (last[pos] + last[size] - first[pos] - total) / (sorted.length - 1);
    const target = {};
    let cursor = first[pos];
    sorted.forEach((n) => { target[n.id] = cursor; cursor += n[size] + gap; });
    get().change((d) => { d.nodes.forEach((n) => { if (n.id in target) n[pos] = target[n.id]; }); });
  },

  setBrand(brand) { saveBrand(brand); set({ brand }); },
  showToast(message, kind = 'info') {
    set({ toast: { message, kind, id: Date.now() } });
    setTimeout(() => { if (get().toast && Date.now() - get().toast.id >= 2900) set({ toast: null }); }, 3000);
  },
  openModal(modal) { set({ modal }); },
  closeModal() { set({ modal: null }); },
}));

export function bounds(nodes) {
  const xs = nodes.map((n) => n.x), ys = nodes.map((n) => n.y);
  const x2 = nodes.map((n) => n.x + n.width), y2 = nodes.map((n) => n.y + n.height);
  const x = Math.min(...xs), y = Math.min(...ys);
  return { x, y, w: Math.max(...x2) - x, h: Math.max(...y2) - y };
}

let saveTimer = null;
useStore.subscribe((state, prev) => {
  if (state.doc === prev.doc) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(state.doc)); } catch (e) { /* quota */ }
  }, 800);
});

export { newDocument };
