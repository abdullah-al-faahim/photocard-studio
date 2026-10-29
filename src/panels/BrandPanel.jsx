import React from 'react';
import { ImageUp, X } from 'lucide-react';
import { useStore } from '../state/store';
import { pickImageFile } from '../canvas/assets';
import { ColorField, Segmented } from '../ui/controls';

export default function BrandPanel() {
  const brand = useStore((s) => s.brand);
  const set = (patch) => useStore.getState().setBrand({ ...brand, ...patch });

  return (
    <div className="brand">
      <p className="hint">Your brand is used by every template and news element, so each new card starts on-brand.</p>
      <label className="field-label">Outlet name</label>
      <input className="text-input" value={brand.name} onChange={(e) => set({ name: e.target.value })} />
      <label className="field-label">Website / page</label>
      <input className="text-input" value={brand.website} onChange={(e) => set({ website: e.target.value })} />

      <label className="field-label">Logo</label>
      {brand.logo ? (
        <div className="logo-box">
          <img src={brand.logo} alt="Logo" />
          <button className="icon-btn" title="Remove logo" onClick={() => set({ logo: '' })}><X size={14} /></button>
        </div>
      ) : null}
      <button className="btn wide" onClick={() => pickImageFile().then((logo) => logo && set({ logo }))}>
        <ImageUp size={15} /> {brand.logo ? 'Replace logo' : 'Upload logo'}
      </button>
      <p className="hint">A PNG with a transparent background works best.</p>

      <label className="field-label">Primary colour</label>
      <ColorField value={brand.primary} onChange={(primary) => set({ primary })} />
      <label className="field-label">Secondary colour</label>
      <ColorField value={brand.secondary} onChange={(secondary) => set({ secondary })} />

      <label className="field-label">Template language</label>
      <Segmented value={brand.language} onChange={(language) => set({ language })} options={[
        { value: 'bn', label: 'বাংলা' }, { value: 'en', label: 'English' },
      ]} />
      <p className="hint">Changes apply the next time you pick a template.</p>
    </div>
  );
}
