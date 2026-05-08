export const NOTICE_FILE_POLICY = {
  maxFiles: 5,
  maxFileSizeMB: 10,
  maxTotalSizeMB: 50,
  allowedExts: ['JPG', 'JPEG', 'PNG', 'PDF', 'DOCX', 'XLSX', 'PPTX', 'ZIP'],
} as const;
