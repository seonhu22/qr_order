import type { QrTableInfo } from './qrConnectApi';

/**
 * 백엔드/MSW 상태와 무관하게 QR 인식 흐름을 항상 볼 수 있게 하는 고정값 mock.
 * 실제 GET /api/qr/{url} 호출(connectQr)은 그대로 남겨두고, useQrEntryPage의
 * QR_CONNECT_MOCK_ENABLED 플래그가 꺼지면 다시 connectQr을 쓴다.
 *
 * qr-code-004는 의도적으로 이 맵에서 뺐다 — "유효하지 않은 QR코드" 화면(ConsumerStatusScreen)을
 * 언제든 확인할 수 있는 데모 트리거로 쓴다.
 */
const MOCK_QR_TABLE_MAP: Record<string, QrTableInfo> = {
  'qr-code-001': {
    sysId: 'table-001',
    tableName: '창가 1번',
    tableNum: 1,
    tableQty: 4,
    sysPlantCd: 'ADMIN',
  },
  'qr-code-002': {
    sysId: 'table-002',
    tableName: '창가 2번',
    tableNum: 2,
    tableQty: 4,
    sysPlantCd: 'ADMIN',
  },
  'qr-code-003': {
    sysId: 'table-003',
    tableName: '내부 1번',
    tableNum: 3,
    tableQty: 4,
    sysPlantCd: 'ADMIN',
  },
};

const MOCK_LOADING_DELAY_MS = 5000;

export type QrConnectStubResponse = {
  success: boolean;
  data?: QrTableInfo | null;
  message?: string | null;
};

/**
 * 참고 저장소는 URL 파라미터(/order/:storeId/table/:tableId)에 테이블 번호가 그대로 있어
 * 로딩 화면에서도 바로 보여준다. 이 프로젝트는 QR URL이 불투명한 코드라 API 응답을 기다려야
 * 알 수 있지만, 지금은 고정값 mock이라 로딩 화면에서도 같은 값을 미리 보여줄 수 있다.
 */
export function previewQrTableInfo(url: string): QrTableInfo | undefined {
  return MOCK_QR_TABLE_MAP[url];
}

export function connectQrStub(url: string): Promise<QrConnectStubResponse> {
  const data = MOCK_QR_TABLE_MAP[url];

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(
        data
          ? { success: true, data, message: null }
          : { success: false, data: null, message: '유효하지 않은 QR코드입니다.' },
      );
    }, MOCK_LOADING_DELAY_MS);
  });
}
