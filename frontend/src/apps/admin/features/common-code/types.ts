export type MasterCode = {
  id: string;
  sysId?: string;
  code: string;
  name: string;
  useYn: 'Y' | 'N';
};

export type DetailCode = {
  id: string;
  sysId?: string;
  linkSysId: string;
  code: string;
  name: string;
  useYn: boolean;
  ordNo: number;
  checked: boolean;
  isNew?: boolean;
};
