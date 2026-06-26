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

async function postJson(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

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

  test('supports signup email send and verification on current auth API path', async () => {
    const send = await postJson('/api/auth/email_valid/new_user/send', {
      email: 'client@example.com',
    });

    expect(send).toMatchObject({ success: true });

    const response = await fetch(
      '/api/auth/signup/new/chkEmailValid?email=client%40example.com&validCode=ABC123',
    );

    await expect(response.json()).resolves.toBe(true);
  });

  test('supports password reset email verification before password change', async () => {
    const send = await postJson('/api/auth/email_valid/pwd_change/send', {
      userId: 'PC002',
      email: 'client@example.com',
    });

    expect(send).toMatchObject({ success: true });

    const verify = await postJson('/api/auth/email_valid/pwd_change', {
      email: 'client@example.com',
      validCode: 'ABC123',
    });

    expect(verify).toMatchObject({ success: true });

    const change = await postJson('/api/auth/pwd_change', {
      userId: 'PC002',
      pwd: 'password1!',
      pwdConfirm: 'password1!',
    });

    expect(change).toMatchObject({ success: true });
  });
});
