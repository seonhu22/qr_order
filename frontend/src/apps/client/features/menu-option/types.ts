import type { EditableDetailColumn } from '@/shared/components/table/editableTableTypes';

/**
 * 옵션 설정 대상 메뉴 마스터 행 모델. 선택만 가능한 읽기 전용 목록이다.
 */
export type MenuOptionMasterRow = {
  id: string;
  sysId?: string;
  name: string;
  useYn: 'Y' | 'N';
};

/**
 * 옵션 그룹 행 모델.
 */
export type MenuOptionGroupRow = {
  id: string;
  sysId?: string;
  masterId: string;
  ordNo: number;
  isNew?: boolean;
  values: {
    groupName: string;
    requiredYn: boolean;
    inputType: string;
    useYn: string;
  };
};

export type MenuOptionGroupSchema = {
  columns: EditableDetailColumn[];
  rows: MenuOptionGroupRow[];
};

/**
 * 옵션 항목 행 모델.
 */
export type MenuOptionDetailRow = {
  id: string;
  sysId?: string;
  groupId: string;
  ordNo: number;
  isNew?: boolean;
  fileUlid?: string;
  values: {
    menuOptionName: string;
    menuOptionPrice: string;
    maximumNum: string;
    menuDescription: string;
    useYn: string;
    defaultYn: boolean;
  };
};

export type MenuOptionDetailSchema = {
  columns: EditableDetailColumn[];
  rows: MenuOptionDetailRow[];
};
