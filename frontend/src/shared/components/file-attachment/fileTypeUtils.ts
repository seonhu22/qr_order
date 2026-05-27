/**
 * 파일 확장자 → 아이콘 ID · 색상 토큰 매핑
 *
 * 아이콘은 sprite.svg에 정의된 symbol ID를 사용한다.
 * 색상은 CSS 커스텀 프로퍼티 이름(var() 없이)을 반환하며,
 * 호출 측에서 `style={{ color: 'var(--token)' }}`로 적용한다.
 */

type FileTypeInfo = {
  iconId: string;
  /** FileAttachment.css에 정의된 색상 클래스 (file-attachment__item-icon--*) */
  colorClass: string;
};

const FILE_TYPE_MAP: Record<string, FileTypeInfo> = {
  jpg:  { iconId: 'i-file-image', colorClass: 'file-attachment__item-icon--image' },
  jpeg: { iconId: 'i-file-image', colorClass: 'file-attachment__item-icon--image' },
  png:  { iconId: 'i-file-image', colorClass: 'file-attachment__item-icon--image' },
  pdf:  { iconId: 'i-file-doc',   colorClass: 'file-attachment__item-icon--pdf'   },
  docx: { iconId: 'i-file-doc',   colorClass: 'file-attachment__item-icon--doc'   },
  xlsx: { iconId: 'i-file-sheet', colorClass: 'file-attachment__item-icon--sheet' },
  pptx: { iconId: 'i-file-ppt',  colorClass: 'file-attachment__item-icon--ppt'   },
  zip:  { iconId: 'i-file-zip',  colorClass: 'file-attachment__item-icon--zip'   },
};

const FALLBACK: FileTypeInfo = {
  iconId: 'i-file',
  colorClass: '',
};

export function getFileTypeInfo(filename: string): FileTypeInfo {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  return FILE_TYPE_MAP[ext] ?? FALLBACK;
}
