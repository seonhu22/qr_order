export type { QrTableInfo } from './api/qrConnectApi';
import type { QrTableInfo } from './api/qrConnectApi';

export type QrEntryStatus = 'checking' | 'invalid' | 'network-error';

export type UseQrEntryPageResult = {
  status: QrEntryStatus;
  message: string;
  retry: () => void;
  /** 로딩 화면에서 미리 보여줄 테이블 정보 — mock 단계에서만 채워진다. */
  previewTableInfo?: QrTableInfo;
};
