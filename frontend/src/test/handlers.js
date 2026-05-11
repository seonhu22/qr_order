import { http, HttpResponse } from 'msw';

let currentUser = null;
const failedAttempts = {};

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
      failedAttempts[body.userId] = 0;
      currentUser = { userId: 'admin', userNm: '슈퍼 관리자', role: 'ADMIN', init_yn: 'N' };
      return HttpResponse.json({ success: true, message: '로그인 성공', data: currentUser });
    }

    if (body.userId === 'a' && body.userPassword === '1') {
      failedAttempts[body.userId] = 0;
      currentUser = { userId: 'a', userNm: '일반 관리자', role: 'ADMIN', init_yn: 'Y' };
      return HttpResponse.json({ success: true, message: '로그인 성공', data: currentUser });
    }

    // locked 계정: password_fail_cnt >= 5 시나리오 테스트용
    if (body.userId === 'locked') {
      return HttpResponse.json(
        { success: false, message: '비밀번호 오류 횟수를 초과하였습니다.', data: { password_fail_cnt: 5 } },
        { status: 200 },
      );
    }

    currentUser = null;
    const count = (failedAttempts[body.userId] ?? 0) + 1;
    failedAttempts[body.userId] = count;
    return HttpResponse.json(
      { success: false, message: '아이디 또는 비밀번호를 확인해주세요.', data: { password_fail_cnt: count } },
      { status: 200 },
    );
  }),

  http.post('/api/client/auth/find-password', async () => {
    return HttpResponse.json({ success: true, message: '인증 코드가 이메일로 발송되었습니다.' });
  }),

  http.post('/api/client/auth/find-password/verify', async () => {
    return HttpResponse.json({ success: true, message: '인증이 완료되었습니다.' });
  }),

  http.post('/api/client/auth/signup', async () => {
    return HttpResponse.json({ success: true, message: '회원가입이 완료되었습니다.' });
  }),

  http.post('/api/client/auth/login', async ({ request }) => {
    const body = await request.json();

    if (body.userId === 'client' && body.userPassword === 'password') {
      return HttpResponse.json({ success: true, message: '로그인 성공', data: { userId: 'client', userNm: '클라이언트 사용자' } });
    }

    if (body.userId === 'b' && body.userPassword === '1') {
      return HttpResponse.json({ success: true, message: '로그인 성공', data: { userId: 'b', userNm: '테스트 사용자' } });
    }

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
