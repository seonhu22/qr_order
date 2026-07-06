import type { QrCodeResponse } from '../api/qrCodeApi';

export const QR_CODE_MOCK_ROWS: QrCodeResponse[] = [
  { sysId: 'qr-code-001', linkSysId: 'table-001', tableNum: 1, description: '창가 1번', useYn: 'Y' },
  { sysId: 'qr-code-002', linkSysId: 'table-002', tableNum: 2, description: '창가 2번', useYn: 'Y' },
  { sysId: 'qr-code-003', linkSysId: 'table-003', tableNum: 3, description: '내부 1번', useYn: 'Y' },
  { sysId: 'qr-code-004', linkSysId: 'table-004', tableNum: 4, description: '내부 2번', useYn: 'Y' },
];
