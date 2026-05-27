export type AccessLogMasterRow = {
  id: string;
  sysId: string;
  userId: string;
  userNm: string;
  ipAddress: string;
  loginDatetime: string;
  logoutDatetime: string;
};

export type AccessLogDetailRow = {
  id: string;
  menuCd: string;
  menuNm: string;
  menuOpenDatetime: string;
  menuCloseDatetime: string;
};
