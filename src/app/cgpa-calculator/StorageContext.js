import {createStorageContext} from '../../lib/createStorageContext';
import {
  STORAGE_KEYS,
  STORAGE_VERSION,
  validateGradesData,
  validateSemestersData,
} from './storageUtils';
import {DEFAULT_GRADES, DEFAULT_SEMESTER} from './constants';

const {Provider, useStorage} = createStorageContext({
  version: STORAGE_VERSION,
  entries: [
    {
      name: 'grades',
      key: STORAGE_KEYS.CUSTOM_GRADES,
      validate: validateGradesData,
      getDefault: () => DEFAULT_GRADES,
    },
    {
      name: 'semesters',
      key: STORAGE_KEYS.SEMESTERS_DATA,
      validate: validateSemestersData,
      getDefault: () => [
        {
          id: 1,
          name: DEFAULT_SEMESTER.name,
          subjects: [{name: '', creditHours: '', grade: '', gradePoints: 0}],
        },
      ],
    },
  ],
});

export const StorageProvider = Provider;
export const useStorageData = useStorage;
