/**
 * @fileoverview 관리자 관리 feature 화면 모델 타입
 */

export type AdminUserRow = {
  id: string;
  sysId?: string;
  userId: string;
  userName: string;
  plantCd: string;
  plantName: string;
  isNew: boolean;
};
