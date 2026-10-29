import React, { Component, useState } from 'react';
import {
  MousePointer2, Hand, Square, Circle, Triangle, Star, Minus, Type, ImagePlus, Undo2, Redo2, Download,
  Save, FolderOpen, FilePlus2, ZoomIn, ZoomOut, Maximize, LayoutTemplate, Shapes, Layers, Palette,
} from 'lucide-react';
import { useStore } from './state/store';
import Editor from './canvas/Editor';
import { placeImage } from './canvas/place';
import { pickImageFile } from './canvas/assets';
import PropertiesPanel from './panels/PropertiesPanel';
import LayersPanel from './panels/LayersPanel';
import TemplatesPanel from './panels/TemplatesPanel';
import ElementsPanel from './panels/ElementsPanel';
import BrandPanel from './panels/BrandPanel';
import ExportModal from './panels/ExportModal';
import NewDesignModal from './panels/NewDesignModal';
import { saveProject, openProject } from './io/files';
import { useShortcuts, mod } from './ui/keys';
import { IconButton } from './ui/controls';

class ErrorBoundary extends Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  render() {
    if (!this.state.err) return this.props.children;
    return (
      <div className="crash">
        <h2>Something went wrong</h2>
        <pre>{String(this.state.err.message || this.state.err)}</pre>
        <button className="btn primary" onClick={() => this.setState({ err: null })}>Try again</button>
      </div>
    );
  }
}

const TOOLS = [
  { id: 'select', icon: MousePointer2, label: 'Move', key: 'V' },
  { id: 'hand', icon: Hand, label: 'Hand', key: 'H' },
  { id: 'rect', icon: Square, label: 'Rectangle', key: 'R' },
  { id: 'ellipse', icon: Circle, label: 'Ellipse', key: 'O' },
  { id: 'triangle', icon: Triangle, label: 'Triangle' },
  { id: 'star', icon: Star, label: 'Star' },
  { id: 'line', icon: Minus, label: 'Line', key: 'L' },
  { id: 'text', icon: Type, label: 'Text', key: 'T' },
];

const TABS = [
  { id: 'templates', label: 'Templates', icon: LayoutTemplate },
  { id: 'elements', label: 'Elements', icon: Shapes },
  { id: 'layers', label: 'Layers', icon: Layers },
  { id: 'brand', label: 'Brand', icon: Palette },
];

function TopBar() {
  const canUndo = useStore((s) => s.past.length > 0);
  const canRedo = useStore((s) => s.future.length > 0);
  const scale = useStore((s) => s.view.scale);
  const name = useStore((s) => s.doc.name);
  const st = useStore.getState();

  const zoomBy = (f) => {
    const el = document.querySelector('.canvas-wrap');
    const v = st.view;
    const s = Math.min(8, Math.max(0.05, v.scale * f));
    const cx = el.clientWidth / 2, cy = el.clientHeight / 2;
    st.setView({ scale: s, x: cx - ((cx - v.x) / v.scale) * s, y: cy - ((cy - v.y) / v.scale) * s });
  };

  return (
    <header className="topbar">
      <div className="brand-mark">
        <img src="assets/logo.png" alt="" onError={(e) => { e.target.style.display = 'none'; }} />
        <span>PhotoCard Studio</span>
      </div>
      <div className="row tight">
        <IconButton icon={<FilePlus2 size={16} />} title="New design" onClick={() => st.openModal('new')} />
        <IconButton icon={<FolderOpen size={16} />} title={`Open (${mod}O)`} onClick={() => openProject().catch((e) => st.showToast(e.message, 'error'))} />
        <IconButton icon={<Save size={16} />} title={`Save (${mod}S)`} onClick={() => saveProject().then((f) => f && st.showToast('Design saved'))} />
        <span className="sep" />
        <IconButton icon={<Undo2 size={16} />} title={`Undo (${mod}Z)`} disabled={!canUndo} onClick={st.undo} />
        <IconButton icon={<Redo2 size={16} />} title={`Redo (${mod}Y)`} disabled={!canRedo} onClick={st.redo} />
      </div>
      <div className="doc-name" title={name}>{name}</div>
      <div className="row tight">
        <IconButton icon={<ZoomOut size={16} />} title="Zoom out" onClick={() => zoomBy(1 / 1.25)} />
        <button className="zoom-label" title="Zoom to 100%" onClick={() => st.setView({ scale: 1 })}>{Math.round(scale * 100)}%</button>
        <IconButton icon={<ZoomIn size={16} />} title="Zoom in" onClick={() => zoomBy(1.25)} />
        <IconButton icon={<Maximize size={16} />} title="Zoom to fit (Shift+1)" onClick={st.requestFit} />
        <span className="sep" />
        <button className="btn primary" onClick={() => st.openModal('export')}><Download size={15} /> Export</button>
      </div>
    </header>
  );
}

function Toolbar() {
  const tool = useStore((s) => s.tool);
  const st = useStore.getState();
  return (
    <div className="toolbar">
      {TOOLS.map((t) => (
        <button key={t.id} className={`tool${tool === t.id ? ' on' : ''}`} title={`${t.label}${t.key ? ` (${t.key})` : ''}`} onClick={() => st.setTool(t.id)}>
          <t.icon size={18} />
        </button>
      ))}
      <span className="sep" />
      <button className="tool" title="Add photo" onClick={() => pickImageFile().then((src) => src && placeImage(src, null))}>
        <ImagePlus size={18} />
      </button>
    </div>
  );
}

function LeftPanel() {
  const [tab, setTab] = useState('templates');
  return (
    <aside className="panel left">
      <nav className="tabs">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)} title={t.label}>
            <t.icon size={16} /><span>{t.label}</span>
          </button>
        ))}
      </nav>
      <div className="panel-body">
        {tab === 'templates' && <TemplatesPanel />}
        {tab === 'elements' && <ElementsPanel />}
        {tab === 'layers' && <LayersPanel />}
        {tab === 'brand' && <BrandPanel />}
      </div>
    </aside>
  );
}

function Toast() {
  const toast = useStore((s) => s.toast);
  if (!toast) return null;
  return <div className={`toast ${toast.kind}`}>{toast.message}</div>;
}

function App() {
  useShortcuts();
  const modal = useStore((s) => s.modal);
  return (
    <div className="app">
      <TopBar />
      <div className="workspace">
        <LeftPanel />
        <main className="stage-area">
          <Editor />
          <Toolbar />
        </main>
        <PropertiesPanel />
      </div>
      {modal === 'export' && <ExportModal />}
      {modal === 'new' && <NewDesignModal />}
      <Toast />
    </div>
  );
}

export default function Root() {
  return <ErrorBoundary><App /></ErrorBoundary>;
}
