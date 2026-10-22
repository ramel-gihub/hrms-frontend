const rawUrl = import.meta.env.VITE_API_URL || '';
export const API_BASE = (rawUrl && !rawUrl.includes('f2ef'))
  ? rawUrl
  : 'https://hrms-backend-5xo8.onrender.com';
export const API_URL = API_BASE;

