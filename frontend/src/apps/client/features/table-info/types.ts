export type TableInfoUseYn = 'Y' | 'N';

export type TableInfoRow = {
  id: string;
  sysId?: string;
  tableNum: string;
  tableName: string;
  tableQty: string;
  useYn: TableInfoUseYn | '';
  isNew: boolean;
};

export type TableInfoRowField = 'tableNum' | 'tableName' | 'tableQty' | 'useYn';

export type TableInfoRowError = Record<TableInfoRowField, boolean>;

export type TableInfoRowErrors = Record<string, TableInfoRowError>;
