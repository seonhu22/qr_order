export interface QaAccount {
  label: string;
  store: string;
  role: string;
  id: string;
  password: string;
}
export interface QaConfig {
  baseURL: string;
  accounts: QaAccount[];
  orderFlow: null | { qrPath: string; tableSysId: string; tableNum: number; menuName: string };
}
export function readQaConfig(file: string, overrides?: Record<string, string>): QaConfig;
export function assertIdentity(data: unknown, account: QaAccount): void;
