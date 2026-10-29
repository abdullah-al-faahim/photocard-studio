// Export, save and open — through Electron dialogs when available,
// falling back to browser downloads / file pickers.
import { useStore } from '../state/store';
import { registry } from '../canvas/registry';

const api = () => window.electronAPI;

export function renderDataUrl({ format = 'png', scale = 1, quality = 0.92 } = {}) {
  const { stage, artboard } = registry;
  const { doc } = useStore.getState();
  if (!stage || !artboard) throw new Error('Canvas not ready');
  const prev = { scale: stage.scaleX(), x: stage.x(), y: stage.y() };
  stage.scale({ x: 1, y: 1 });
  stage.position({ x: 0, y: 0 });
  try {
    return artboard.toDataURL({
      x: 0, y: 0, width: doc.width, height: doc.height, pixelRatio: scale,
      mimeType: format === 'jpeg' ? 'image/jpeg' : 'image/png', quality,
    });
  } finally {
    stage.scale({ x: prev.scale, y: prev.scale });
    stage.position({ x: prev.x, y: prev.y });
  }
}

const safeName = (s) => (s || 'photocard').replace(/[\\/:*?"<>|]+/g, '').trim().slice(0, 80) || 'photocard';

function download(url, filename) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export async function exportImage(opts) {
  const st = useStore.getState();
  st.setEditingText(null);
  await new Promise((r) => requestAnimationFrame(() => r()));
  const ext = opts.format === 'jpeg' ? 'jpg' : 'png';
  const filename = `${safeName(st.doc.name)}.${ext}`;
  const dataUrl = renderDataUrl(opts);
  if (api() && api().saveFile) {
    const res = await api().saveFile({
      data: dataUrl.split(',')[1], encoding: 'base64', defaultName: filename, kind: 'image',
      filters: [{ name: ext.toUpperCase(), extensions: [ext] }],
    });
    return res && res.success ? res.filePath : null;
  }
  download(dataUrl, filename);
  return filename;
}

export async function saveProject() {
  const { doc } = useStore.getState();
  const json = JSON.stringify(doc);
  const filename = `${safeName(doc.name)}.pcard`;
  if (api() && api().saveFile) {
    const res = await api().saveFile({
      data: json, encoding: 'utf8', defaultName: filename, kind: 'document',
      filters: [{ name: 'PhotoCard design', extensions: ['pcard'] }],
    });
    return res && res.success ? res.filePath : null;
  }
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  download(url, filename);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return filename;
}

export async function openProject() {
  let text = null;
  if (api() && api().openFile) {
    const res = await api().openFile({ filters: [{ name: 'PhotoCard design', extensions: ['pcard', 'json'] }] });
    text = res && res.content;
  } else {
    text = await new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.pcard,.json,application/json';
      input.onchange = () => {
        const f = input.files && input.files[0];
        if (!f) return resolve(null);
        f.text().then(resolve);
        return undefined;
      };
      input.click();
    });
  }
  if (!text) return false;
  const doc = JSON.parse(text);
  if (!doc || !Array.isArray(doc.nodes) || !doc.width) throw new Error('Not a PhotoCard design file');
  useStore.getState().loadDoc(doc);
  return true;
}
