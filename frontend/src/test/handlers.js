import { http, HttpResponse } from 'msw';

let currentUser = null;

export const handlers = [
  http.get('/api/auth/me', () => {
    if (!currentUser) {
      return HttpResponse.json({ success: false }, { status: 401 });
    }
    return HttpResponse.json({ success: true, data: currentUser });
  }),

  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json();

    if (body.userId === 'admin' && body.userPassword === 'password') {
      currentUser = { userId: 'admin', userNm: '슈퍼 관리자', role: 'ADMIN', init_yn: 'N' };
      return HttpResponse.json({ success: true, message: '로그인 성공', data: currentUser });
    }

    if (body.userId === 'a' && body.userPassword === '1') {
      currentUser = { userId: 'a', userNm: '일반 관리자', role: 'ADMIN', init_yn: 'Y' };
      return HttpResponse.json({ success: true, message: '로그인 성공', data: currentUser });
    }

    currentUser = null;
    return HttpResponse.json(
      { success: false, message: '아이디 또는 비밀번호를 확인해주세요.' },
      { status: 200 },
    );
  }),

  http.post('/api/auth/logout', () => {
    currentUser = null;
    return HttpResponse.json({ success: true });
  }),

  http.post('/api/auth/init-pwd', async () => {
    if (currentUser) {
      currentUser = { ...currentUser, init_yn: 'N' };
    }
    return HttpResponse.json({ success: true, message: '비밀번호가 변경되었습니다.' });
  }),
];
