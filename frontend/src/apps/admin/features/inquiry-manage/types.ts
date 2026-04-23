export type InquiryAnswerStatus = 'answered' | 'pending';

export type InquiryManageRow = {
  id: string;
  title: string;
  content: string;
  plant: string;
  registrant: string;
  registeredAt: string;
  updatedAt: string;
  answeredAt: string;
  answerStatus: InquiryAnswerStatus;
  answerContent: string;
};