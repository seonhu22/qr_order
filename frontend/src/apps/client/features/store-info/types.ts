/**
 * @fileoverview 매장 기본 정보 화면 모델 타입
 *
 * @description
 * - 사업자 인증 정보(read-only): businessNumber / ownerName / address
 * - 매장 운영 정보(편집 가능): storeName / contactPhone / emergencyPhone / businessHours / email
 */

export type StoreInfo = {
  storeName: string;
  businessNumber: string;
  ownerName: string;
  address: string;
  contactPhone: string;
  emergencyPhone: string;
  businessHours: string;
  email: string;
};

export type StoreInfoFieldKey = keyof StoreInfo;

export type StoreInfoFieldMeta = {
  key: StoreInfoFieldKey;
  label: string;
  required: boolean;
  /** 사업자 인증 기반 정보는 항상 read-only */
  editable: boolean;
  inputType?: 'text' | 'email' | 'tel';
};

export const STORE_INFO_FIELDS: StoreInfoFieldMeta[] = [
  { key: 'storeName',      label: '상호명',          required: true,  editable: true },
  { key: 'businessNumber', label: '사업자등록번호',  required: false, editable: false },
  { key: 'ownerName',      label: '대표자명',        required: false, editable: false },
  { key: 'address',        label: '주소',            required: false, editable: false },
  { key: 'contactPhone',   label: '연락처',          required: true,  editable: true, inputType: 'tel' },
  { key: 'emergencyPhone', label: '비상용 연락처',   required: false, editable: true, inputType: 'tel' },
  { key: 'businessHours',  label: '영업시간',        required: true,  editable: true },
  { key: 'email',          label: '이메일',          required: true,  editable: true, inputType: 'email' },
];
