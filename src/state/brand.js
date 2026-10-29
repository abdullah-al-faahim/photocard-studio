// Brand kit: stored once, applied to every template.
const KEY = 'pcs.brand.v1';

export const DEFAULT_BRAND = {
  name: 'THE DAILY',
  website: 'thedaily.com',
  logo: '',
  primary: '#c62828',
  secondary: '#f9a825',
  language: 'bn',
};

export function loadBrand() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULT_BRAND, ...JSON.parse(raw) };
  } catch (e) { /* storage unavailable */ }
  return { ...DEFAULT_BRAND };
}

export function saveBrand(brand) {
  try { localStorage.setItem(KEY, JSON.stringify(brand)); } catch (e) { /* quota */ }
}

const USER_TPL_KEY = 'pcs.userTemplates.v1';

export function loadUserTemplates() {
  try { return JSON.parse(localStorage.getItem(USER_TPL_KEY) || '[]'); } catch (e) { return []; }
}

export function saveUserTemplates(list) {
  try { localStorage.setItem(USER_TPL_KEY, JSON.stringify(list)); return true; } catch (e) { return false; }
}
