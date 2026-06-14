import { describe, expect, test } from 'vitest';

async function postLogin(userId, userPassword) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, userPassword }),
  });

  return response.json();
}

async function getMe() {
  const response = await fetch('/api/auth/me');

  return response.json();
}

describe('mock auth handlers', () => {
  test('allows a/1 as a normal login account without initial password change', async () => {
    const login = await postLogin('a', '1');

    expect(login).toMatchObject({
      success: true,
      data: {
        userId: 'a',
        initPwdRequired: false,
      },
    });

    const me = await getMe();

    expect(me).toMatchObject({
      success: true,
      data: {
        userId: 'a',
        initPwdRequired: false,
      },
    });
  });

  test('allows b/1 as an initial password change test account', async () => {
    const login = await postLogin('b', '1');

    expect(login).toMatchObject({
      success: true,
      data: {
        userId: 'b',
        initPwdRequired: true,
      },
    });

    const me = await getMe();

    expect(me).toMatchObject({
      success: true,
      data: {
        userId: 'b',
        initPwdRequired: true,
      },
    });
  });
});
