import {createStorageContext} from '../../lib/createStorageContext';
import {DEFAULT_SETTINGS} from './constants';
import {
  STORAGE_KEYS,
  STORAGE_VERSION,
  validatePasswordSettings,
} from './storageUtils';

const {Provider, useStorage} = createStorageContext({
  version: STORAGE_VERSION,
  entries: [
    {
      name: 'settings',
      key: STORAGE_KEYS.SETTINGS,
      validate: validatePasswordSettings,
      getDefault: () => DEFAULT_SETTINGS,
    },
  ],
});

export const StorageProvider = Provider;
export const useStorageData = useStorage;
