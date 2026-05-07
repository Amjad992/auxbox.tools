import {createStorageContext} from '../../lib/createStorageContext';
import {DEFAULT_STATE, STORAGE_KEY, STORAGE_VERSION} from './constants';
import {validateRegexTesterState} from './storageUtils';

const {Provider, useStorage} = createStorageContext({
  version: STORAGE_VERSION,
  entries: [
    {
      name: 'state',
      key: STORAGE_KEY,
      validate: validateRegexTesterState,
      getDefault: () => DEFAULT_STATE,
    },
  ],
});

export const StorageProvider = Provider;
export const useStorageData = useStorage;
