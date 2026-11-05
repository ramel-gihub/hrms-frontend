const rawUrl = import.meta.env.VITE_API_URL || '';
export const API_BASE = rawUrl || 'https://hrms-backend-f2ef.onrender.com';
export const API_URL = API_BASE;

export const formatAvatarUrl = (url, apiBase = API_BASE) => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (/^(https?:\/\/|data:|blob:)/i.test(trimmed)) {
    return trimmed;
  }
  return `${apiBase}/${trimmed.replace(/^\/+/, '')}`;
};
