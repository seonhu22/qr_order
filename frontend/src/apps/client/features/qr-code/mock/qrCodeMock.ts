import type { QrCodeResponse } from '../api/qrCodeApi';

export const QR_CODE_MOCK_ROWS: QrCodeResponse[] = [
  { sysId: 'qr-code-001', tableNum: 1, remark: '창가 1번' },
  { sysId: 'qr-code-002', tableNum: 2, remark: '창가 2번' },
  { sysId: 'qr-code-003', tableNum: 3, remark: '내부 1번' },
  { sysId: 'qr-code-004', tableNum: 4, remark: '내부 2번' },
];
