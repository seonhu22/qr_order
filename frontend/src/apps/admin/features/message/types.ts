/**
 * @fileoverview 메시지 관리 feature 화면 모델 타입
 */

/**
 * 테이블 한 줄에 표시되는 메시지 행 데이터.
 *
 * @property {string} id React 렌더링과 선택 상태에 사용하는 고유 ID
 * @property {string} code 메시지 코드
 * @property {string} name 메시지 이름
 * @property {string} content 실제 사용자에게 보여줄 메시지 내용
 * @property {boolean} isNew 신규로 추가된 행인지 여부
 */
export type MessageRow = {
  id: string;
  code: string;
  name: string;
  content: string;
  isNew: boolean;
};

/**
 * 화면 렌더링에 필요한 데이터 묶음.
 */
export type MessagePageData = {
  rows: MessageRow[];
};

/**
 * 서버 통신 또는 예외 상태를 담는 영역.
 *
 * 현재는 목업 화면이라 고정값을 사용하지만,
 * 이후 API 연동 시 query 상태를 이 구조에 넣으면 된다.
 */
export type MessagePageStatus = {
  isLoading: boolean;
  isError: boolean;
  isSaving: boolean;
};

export type MessageSimpleModalState = {
  description: string;
  helperText?: string;
} | null;

/**
 * 화면에서 버튼 클릭, 입력 변경 시 호출하는 액션 모음.
 */
export type MessagePageActions = {
  handleKeywordChange: (value: string) => void;
  handleSearch: () => void;
  handleReset: () => void;
  handleSelectRow: (rowId: string) => void;
  handleChangeRowField: (rowId: string, key: 'code' | 'name' | 'content', value: string) => void;
  handleAddRow: () => void;
  handleDeleteRow: () => void;
  handleSave: () => void;
  confirmSave: () => void;
  closeSaveConfirm: () => void;
  closeSimpleModal: () => void;
  confirmFilterAction: () => void;
  cancelFilterAction: () => void;
};

/**
 * 렌더링은 필요하지만 서버 데이터는 아닌 UI 전용 상태.
 */
export type MessagePageUiProps = {
  draftKeyword: string;
  selectedRowId: string;
  pendingFilterAction: 'search' | 'reset' | null;
  isSaveConfirmOpen: boolean;
  simpleModalState: MessageSimpleModalState;
};

/**
 * 페이지가 사용하는 표준 반환 구조.
 *
 * `operations.md`의 원칙에 맞춰
 * data / status / actions / uiProps 로 분리한다.
 */
export type MessagePageViewModel = {
  data: MessagePageData;
  status: MessagePageStatus;
  actions: MessagePageActions;
  uiProps: MessagePageUiProps;
};
