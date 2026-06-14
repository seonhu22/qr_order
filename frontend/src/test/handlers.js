import { http, HttpResponse } from 'msw';

let currentUser = null;
const failedAttempts = {};
const initialTableInfoRows = [
  { sysId: 'table-1', tableNum: 1, tableName: '테이블 1번', tableQty: 4, useYn: 'Y' },
  { sysId: 'table-2', tableNum: 2, tableName: '테이블 2번', tableQty: 4, useYn: 'N' },
  { sysId: 'table-3', tableNum: 3, tableName: '단체석 3번', tableQty: 6, useYn: 'Y' },
];

let tableInfoRows = initialTableInfoRows.map((row) => ({ ...row }));
let nextTableInfoSeq = 4;

function resetTableInfoRows() {
  tableInfoRows = initialTableInfoRows.map((row) => ({ ...row }));
  nextTableInfoSeq = 4;
}

function normalizeTableInfoItem(item) {
  return {
    sysId: item.sysId,
    tableNum: Number(item.tableNum),
    tableName: item.tableName,
    tableQty: Number(item.tableQty),
    useYn: item.useYn ?? 'Y',
  };
}

function createTableInfoRow(item) {
  const row = normalizeTableInfoItem(item);
  return {
    ...row,
    sysId: row.sysId || `table-${nextTableInfoSeq++}`,
  };
}

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

  http.post('/api/test/table-info/reset', () => {
    resetTableInfoRows();
    return HttpResponse.json({ success: true });
  }),

  http.get('/api/client/store_manage/table_info/search', () => {
    return HttpResponse.json(tableInfoRows.map((row) => ({ ...row })));
  }),

  http.post('/api/client/store_manage/table_info/save', async ({ request }) => {
    const body = await request.json();
    const newItems = body?.newItems ?? [];
    const updateItems = body?.updateItems ?? [];
    const delItems = body?.delItems ?? [];
    const deletedSysIds = new Set(delItems.map((item) => item.sysId).filter(Boolean));
    const existingRows = new Map(tableInfoRows.map((row) => [row.sysId, row]));

    tableInfoRows = tableInfoRows
      .filter((row) => !deletedSysIds.has(row.sysId))
      .map((row) => {
        const updateItem = updateItems.find((item) => item.sysId === row.sysId);
        return updateItem ? { ...row, ...normalizeTableInfoItem(updateItem) } : row;
      });

    newItems.forEach((item) => {
      const row = createTableInfoRow(item);
      if (!existingRows.has(row.sysId) && !deletedSysIds.has(row.sysId)) {
        tableInfoRows.push(row);
      }
    });

    return HttpResponse.json({ success: true, message: '저장되었습니다.' });
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
