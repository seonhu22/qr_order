export type InquiryAnswerStatus = 'answered' | 'pending';

export type InquiryListRow = {
  id: string;
  sysId: string;
  title: string;
  content: string;
  registrant: string;
  registeredAt: string;
  answerStatus: InquiryAnswerStatus;
  answeredAt: string;
  answerContent: string;
  fileUlid?: string;
};
