export type ConsumerSessionStatus = 'active' | 'expired' | 'closed' | 'none' | 'error';

export type ConsumerOrderingBlockedReason = 'TABLE_INACTIVE' | null;

export type ConsumerSession = {
  consumerSessionId: string;
  status: Exclude<ConsumerSessionStatus, 'none' | 'error'>;
  sysPlantCd: string;
  tableSysId: string;
  storeName: string;
  tableName: string;
  tableNum: number;
  tableQty: number;
  orderingAllowed: boolean;
  orderingBlockedReason: ConsumerOrderingBlockedReason;
  startedAt: string;
};

export type UseConsumerSessionResult = {
  isLoading: boolean;
  status: ConsumerSessionStatus;
  session: ConsumerSession | null;
};
