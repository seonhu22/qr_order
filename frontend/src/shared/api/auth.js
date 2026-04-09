async function parseJsonResponse(response) {
  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export async function login(userId, userPassword) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ userId, userPassword }),
  });

  return parseJsonResponse(response);
}

export async function logout() {
  const response = await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
  });

  return parseJsonResponse(response);
}

export async function getMe() {
  const response = await fetch('/api/auth/me', {
    credentials: 'include',
  });

  if (!response.ok) {
    return { success: false };
  }

  return parseJsonResponse(response);
}
