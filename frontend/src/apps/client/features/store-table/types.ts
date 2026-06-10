export type StoreTableInfo = {
  id: string;
  tableNumber: number;
  tableName: string;
  seatCount: number;
  useYn: 'Y' | 'N';
};

export type StoreQRCode = {
  id: string;
  qrCode: string;
  tableNumber: number;
  description: string;
  url: string;
  useYn: 'Y' | 'N';
};
