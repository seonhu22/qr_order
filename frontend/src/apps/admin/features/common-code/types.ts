export type MasterCode = {
  id: string;
  code: string;
  name: string;
  useYn: 'Y' | 'N';
};

export type DetailCode = {
  id: string;
  code: string;
  name: string;
  useYn: boolean;
  checked: boolean;
};
