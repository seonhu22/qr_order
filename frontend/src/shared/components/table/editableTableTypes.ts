import type { CodeMasterRow } from '@/shared/hooks/useCodeMasterModalFlow';

/**
 * 마스터 CRUD 공통 테이블이 요구하는 최소 마스터 행 계약.
 */
export type EditableMasterRow = CodeMasterRow;

/**
 * 상세 편집 테이블의 컬럼 메타 정보 계약.
 */
export type EditableDetailColumn = {
  key: string;
  label: string;
  type: 'text' | 'boolean';
  required?: boolean;
  readOnlyOnExisting?: boolean;
  className?: string;
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
