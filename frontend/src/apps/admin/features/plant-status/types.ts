export type PlantStatusRow = {
  id: string;
  plantCode: string;
  paymentCode: string;
  paymentName: string;
  licenseValidMonth: number | null;
  lastCheckoutDate: string;
  estimateCheckoutDate: string;
  status: 'active' | 'expiring' | 'expired';
};