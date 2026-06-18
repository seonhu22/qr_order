/**
 * @fileoverview 매장 직원(클라이언트 유저) 관리 화면 모델 타입
 *
 * @remarks
 * 권한 코드(`authorityCode`)는 백엔드 공통 콤보(`USER_ROLE`)에서 동적으로 확장될 수 있으므로
 * union literal이 아닌 `string`으로 둔다. (예: 'ADMIN', 'ADMIN_OWNER', 'STAFF', 'STAFF_PART' ...)
 */

import type { ClientUserEditorErrors, ClientUserEditorRow } from './hooks/useClientUserModalFlow';

export type ClientUser = {
  id: string;
  sysId?: string;
  userId: string;
  userName: string;
  authorityCode: string;
  authorityLabel: string;
};

export type ClientUserNoticeState = { title: string; description: string; helperText?: string } | null;

export type ClientUserPasswordResetTarget = { sysId: string; userId: string };

export type ClientUserPageData = {
  rows: ClientUser[];
};

export type ClientUserPageStatus = {
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: unknown;
  isDeleting: boolean;
  isResettingPassword: boolean;
};

export type ClientUserEditorUiState = {
  open: boolean;
  isDirty: boolean;
  isCreateMode: boolean;
  isUserIdReadonly: boolean;
  editingRow: ClientUserEditorRow | null;
  editorErrors: ClientUserEditorErrors;
};

export type ClientUserSaveConfirmUiState = {
  open: boolean;
  isCreateMode: boolean;
  isLoading: boolean;
};

export type ClientUserDirtyWarningUiState = {
  open: boolean;
};

export type ClientUserPageUiProps = {
  draftKeyword: string;
  selectedRowIds: Set<string>;
  isDeleteConfirmOpen: boolean;
  selectedDeleteCount: number;
  passwordResetTarget: ClientUserPasswordResetTarget | null;
  noticeState: ClientUserNoticeState;
  editor: ClientUserEditorUiState;
  saveConfirm: ClientUserSaveConfirmUiState;
  dirtyWarning: ClientUserDirtyWarningUiState;
};

export type ClientUserPageActions = {
  handleKeywordChange: (value: string) => void;
  handleSearch: () => void;
  handleReset: () => void;
  handleToggleRow: (rowId: string, checked: boolean) => void;
  handleToggleAll: (checked: boolean) => void;
  handleCreate: () => void;
  handleEdit: (rowId: string) => void;
  handleDelete: () => void;
  confirmDelete: () => Promise<void>;
  closeDeleteConfirm: () => void;
  handleResetPassword: (userId: string) => void;
  confirmResetPassword: () => Promise<void>;
  closePasswordResetConfirm: () => void;
  closeNotice: () => void;
  changeEditingField: (key: keyof Omit<ClientUserEditorRow, 'id' | 'sysId'>, value: string) => void;
  requestSave: () => void;
  confirmSave: () => Promise<void>;
  confirmEdit: () => Promise<void>;
  closeEditorModal: () => void;
  forceCloseEditorModal: () => void;
  closeSaveConfirm: () => void;
  closeDirtyWarning: () => void;
};

export type ClientUserPageViewModel = {
  data: ClientUserPageData;
  status: ClientUserPageStatus;
  uiProps: ClientUserPageUiProps;
  actions: ClientUserPageActions;
};
