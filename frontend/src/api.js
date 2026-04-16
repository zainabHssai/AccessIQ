/**
 * Toutes les appels API centralisés ici.
 * Le proxy dans package.json redirige /api → http://localhost:5000
 */
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// Injecte automatiquement le JWT dans chaque requête
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// Si 401 → déconnexion automatique
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  login:          (email, password)              => api.post('/auth/login',           { email, password }),
  register:       (data)                         => api.post('/auth/register',         data),
  logout:         ()                             => api.post('/auth/logout'),
  me:             ()                             => api.get('/auth/me'),
  changePassword: (old_p, new_p, confirm_p)      => api.post('/auth/change-password', { old_password: old_p, new_password: new_p, confirm_password: confirm_p }),
  pending:        ()                             => api.get('/auth/pending'),
  approve:        (user_id, action)              => api.post('/auth/approve',          { user_id, action }),
  allUsers:       ()                             => api.get('/auth/users'),
  forceReset:     (user_id)                      => api.post('/auth/force-reset',      { user_id }),
};

export default api;

export const campaignAPI = {
  list:         ()                          => api.get('/campaigns'),
  create:       (formData)                  => api.post('/campaigns', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  get:          (id)                        => api.get(`/campaigns/${id}`),
  dashboard:    (id)                        => api.get(`/campaigns/${id}/dashboard`),
  accounts:     (id)                        => api.get(`/campaigns/${id}/accounts`),
  myAssigned:   ()                          => api.get('/campaigns/assigned'),
  myAccounts:   (id)                        => api.get(`/campaigns/${id}/accounts/mine`),
  saveDecision: (campId, accId, decision, motif) => api.post(`/campaigns/${campId}/accounts/${accId}/decision`, { decision, motif }),

  // ── Motifs par campagne ──
  getMotifs:    (campId)          => api.get(`/campaigns/${campId}/motifs`),
  addMotif:     (campId, label)   => api.post(`/campaigns/${campId}/motifs`, { label }),
  updateMotif:  (campId, id, label) => api.put(`/campaigns/${campId}/motifs/${id}`, { label }),
  deleteMotif:  (campId, id)      => api.delete(`/campaigns/${campId}/motifs/${id}`),

  export: async (id) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/campaigns/${id}/export`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Export failed');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const disposition = res.headers.get('Content-Disposition') || '';
    const match = disposition.match(/filename="?([^"]+)"?/);
    a.download = match ? match[1] : `rapport_campagne_${id}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};

export const mailAPI = {
  notifyManager: (campaign_id, manager_email, manager_nom) =>
    api.post('/mail/notify-manager', { campaign_id, manager_email, manager_nom }),
  notifyAll: (campaign_id) =>
    api.post('/mail/notify-all', { campaign_id }),
};

export const profileAPI = {
  update:       (data)    => api.put('/auth/profile', data),
  updateEmail:  (email_ad)=> api.put('/auth/profile', { email_ad }),
};

