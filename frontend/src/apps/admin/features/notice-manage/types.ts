export type NoticeManageRow = {
  id: string;
  sysId: string;
  fileUlid?: string;
  useYn?: string;
  noticeType: string;  // 공지 유형 (notice | update | alert)
  target: string;      // 수신 대상 (all | manager | staff)
  title: string;
  content: string;
  registrant: string;
  registeredAt: string;
  updatedAt: string;
};
