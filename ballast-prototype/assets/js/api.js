/**
 * Ballast API Client
 * Seamless connection between prototype UI and the NestJS backend.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.BallastAPI = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  const API_BASE = '/api';

  async function request(endpoint, options = {}) {
    const isFormData = options.body instanceof FormData;
    const headers = {
      Accept: 'application/json',
      ...(options.headers || {}),
    };

    if (!isFormData && options.body && typeof options.body === 'object') {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include',
      });

      const contentType = response.headers.get('content-type') || '';
      let data = null;

      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch {
          data = { raw: text };
        }
      }

      if (!response.ok) {
        let msg = 'Request failed';
        if (data) {
          if (Array.isArray(data.message)) {
            msg = data.message[0];
          } else if (typeof data.message === 'string') {
            msg = data.message;
          } else if (data.error) {
            msg = data.error;
          }
        }
        const err = new Error(msg);
        err.status = response.status;
        err.data = data;
        throw err;
      }

      return data;
    } catch (err) {
      if (!err.status) {
        console.warn(`[Ballast API] Network error on ${endpoint}:`, err.message);
      }
      throw err;
    }
  }

  const API = {
    // Health check
    async isHealthy() {
      try {
        const res = await request('/health');
        return res.status === 'ok';
      } catch {
        return false;
      }
    },

    // Authentication
    auth: {
      async signIn(email, password) {
        return request('/auth/sign-in', {
          method: 'POST',
          body: { email, password },
        });
      },
      async signUp(data) {
        return request('/auth/sign-up', {
          method: 'POST',
          body: data,
        });
      },
      async signOut() {
        return request('/auth/sign-out', {
          method: 'POST',
        });
      },
      async me() {
        return request('/auth/me');
      },
      async forgotPassword(email) {
        return request('/auth/forgot-password', {
          method: 'POST',
          body: { email },
        });
      },
      async resetPassword(token, password) {
        return request('/auth/reset-password', {
          method: 'POST',
          body: { token, password },
        });
      },
    },

    // Obligations
    obligations: {
      async list() {
        return request('/obligations');
      },
      async get(id) {
        return request(`/obligations/${id}`);
      },
      async updateStatus(id, status) {
        return request(`/obligations/${id}/status`, {
          method: 'PATCH',
          body: { status },
        });
      },
      async generate() {
        return request('/obligations/generate', {
          method: 'POST',
        });
      },
      async confirmAll() {
        return request('/obligations/confirm-all', {
          method: 'POST',
        });
      },
      async confirm(id) {
        return request(`/obligations/${id}/confirm`, {
          method: 'POST',
        });
      },
      async flag(id, reason) {
        return request(`/obligations/${id}/flag`, {
          method: 'POST',
          body: { reason },
        });
      },
    },

    // Logbook
    logbook: {
      async list() {
        return request('/logbook');
      },
      async create(dto, file) {
        if (file) {
          const form = new FormData();
          Object.entries(dto).forEach(([k, v]) => {
            if (v !== undefined && v !== null) form.append(k, v);
          });
          form.append('file', file);
          return request('/logbook', {
            method: 'POST',
            body: form,
          });
        }
        return request('/logbook', {
          method: 'POST',
          body: dto,
        });
      },
    },

    // Evidence
    evidence: {
      async list() {
        return request('/evidence');
      },
      async create(dto, file) {
        const form = new FormData();
        Object.entries(dto).forEach(([k, v]) => {
          if (v !== undefined && v !== null) form.append(k, v);
        });
        if (file) {
          form.append('file', file);
        }
        return request('/evidence', {
          method: 'POST',
          body: form,
        });
      },
      fileUrl(id) {
        return `${API_BASE}/evidence/${id}/file`;
      },
    },

    // Reports
    reports: {
      async library() {
        return request('/reports');
      },
      async listGenerated() {
        return request('/reports/generated');
      },
      async getGenerated(id) {
        return request(`/reports/generated/${id}`);
      },
      async generate(templateId) {
        return request(`/reports/${templateId}/generate`, {
          method: 'POST',
        });
      },
      pdfUrl(id) {
        return `${API_BASE}/reports/generated/${id}/pdf`;
      },
    },

    // Onboarding
    onboarding: {
      async submitProfile(dto) {
        return request('/onboarding/profile', {
          method: 'POST',
          body: dto,
        });
      },
      async submitActivities(activities) {
        return request('/onboarding/activities', {
          method: 'POST',
          body: { activities },
        });
      },
      async generate() {
        return request('/onboarding/generate', {
          method: 'POST',
        });
      },
      async finish() {
        return request('/onboarding/finish', {
          method: 'POST',
        });
      },
    },

    // Organisation & Team
    organisations: {
      async me() {
        return request('/organisations/me');
      },
      async updateProfile(dto) {
        return request('/organisations/profile', {
          method: 'PATCH',
          body: dto,
        });
      },
      async listSites() {
        return request('/organisations/sites');
      },
      async createSite(dto) {
        return request('/organisations/sites', {
          method: 'POST',
          body: dto,
        });
      },
    },

    team: {
      async list() {
        return request('/team');
      },
      async invite(dto) {
        return request('/team/invite', {
          method: 'POST',
          body: dto,
        });
      },
    },

    // Public / Shares
    shares: {
      async getPublicDossier(token) {
        return request(`/shares/public/${token}`);
      },
      async create(dto) {
        return request('/shares', {
          method: 'POST',
          body: dto,
        });
      },
    },
  };

  return API;
});
