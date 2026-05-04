// Markdown to PDF persisted state. One slot:
//   { document: string, preset: 'default' | 'academic' | 'minimal' }

export {
  saveToLocalStorage,
  loadFromLocalStorage,
  clearLocalStorage,
} from '../../lib/storage';

import {MAX_PERSISTED_CHARS, PRESET_VALUES} from './constants';

export function validateMarkdownToPdfState(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  const {document, preset} = data;
  if (typeof document !== 'string') return false;
  if (document.length > MAX_PERSISTED_CHARS) return false;
  if (typeof preset !== 'string' || !PRESET_VALUES.includes(preset)) return false;
  return true;
}
