import type { SelectOption } from '@/shared/components/input';
import type { EditablePageFlowState, EditablePageSimpleModalState } from '@/shared/hooks/useEditablePageFlow';

export type QrCodeRow = {
  id: string;
  sysId?: string;
  linkSysId?: string;
  url?: string;
  useYn?: string;
  tableNum: string;
  remark: string;
  isNew: boolean;
};

export type QrCodeRowError = {
  tableNum: boolean;
};

export type QrCodeRowErrors = Record<string, QrCodeRowError>;

export type QrCodePageData = {
  rows: QrCodeRow[];
  rowErrors: QrCodeRowErrors;
  tableNumOptions: SelectOption[];
};

export type QrCodePageStatus = {
  isLoading: boolean;
  isFetching?: boolean;
  isError: boolean;
  error?: unknown;
  isSaving: boolean;
};

export type QrCodeSimpleModalState = EditablePageSimpleModalState;

export type QrCodePageActions = {
  handleKeywordChange: (value: string) => void;
  handleSearch: () => void;
  handleReset: () => void;
  handleSelectRow: (rowId: string) => void;
  handleChangeRowField: (rowId: string, key: 'tableNum' | 'remark', value: string) => void;
  handleToggleRow: (rowId: string, checked: boolean) => void;
  handleToggleAll: (checked: boolean) => void;
  handlePrintRow: (rowId: string) => void;
  handleBulkPrint: () => void;
  confirmPrint: () => void;
  cancelPrint: () => void;
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

export type QrCodePageUiProps = {
  draftKeyword: string;
  selectedRowId: string;
  checkedRowIds: Set<string>;
  printConfirm: { open: boolean; count: number };
  flowState: EditablePageFlowState;
};

export type QrCodePageViewModel = {
  data: QrCodePageData;
  status: QrCodePageStatus;
  actions: QrCodePageActions;
  uiProps: QrCodePageUiProps;
};
