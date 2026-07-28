const BASE = '/api';

async function apiFetch(path, options = {}) {
  const headers = { ...options.headers };
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(BASE + path, { ...options, headers });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json();
}

function makeEntity(path) {
  return {
    list: (sort, limit) => {
      const p = new URLSearchParams();
      if (sort) p.set('_sort', sort);
      if (limit) p.set('_limit', String(limit));
      const q = p.toString();
      return apiFetch(`${path}${q ? '?' + q : ''}`);
    },
    filter: (where) => {
      const p = new URLSearchParams();
      for (const [k, v] of Object.entries(where)) {
        if (v !== null && typeof v === 'object') {
          if (v.$regex) {
            // Convert MongoDB-style $regex to a prefix/LIKE search
            // e.g. { $regex: '^home\\.' } → key_prefix=home.
            const prefixMatch = v.$regex.match(/^\^([^$.*+?[\]{}|()\\]+)/);
            if (prefixMatch) {
              p.set(k + '_prefix', prefixMatch[1]);
            } else {
              p.set(k + '_like', v.$regex.replace(/^\^/, '').replace(/\$.*/, ''));
            }
          }
        } else {
          p.set(k, String(v));
        }
      }
      return apiFetch(`${path}?${p.toString()}`);
    },
    create: (data) =>
      apiFetch(path, { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) =>
      apiFetch(`${path}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) =>
      apiFetch(`${path}/${id}`, { method: 'DELETE' }),
  };
}

export const base44 = {
  auth: {
    me: () => Promise.reject(new Error('Local mode — no auth')),
    logout: () => {},
    redirectToLogin: () => {},
  },
  entities: {
    PageContent: makeEntity('/page-content'),
    Service: makeEntity('/services'),
    Review: makeEntity('/reviews'),
    SurveyQuestion: makeEntity('/survey-questions'),
    AvailableSlot: makeEntity('/slots'),
    Client: makeEntity('/clients'),
    AdminSettings: makeEntity('/admin-settings'),
    HomeCard: makeEntity('/home-cards'),
    FaqItem: makeEntity('/faq-items'),
    Meeting: makeEntity('/meetings'),
    ProcessStep: makeEntity('/process-steps'),
  },
  functions: {
    createStripeSession: (data) =>
      apiFetch('/stripe/create-session', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
  integrations: {
    Core: {
      UploadFile: async ({ file }) => {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!res.ok) throw new Error('Upload failed');
        return res.json();
      },
    },
  },
};
