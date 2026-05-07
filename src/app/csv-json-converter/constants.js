export const STORAGE_VERSION = '1.0.0';
export const STORAGE_KEY = 'csv_json_converter_state';
export const STATE_AUTOSAVE_DEBOUNCE_MS = 300;

export const DIRECTIONS = {
  CSV_TO_JSON: 'csv2json',
  JSON_TO_CSV: 'json2csv',
};
export const DIRECTION_VALUES = [
  DIRECTIONS.CSV_TO_JSON,
  DIRECTIONS.JSON_TO_CSV,
];
export const DIRECTION_OPTIONS = [
  {value: DIRECTIONS.CSV_TO_JSON, label: 'CSV → JSON'},
  {value: DIRECTIONS.JSON_TO_CSV, label: 'JSON → CSV'},
];

export const DELIMITER_AUTO = 'auto';
export const DELIMITERS = [
  {value: DELIMITER_AUTO, label: 'Auto-detect'},
  {value: ',', label: 'Comma  ,'},
  {value: ';', label: 'Semicolon  ;'},
  {value: '\t', label: 'Tab  \\t'},
  {value: '|', label: 'Pipe  |'},
];
export const DELIMITER_VALUES = DELIMITERS.map((d) => d.value);

export const DEFAULT_STATE = {
  direction: DIRECTIONS.CSV_TO_JSON,
  delimiter: DELIMITER_AUTO,
  hasHeader: true,
  inferTypes: true,
  prettyJson: true,
};
