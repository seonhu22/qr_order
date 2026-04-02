import { http, HttpResponse } from 'msw';

let currentUser = null;

export const handlers = [
  http.get('/api/auth/me', () => {
    if (!currentUser) {
      return HttpResponse.json({ success: false }, { status: 401 });
    }

    return HttpResponse.json({
      success: true,
      data: currentUser,
    });
  }),
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json();

    if (body.userId === 'admin' && body.userPassword === 'password') {
      currentUser = {
        userId: 'admin',
        userName: '관리자',
        role: 'ADMIN',
      };

      return HttpResponse.json({
        success: true,
        message: '로그인 성공',
        data: currentUser,
      });
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
];
