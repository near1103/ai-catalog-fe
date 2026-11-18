import { apiFetch } from './client';

const request = (path, method = 'GET', body) =>
  apiFetch('/api/admin' + path, { admin: true, method, body });
const productPath = id => '/products/' + encodeURIComponent(id);

export const adminApi = {
  categories: () => request('/categories'),
  saveCategory: (id, body) => request('/categories/' + encodeURIComponent(id), 'PUT', body),
  deleteCategory: id => request('/categories/' + encodeURIComponent(id), 'DELETE'),
  uploadCategoryImage: (id, file) => {
    const body = new FormData();
    body.append('file', file);
    return request('/categories/' + encodeURIComponent(id) + '/image', 'POST', body);
  },
  products: status => request('/products' + (status ? '?status=' + status : '')),
  product: id => request(productPath(id)),
  createProduct: body => request('/products', 'POST', body),
  updateProduct: (id, body) => request(productPath(id), 'PUT', body),
  action: (id, action, method = 'POST', body) =>
    request(productPath(id) + (action ? '/' + action : ''), method, body),
  upload: (id, file) => {
    const body = new FormData();
    body.append('file', file);
    return request(productPath(id) + '/images', 'POST', body);
  },
};
