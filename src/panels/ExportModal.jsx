import React, { useEffect, useState } from 'react';
import { X, Download } from 'lucide-react';
import { useStore } from '../state/store';
import { exportImage, renderDataUrl } from '../io/files';
import { Segmented, Slider } from '../ui/controls';

export default function ExportModal() {
  const doc = useStore((s) => s.doc);
  const st = useStore.getState();
  const [format, setFormat] = useState('png');
  const [scale, setScale] = useState(1);
  const [quality, setQuality] = useState(92);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try { setPreview(renderDataUrl({ format: 'png', scale: Math.min(1, 480 / doc.width) })); } catch (e) { setPreview(null); }
  }, [doc]);

  const run = async () => {
    setBusy(true);
    try {
      const where = await exportImage({ format, scale, quality: quality / 100 });
      if (where) { st.showToast(`Exported ${where.split(/[\\/]/).pop()}`); st.closeModal(); }
    } catch (e) {
      st.showToast(`Export failed: ${e.message}`, 'error');
    }
    setBusy(false);
  };

  return (
    <div className="modal-backdrop" onMouseDown={st.closeModal}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <header><h3>Export photocard</h3><button className="icon-btn" onClick={st.closeModal}><X size={16} /></button></header>
        <div className="export-body">
          <div className="export-preview">{preview && <img src={preview} alt="Preview" />}</div>
          <div className="export-opts">
            <label className="field-label">Format</label>
            <Segmented value={format} onChange={setFormat} options={[{ value: 'png', label: 'PNG' }, { value: 'jpeg', label: 'JPG' }]} />
            <label className="field-label">Resolution</label>
            <Segmented value={scale} onChange={setScale} options={[0.5, 1, 2, 3].map((s) => ({ value: s, label: `${s}×` }))} />
            <p className="hint">{Math.round(doc.width * scale)} × {Math.round(doc.height * scale)} px</p>
            {format === 'jpeg' && <Slider label="Quality" value={quality} min={50} max={100} onChange={setQuality} format={(v) => `${v}%`} />}
            <p className="hint">PNG keeps text crisp; JPG gives smaller files for Facebook and WhatsApp.</p>
            <button className="btn primary wide" disabled={busy} onClick={run}><Download size={15} /> {busy ? 'Exporting…' : 'Export'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
