/**
 * @fileoverview 관리자 관리 feature 화면 모델 타입
 */

import type { SelectOption } from '@/shared/components/input';

export type AdminUserRow = {
  id: string;
  sysId?: string;
  userId: string;
  userName: string;
  plantCd: string;
  plantName: string;
  isNew: boolean;
};

export type AdminUserRowError = {
  userId: boolean;
  userName: boolean;
  plantCd: boolean;
};

export type AdminUserRowErrors = Record<string, AdminUserRowError>;

export type AdminUserSimpleModalState = {
  description: string;
  helperText?: string;
  onConfirm?: () => void | Promise<void>;
} | null;

export type AdminUserWrapperModalState = {
  title: string;
  description: string;
} | null;

export type AdminUserFlowState = {
  simpleModalState: AdminUserSimpleModalState;
  wrapperModalState: AdminUserWrapperModalState;
  isSaveConfirmOpen: boolean;
};

export type AdminUserPageData = {
  rows: AdminUserRow[];
  plantOptions: SelectOption[];
  rowErrors: AdminUserRowErrors;
};

export type AdminUserPageStatus = {
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: unknown;
  isSaving: boolean;
  isResettingPassword: boolean;
};

export type AdminUserPageActions = {
  handleKeywordChange: (value: string) => void;
  handleSearch: () => void;
  handleReset: () => void;
  handleSelectRow: (rowId: string) => void;
  handleChangeRowField: (rowId: string, key: 'userId' | 'userName', value: string) => void;
  handleChangeRowPlant: (rowId: string, plantCd: string) => void;
  handleAddRow: () => void;
  handleDeleteRow: () => void;
  handleSave: () => void;
  confirmSave: () => void | Promise<void>;
  handleResetPassword: (userId: string) => void;
  closeSimpleModal: () => void;
  closeWrapperModal: () => void;
  closeSaveConfirm: () => void;
  confirmSimpleModal: () => void | Promise<void>;
};

export type AdminUserPageUiProps = {
  draftKeyword: string;
  appliedKeyword: string;
  selectedRowId: string;
  isDirty: boolean;
  flowState: AdminUserFlowState;
};

export type AdminUserPageViewModel = {
  data: AdminUserPageData;
  status: AdminUserPageStatus;
  actions: AdminUserPageActions;
  uiProps: AdminUserPageUiProps;
};
