import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/auth/me', () => {
    return HttpResponse.json({ success: false }, { status: 401 });
  }),
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json();

    if (body.userId === 'admin' && body.userPassword === 'password') {
      return HttpResponse.json({ success: true, message: '로그인 성공' });
    }

    return HttpResponse.json(
      { success: false, message: '아이디 또는 비밀번호를 확인해주세요.' },
      { status: 200 },
    );
  }),
  http.post('/api/auth/logout', () => {
    return new HttpResponse(null, { status: 204 });
  }),
];
