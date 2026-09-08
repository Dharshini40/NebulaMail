const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const config = {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options
  };

  const res = await fetch(url, config);

  if (res.status === 401 && !url.includes('/auth/me') && !url.includes('/auth/logout')) {
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error = new Error(data.error || 'Request failed');
    error.status = res.status;
    throw error;
  }

  return data;
}

export const api = {
  auth: {
    google: () => `${API_BASE}/auth/google`,
    me: () => request('/auth/me'),
    logout: () => request('/auth/logout', { method: 'POST' })
  },
  mail: {
    inbox: (params = {}) =>
      request(`/mail/inbox?${new URLSearchParams(params).toString()}`),
    sent: (params = {}) =>
      request(`/mail/sent?${new URLSearchParams(params).toString()}`),
    get: (id) => request(`/mail/${id}`),
    send: (payload) => request('/mail/send', { method: 'POST', body: JSON.stringify(payload) }),
    reply: (payload) => request('/mail/reply', { method: 'POST', body: JSON.stringify(payload) }),
    search: (payload) => request('/mail/search', { method: 'POST', body: JSON.stringify(payload) })
  },
  ai: {
    chat: (payload) => request('/ai/chat', { method: 'POST', body: JSON.stringify(payload) })
  }
};