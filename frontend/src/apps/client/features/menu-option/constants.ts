export const MENU_OPTION_DETAIL_FILE_POLICY = {
  maxFiles: 1,
  maxFileSizeMB: 10,
  maxTotalSizeMB: 10,
  allowedExtensions: ['jpg', 'jpeg', 'png'],
} as const;

export const OPTION_SELECTION_TYPE = {
  SINGLE: '01',
  MULTIPLE: '02',
  QUANTITY: '03',
} as const;
