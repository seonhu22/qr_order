export const AUDIT_FLAG_LABEL: Record<string, string> = {
  I: '등록',
  U: '수정',
  D: '삭제',
  FI: '파일 등록',
  FU: '파일 수정',
  FD: '파일 삭제',
};

export const AUDIT_FLAG_OPTIONS = [
  { value: 'ALL', label: '전체' },
  { value: 'I', label: AUDIT_FLAG_LABEL.I },
  { value: 'U', label: AUDIT_FLAG_LABEL.U },
  { value: 'D', label: AUDIT_FLAG_LABEL.D },
  { value: 'FI', label: AUDIT_FLAG_LABEL.FI },
  { value: 'FU', label: AUDIT_FLAG_LABEL.FU },
  { value: 'FD', label: AUDIT_FLAG_LABEL.FD },
];

export function getAuditFlagLabel(auditFlag: string) {
  return AUDIT_FLAG_LABEL[auditFlag] ?? auditFlag;
}

export function getAuditFlagClassName(auditFlag: string) {
  const normalizedFlag = auditFlag.trim().toLowerCase();
  return normalizedFlag ? `change-history-flag-badge--${normalizedFlag}` : '';
}
