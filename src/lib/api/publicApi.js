import { apiFetch } from './client';

export const publicApi = {
  categories: () => apiFetch('/api/public/categories'),
  category: id => apiFetch('/api/public/categories/' + encodeURIComponent(id)),
  products: () => apiFetch('/api/public/products'),
  product: id => apiFetch('/api/public/products/' + encodeURIComponent(id)),
};
