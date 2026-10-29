// Shared image cache and font loading for the Konva canvas.
import { useEffect, useState } from 'react';

const images = new Map(); // src -> { img, ready, listeners:Set }

export function getImage(src, onReady) {
  let entry = images.get(src);
  if (!entry) {
    const img = new window.Image();
    entry = { img, ready: false, failed: false, listeners: new Set() };
    images.set(src, entry);
    img.crossOrigin = 'anonymous';
    img.onload = () => { entry.ready = true; entry.listeners.forEach((fn) => fn()); entry.listeners.clear(); };
    img.onerror = () => { entry.failed = true; entry.listeners.forEach((fn) => fn()); entry.listeners.clear(); };
    img.src = src;
  }
  if (!entry.ready && !entry.failed && onReady) entry.listeners.add(onReady);
  return entry;
}

export function useImage(src) {
  const [, force] = useState(0);
  useEffect(() => {
    if (!src) return undefined;
    const entry = getImage(src);
    if (entry.ready || entry.failed) return undefined;
    const fn = () => force((v) => v + 1);
    entry.listeners.add(fn);
    return () => entry.listeners.delete(fn);
  }, [src]);
  if (!src) return null;
  const entry = getImage(src);
  return entry.ready ? entry.img : null;
}

export function loadImageSize(src) {
  return new Promise((resolve, reject) => {
    const entry = getImage(src);
    if (entry.ready) return resolve({ w: entry.img.naturalWidth, h: entry.img.naturalHeight });
    if (entry.failed) return reject(new Error('Image failed to load'));
    entry.listeners.add(() => (entry.ready
      ? resolve({ w: entry.img.naturalWidth, h: entry.img.naturalHeight })
      : reject(new Error('Image failed to load'))));
    return undefined;
  });
}

const loadedFonts = new Set();

// Resolves once every family/weight pair is usable by canvas text.
export async function ensureFonts(pairs) {
  const pending = pairs.filter((p) => !loadedFonts.has(p));
  if (!pending.length || !document.fonts) return false;
  await Promise.all(pending.map(async (p) => {
    const [weight, family, italic] = p.split('|');
    try {
      await document.fonts.load(`${italic === '1' ? 'italic ' : ''}${weight} 40px "${family}"`, 'Aঅ');
    } catch (e) { /* fall back to system font */ }
    loadedFonts.add(p);
  }));
  return true;
}

export const fontKey = (n) => `${n.fontWeight}|${n.fontFamily}|${n.italic ? 1 : 0}`;

export function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export function pickImageFile() {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files && input.files[0];
      resolve(file ? await readFileAsDataURL(file) : null);
    };
    input.click();
  });
}
