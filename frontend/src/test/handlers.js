import { http, HttpResponse } from 'msw';

let currentUser = null;
const failedAttempts = {};
let signupEmail = null;
let signupValidCode = null;
let pwdChangeEmail = null;
let pwdChangeValidCode = null;
let pwdChangeVerified = false;

const MOCK_EMAIL_VALID_CODE = 'ABC123';

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
      currentUser = {
        userId: 'admin',
        userNm: '슈퍼 관리자',
        role: 'ADMIN',
        initPwdRequired: false,
      };
      return HttpResponse.json({
        success: true,
        message: '로그인 성공',
        data: { userId: 'admin', userNm: '슈퍼 관리자', role: 'ADMIN' },
      });
    }

    if (body.userId === 'a' && body.userPassword === '1') {
      failedAttempts[body.userId] = 0;
      currentUser = { userId: 'a', userNm: '일반 관리자', role: 'ADMIN', initPwdRequired: false };
      return HttpResponse.json({
        success: true,
        message: '로그인 성공',
        data: currentUser,
      });
    }

    if (body.userId === 'b' && body.userPassword === '1') {
      failedAttempts[body.userId] = 0;
      currentUser = { userId: 'b', userNm: '초기 비밀번호 관리자', role: 'ADMIN', initPwdRequired: true };
      return HttpResponse.json({
        success: true,
        message: '로그인 성공',
        data: currentUser,
      });
    }

    // locked 계정: password_fail_cnt >= 5 시나리오 테스트용
    if (body.userId === 'locked') {
      return HttpResponse.json(
        {
          success: false,
          message: '비밀번호 오류 횟수를 초과하였습니다.',
          data: { password_fail_cnt: 5 },
        },
        { status: 200 },
      );
    }

    currentUser = null;
    const count = (failedAttempts[body.userId] ?? 0) + 1;
    failedAttempts[body.userId] = count;
    return HttpResponse.json(
      {
        success: false,
        message: '아이디 또는 비밀번호를 확인해주세요.',
        data: { password_fail_cnt: count },
      },
      { status: 200 },
    );
  }),

  http.post('/api/auth/email_valid/new_user/send', async ({ request }) => {
    const body = await request.json();
    signupEmail = body.email;
    signupValidCode = MOCK_EMAIL_VALID_CODE;
    return HttpResponse.json({ success: true, message: '인증 코드가 발송되었습니다.' });
  }),

  http.post('/api/auth/email_valid/new_user/re_send', async ({ request }) => {
    const body = await request.json();
    signupEmail = body.email;
    signupValidCode = MOCK_EMAIL_VALID_CODE;
    return HttpResponse.json({ success: true, message: '인증 코드가 재발송되었습니다.' });
  }),

  http.get('/api/auth/signup/new/chkEmailValid', ({ request }) => {
    const url = new URL(request.url);
    const email = url.searchParams.get('email');
    const validCode = url.searchParams.get('validCode');

    return HttpResponse.json(email === signupEmail && validCode === signupValidCode);
  }),

  http.post('/api/auth/signup/new', async () => {
    return HttpResponse.json({ success: true, message: '회원가입이 완료되었습니다.' });
  }),

  http.post('/api/auth/email_valid/pwd_change/send', async ({ request }) => {
    const body = await request.json();
    pwdChangeEmail = body.email;
    pwdChangeValidCode = MOCK_EMAIL_VALID_CODE;
    pwdChangeVerified = false;
    return HttpResponse.json({ success: true, message: '인증 코드가 발송되었습니다.' });
  }),

  http.post('/api/auth/email_valid/pwd_change/re_send', async ({ request }) => {
    const body = await request.json();
    pwdChangeEmail = body.email;
    pwdChangeValidCode = MOCK_EMAIL_VALID_CODE;
    pwdChangeVerified = false;
    return HttpResponse.json({ success: true, message: '인증 코드가 재발송되었습니다.' });
  }),

  http.post('/api/auth/email_valid/pwd_change', async ({ request }) => {
    const body = await request.json();
    const isValid = body.email === pwdChangeEmail && body.validCode === pwdChangeValidCode;

    if (!isValid) {
      return HttpResponse.json(
        { success: false, message: '인증 코드가 일치하지 않습니다.' },
        { status: 400 },
      );
    }

    pwdChangeVerified = true;
    return HttpResponse.json({ success: true, message: '이메일 인증 완료.' });
  }),

  http.post('/api/auth/pwd_change', async () => {
    if (!pwdChangeVerified) {
      return HttpResponse.json(
        { success: false, message: '이메일 인증을 먼저 완료해주세요.' },
        { status: 400 },
      );
    }

    pwdChangeVerified = false;
    return HttpResponse.json({ success: true, message: '비밀번호가 초기화 되었습니다.' });
  }),

  http.post('/api/auth/logout', () => {
    currentUser = null;
    signupEmail = null;
    signupValidCode = null;
    pwdChangeEmail = null;
    pwdChangeValidCode = null;
    pwdChangeVerified = false;
    return HttpResponse.json({ success: true });
  }),

  http.post('/api/auth/init-pwd', async () => {
    return HttpResponse.json({ success: true, message: '비밀번호가 초기화되었습니다.' });
  }),

  http.post('/api/auth/init-pwd-active', async () => {
    if (currentUser) {
      currentUser = { ...currentUser, initPwdRequired: false };
    }
    return HttpResponse.json({ success: true, message: '비밀번호가 변경되었습니다.' });
  }),
];
