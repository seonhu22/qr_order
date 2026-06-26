import { DEFAULT_FILE_ALLOWED_EXTENSIONS } from '@/shared/components/file-attachment';

export const INQUIRY_FILE_POLICY = {
  maxFiles: 5,
  maxFileSizeMB: 10,
  maxTotalSizeMB: 50,
  allowedExtensions: DEFAULT_FILE_ALLOWED_EXTENSIONS,
} as const;
