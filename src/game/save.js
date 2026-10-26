// ============================================================
// ASHES OF HUMANITY: LAST SIGNAL
// game/save.js — local save slot serialisation
// ============================================================

const KEY = 'ashes_of_humanity_save_v1';
const AUTO = 'ashes_of_humanity_auto_v1';

function storage() {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage;
  } catch (e) { return null; }
}

export function writeSave(data, auto = false) {
  const st = storage();
  if (!st) return false;
  try {
    st.setItem(auto ? AUTO : KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    console.warn('save failed', e);
    return false;
  }
}

export function readSave(auto = false) {
  const st = storage();
  if (!st) return null;
  try {
    const raw = st.getItem(auto ? AUTO : KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) { return null; }
}

export function hasSave() {
  const st = storage();
  if (!st) return false;
  return !!(st.getItem(KEY) || st.getItem(AUTO));
}

export function clearSaves() {
  const st = storage();
  if (!st) return;
  st.removeItem(KEY);
  st.removeItem(AUTO);
}
