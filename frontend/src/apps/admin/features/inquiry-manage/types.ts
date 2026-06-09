export type InquiryAnswerStatus = 'answered' | 'pending';

export type InquiryManageRow = {
  id: string;
  sysId?: string;
  fileUlid?: string;
  title: string;
  content: string;
  plant: string;
  registrant: string;
  registeredAt: string;
  updatedAt: string;
  answeredAt: string;
  answerer: string;
  answerStatus: InquiryAnswerStatus;
  answerContent: string;
};
