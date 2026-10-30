export type ClientNotificationKind = 'notice' | 'qna' | 'staffCall';

export type ClientNotificationItem = {
  kind: ClientNotificationKind;
  sysId: string;
  title: string;
  body: string;
  timestamp: string;
  seen: boolean;
  targetPath: string;
};
