import type { Message } from '@/generated/types/message';

export const MESSAGE_MOCK_ROWS: Message[] = [
  { sysId: 'msg-001', msgCd: 'ERR_AUTH_001',  msgNm: '인증 오류',   msgDescription: '로그인 인증이 만료되었습니다.' },
  { sysId: 'msg-002', msgCd: 'ERR_VALID_001', msgNm: '필수값 누락', msgDescription: '필수 입력값을 확인해주세요.' },
  { sysId: 'msg-003', msgCd: 'INFO_SAVE_001', msgNm: '저장 완료',   msgDescription: '저장되었습니다.' },
  { sysId: 'msg-004', msgCd: 'ERR_PWD_001',   msgNm: '비밀번호 오류', msgDescription: '비밀번호를 확인해주세요.' },
];
