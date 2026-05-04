// Markdown Preview persisted state. One slot:
//   { document: string }

export {
  saveToLocalStorage,
  loadFromLocalStorage,
  clearLocalStorage,
} from '../../lib/storage';

import {MAX_PERSISTED_CHARS} from './constants';

export function validateMarkdownPreviewState(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  const {document} = data;
  if (typeof document !== 'string') return false;
  if (document.length > MAX_PERSISTED_CHARS) return false;
  return true;
}
