const rawUrl = import.meta.env.VITE_API_URL || '';
export const API_BASE = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? (rawUrl || 'http://localhost:5002') : (rawUrl || 'https://hrms-backend-fzef.onrender.com'));
export const API_URL = API_BASE;

export const formatAvatarUrl = (url, apiBase = API_BASE) => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (/^(https?:\/\/|data:|blob:)/i.test(trimmed)) {
    return trimmed;
  }
  return `${apiBase}/${trimmed.replace(/^\/+/, '')}`;
};
