export type ClientNotice = {
  id: string;
  title: string;
  createdAt: string;
  writer: string;
  content: string;
  useYn: 'Y' | 'N';
};

export type ClientQna = {
  id: string;
  title: string;
  createdAt: string;
  status: '답변대기' | '답변완료';
  content: string;
  answer?: string;
};
