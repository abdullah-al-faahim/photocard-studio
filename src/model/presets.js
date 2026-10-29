// Canvas sizes, fonts and colour swatches used across the editor.

export const SIZE_PRESETS = [
  { id: 'square', label: 'Square post', w: 1080, h: 1080 },
  { id: 'portrait', label: 'Portrait post (4:5)', w: 1080, h: 1350 },
  { id: 'story', label: 'Story / Reel (9:16)', w: 1080, h: 1920 },
  { id: 'link', label: 'Facebook link (1.91:1)', w: 1200, h: 630 },
  { id: 'wide', label: 'Wide (16:9)', w: 1920, h: 1080 },
  { id: 'x', label: 'X / Twitter post', w: 1600, h: 900 },
];

export const FONTS = [
  { family: 'Noto Serif Bengali', script: 'bn' },
  { family: 'Hind Siliguri', script: 'bn' },
  { family: 'Tiro Bangla', script: 'bn' },
  { family: 'Baloo Da 2', script: 'bn' },
  { family: 'Anek Bangla', script: 'bn' },
  { family: 'Noto Sans Bengali', script: 'bn' },
  { family: 'Inter', script: 'en' },
  { family: 'Roboto', script: 'en' },
  { family: 'Roboto Condensed', script: 'en' },
  { family: 'Montserrat', script: 'en' },
  { family: 'Oswald', script: 'en' },
  { family: 'Bebas Neue', script: 'en' },
  { family: 'Anton', script: 'en' },
  { family: 'Playfair Display', script: 'en' },
  { family: 'Merriweather', script: 'en' },
  { family: 'Lora', script: 'en' },
];

export const FONT_WEIGHTS = [
  { value: '300', label: 'Light' },
  { value: '400', label: 'Regular' },
  { value: '500', label: 'Medium' },
  { value: '600', label: 'Semibold' },
  { value: '700', label: 'Bold' },
  { value: '800', label: 'Extra bold' },
  { value: '900', label: 'Black' },
];

export const SWATCHES = [
  '#ffffff', '#000000', '#111827', '#6b7280', '#d1d5db',
  '#c62828', '#e53935', '#f9a825', '#fdd835', '#2e7d32',
  '#43a047', '#1565c0', '#1e88e5', '#6a1b9a', '#ef6c00',
];

export const BENGALI_RE = /[ঀ-৿]/;
