import type { CodeMasterRow } from '@/shared/hooks/useCodeMasterModalFlow';
import type { SelectOption } from '@/shared/components/input';

/**
 * 마스터 CRUD 공통 테이블이 요구하는 최소 마스터 행 계약.
 */
export type EditableMasterRow = CodeMasterRow;

/**
 * `EditableDetailTable`이 요구하는 최소 마스터 행 계약.
 *
 * @description
 * 상세 테이블은 선택된 마스터의 존재 여부만 확인하므로 코드/이름 같은 필드는 요구하지 않는다.
 */
export type EditableDetailMasterRow = { id: string };

/**
 * 상세 편집 테이블의 컬럼 메타 정보 계약.
 *
 * @description
 * - `select`: Y/N 같은 콤보 입력 컬럼. `options`로 선택지를 전달한다.
 * - `action`: 값이 없는 행 단위 버튼 컬럼(예: 수정). `EditableDetailTable`의 `actions.onEditRow`를 호출한다.
 */
export type EditableDetailColumn = {
  key: string;
  label: string;
  type: 'text' | 'boolean' | 'select' | 'action';
  required?: boolean;
  readOnlyOnExisting?: boolean;
  className?: string;
  /** type: 'text'일 때 입력 형식. 기본값은 'text'. */
  inputType?: 'text' | 'number';
  /** type: 'select'일 때 선택지. */
  options?: SelectOption[];
};

/**
 * 상세 편집 테이블의 단일 행 데이터 계약.
 */
export type EditableDetailRow = {
  id: string;
  ordNo: number;
  isNew?: boolean;
  values: Record<string, string | boolean>;
};
