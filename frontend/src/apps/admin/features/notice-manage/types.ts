export type NoticeManageRow = {
  id: string;
  sysId: string;
  noticeType: string;  // 공지 유형 (notice | update | alert)
  target: string;      // 수신 대상 (all | select)
  title: string;
  content: string;
  registrant: string;
  registeredAt: string;
  updatedAt: string;
};