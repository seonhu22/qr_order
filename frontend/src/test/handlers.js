import { http, HttpResponse } from 'msw';

let currentUser = null;
const failedAttempts = {};
const mockMenus = [
  {
    sysId: 'menu-root-admin',
    menuCd: 'ADMIN',
    menuNm: 'Admin',
    parentMenuCd: 'ROOT',
    ordNo: '1',
    treeLevel: '0',
  },
  {
    sysId: 'menu-root-client',
    menuCd: 'CLIENT',
    menuNm: 'Client',
    parentMenuCd: 'ROOT',
    ordNo: '2',
    treeLevel: '0',
  },
  {
    sysId: 'menu-admin-system',
    menuCd: 'adminSystem',
    menuNm: 'Admin System',
    parentMenuCd: 'ADMIN',
    ordNo: '1',
    treeLevel: '1',
  },
  {
    sysId: 'menu-admin-users',
    menuCd: 'adminUsers',
    menuNm: 'Admin Users',
    parentMenuCd: 'adminSystem',
    menuUrl: '/admin/users',
    ordNo: '1',
    treeLevel: '2',
  },
  {
    sysId: 'menu-client-store',
    menuCd: 'store',
    menuNm: 'Store',
    parentMenuCd: 'CLIENT',
    ordNo: '1',
    treeLevel: '1',
  },
  {
    sysId: 'menu-client-store-info',
    menuCd: 'storeInfoManage',
    menuNm: 'Store Info',
    parentMenuCd: 'store',
    ordNo: '1',
    treeLevel: '2',
  },
  {
    sysId: 'menu-client-store-info-page',
    menuCd: 'storeInfo',
    menuNm: 'Store Info Detail',
    parentMenuCd: 'storeInfoManage',
    menuUrl: '/client/store/info',
    ordNo: '1',
    treeLevel: '3',
  },
  {
    sysId: 'menu-client-order',
    menuCd: 'order',
    menuNm: 'Order',
    parentMenuCd: 'CLIENT',
    ordNo: '2',
    treeLevel: '1',
  },
  {
    sysId: 'menu-client-order-history',
    menuCd: 'orderHistory',
    menuNm: 'Order History',
    parentMenuCd: 'order',
    menuUrl: '/client/order/history',
    ordNo: '1',
    treeLevel: '2',
  },
];

export const handlers = [
  http.get('/api/system/settings/menu/search', () => {
    return HttpResponse.json(mockMenus);
  }),

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

  http.post('/api/client/auth/find-password', async () => {
    return HttpResponse.json({ success: true, message: '인증 코드가 이메일로 발송되었습니다.' });
  }),

  http.post('/api/client/auth/find-password/verify', async () => {
    return HttpResponse.json({ success: true, message: '인증이 완료되었습니다.' });
  }),

  http.post('/api/client/auth/signup', async () => {
    return HttpResponse.json({ success: true, message: '회원가입이 완료되었습니다.' });
  }),

  // 테스트용 클라이언트 초기 비밀번호 활성화 핸들러
  http.post('/api/client/auth/init-pwd-active', async () => {
    if (currentUser) {
      currentUser = { ...currentUser, initPwdRequired: false };
    }
    return HttpResponse.json({ success: true, message: '비밀번호가 변경되었습니다.' });
  }),

  http.post('/api/auth/logout', () => {
    currentUser = null;
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
