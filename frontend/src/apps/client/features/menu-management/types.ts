import type { EditableDetailColumn } from '@/shared/components/table/editableTableTypes';

/**
 * 카테고리 마스터 행 모델.
 */
export type MenuCategoryRow = {
  id: string;
  sysId?: string;
  name: string;
  useYn: 'Y' | 'N';
};

/**
 * 메뉴 상세 테이블 행 모델.
 *
 * @property values 컬럼 key 기준 값 맵
 */
export type MenuDetailRow = {
  id: string;
  sysId?: string;
  masterId: string;
  ordNo: number;
  isNew?: boolean;
  values: Record<string, string>;
};

/**
 * 마스터별 메뉴 상세 스키마 묶음.
 */
export type MenuDetailSchema = {
  columns: EditableDetailColumn[];
  rows: MenuDetailRow[];
};
