import type { EditablePageFlowState, EditablePageSimpleModalState } from '@/shared/hooks/useEditablePageFlow';

export type StoreTableRow = {
  id: string;
  sysId?: string;
  tableNum: string;
  tableName: string;
  tableQty: string;
  useYn: string;
  isNew: boolean;
};

export type StoreTableRowError = {
  tableNum: boolean;
  tableName: boolean;
  tableQty: boolean;
  useYn: boolean;
};

export type StoreTableRowErrors = Record<string, StoreTableRowError>;

export type StoreTablePageData = {
  rows: StoreTableRow[];
  rowErrors: StoreTableRowErrors;
};

export type StoreTablePageStatus = {
  isLoading: boolean;
  isFetching?: boolean;
  isError: boolean;
  error?: unknown;
  isSaving: boolean;
};

export type StoreTableSimpleModalState = EditablePageSimpleModalState;

export type StoreTablePageActions = {
  handleKeywordChange: (value: string) => void;
  handleSearch: () => void;
  handleReset: () => void;
  handleSelectRow: (rowId: string) => void;
  handleChangeRowField: (rowId: string, key: 'tableNum' | 'tableName' | 'tableQty' | 'useYn', value: string) => void;
  handleAddRow: () => void;
  handleDeleteRow: () => void;
  handleSave: () => void;
  confirmSave: () => void;
  closeSaveConfirm: () => void;
  closeSimpleModal: () => void;
  confirmSimpleModal: () => void | Promise<void>;
  confirmFilterAction: () => void;
  cancelFilterAction: () => void;
};

export type StoreTablePageUiProps = {
  draftKeyword: string;
  selectedRowId: string;
  flowState: EditablePageFlowState;
};

export type StoreTablePageViewModel = {
  data: StoreTablePageData;
  status: StoreTablePageStatus;
  actions: StoreTablePageActions;
  uiProps: StoreTablePageUiProps;
};
