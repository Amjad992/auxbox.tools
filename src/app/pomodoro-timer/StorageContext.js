import {createStorageContext} from '../../lib/createStorageContext';
import {DEFAULT_STATE, STORAGE_KEY, STORAGE_VERSION} from './constants';
import {validatePomodoroState} from './storageUtils';

const {Provider, useStorage} = createStorageContext({
  version: STORAGE_VERSION,
  entries: [
    {
      name: 'state',
      key: STORAGE_KEY,
      validate: validatePomodoroState,
      // No getDefault: we always want to write the current snapshot, even when
      // it equals the default (e.g. after Reset wipes runtime back to defaults).
    },
  ],
});

export const StorageProvider = Provider;
export const useStorageData = useStorage;
