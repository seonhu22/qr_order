import type { CodeMasterRow } from '@/shared/hooks/useCodeMasterModalFlow';

/**
 * 규칙 마스터 행 모델.
 *
 * @description
 * 공통 코드 마스터 타입을 재사용해 규칙 마스터도 동일 편집 플로우를 사용한다.
 */
export type RuleMasterRow = CodeMasterRow & {
  sysId?: string;
};

/**
 * 규칙 상세 테이블 컬럼 메타데이터.
 */
export type RuleDetailColumn = {
  key: string;
  label: string;
  type: 'text' | 'boolean';
  required?: boolean;
  readOnlyOnExisting?: boolean;
};

/**
 * 규칙 상세 테이블 행 모델.
 *
 * @property values 컬럼 key 기준 값 맵
 */
export type RuleDetailRow = {
  id: string;
  sysId?: string;
  masterId: string;
  ordNo: number;
  isNew?: boolean;
  values: Record<string, string | boolean>;
};

/**
 * 마스터별 상세 스키마 묶음.
 */
export type RuleDetailSchema = {
  columns: RuleDetailColumn[];
  rows: RuleDetailRow[];
};
