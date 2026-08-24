// ISANOMAR store — API client
const API_BASE = window.ISANOMAR_API_URL || '/api';

async function api(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = localStorage.getItem('isanomar_admin_token');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  let data = null;
  try { data = await res.json(); } catch {}
  if (!res.ok) {
    const err = new Error(data?.error || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}
window.isaApi = { api, API_BASE };
