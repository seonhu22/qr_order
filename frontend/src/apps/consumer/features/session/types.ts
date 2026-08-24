export type ConsumerSessionStatus = 'active' | 'expired' | 'closed' | 'none';

export type ConsumerSession = {
  sysPlantCd: string;
  tableSysId: string;
  /** 실제 매장명 API가 없어 mock 단계에서만 고정값으로 채워진다. */
  storeName?: string;
  tableName?: string;
  tableNum?: number;
  tableQty?: number;
};

export type UseConsumerSessionResult = {
  isLoading: boolean;
  status: ConsumerSessionStatus;
  session: ConsumerSession | null;
};
