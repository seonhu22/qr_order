export async function login(userId, userPassword) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ userId, userPassword }),
  });
  return res.json();
}

export async function logout() {
  await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
  });
}

export async function getMe() {
  const res = await fetch('/api/auth/me', {
    credentials: 'include',
  });
  if (!res.ok) return { success: false };
  return res.json();
}
