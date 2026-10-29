import React from 'react';
import { createRoot } from 'react-dom/client';
import Root from './App';
import { useStore } from './state/store';

if (process.env.NODE_ENV !== 'production') {
  window.pcsStore = useStore;
  // localhost:5180/#demo fills the photo slot with a sample image (used for README screenshots).
  if (window.location.hash === '#demo') {
    const c = document.createElement('canvas');
    c.width = 1600; c.height = 1000;
    const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 1600, 1000);
    g.addColorStop(0, '#2b5876'); g.addColorStop(1, '#4e4376');
    x.fillStyle = g; x.fillRect(0, 0, 1600, 1000);
    x.fillStyle = '#f5c16c'; x.beginPath(); x.arc(1100, 380, 180, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#1b2a3a';
    for (let i = 0; i < 12; i++) x.fillRect(i * 140, 600 - ((i * 73) % 260), 110, 500);
    const st = useStore.getState();
    const photo = st.doc.nodes.find((n) => n.name === 'Photo');
    if (photo) st.updateNodes([photo.id], { src: c.toDataURL('image/jpeg', 0.9) }, { record: false });
    const headline = st.doc.nodes.find((n) => n.name === 'Headline');
    if (headline) st.select([headline.id]);
  }
}

createRoot(document.getElementById('root')).render(<Root />);
