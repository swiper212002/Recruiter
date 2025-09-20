export function saveToken(token) {
  localStorage.setItem('auth_token', token);
}

export function getToken() {
  return localStorage.getItem('auth_token');
}

export function clearToken() {
  localStorage.removeItem('auth_token');
}

export function authFetch(url, options = {}) {
  const token = getToken();
  const headers = options.headers || {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(url, { ...options, headers });
}
