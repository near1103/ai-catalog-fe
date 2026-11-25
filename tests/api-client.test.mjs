import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const moduleUrl = source => 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
const tokenUrl = moduleUrl(await readFile('src/lib/api/auth-token.js', 'utf8'));
const errorUrl = moduleUrl(await readFile('src/lib/api/errors.js', 'utf8'));
const source = (await readFile('src/lib/api/client.js', 'utf8'))
  .replace("'./auth-token'", JSON.stringify(tokenUrl))
  .replace("'./errors'", JSON.stringify(errorUrl));
const { apiFetch } = await import(moduleUrl(source));
const { setTokenProvider } = await import(tokenUrl);
const originalFetch = global.fetch;
afterEach(() => {
  global.fetch = originalFetch;
  setTokenProvider(null);
});
test('public request omits bearer; parses plain array', async () => {
  setTokenProvider(() => 'private');
  global.fetch = async (url, options) => {
    assert.equal(options.headers.has('Authorization'), false);
    assert.equal(url, '/api/public/products');
    return Response.json([{ id: 'p' }]);
  };
  assert.deepEqual(await apiFetch('/api/public/products'), [{ id: 'p' }]);
});
test('admin retries 401 once using refreshed Firebase ID token', async () => {
  const refreshes = [];
  setTokenProvider(refresh => {
    refreshes.push(refresh);
    return refresh ? 'new' : 'old';
  });
  let calls = 0;
  global.fetch = async (_, options) => {
    calls++;
    assert.equal(options.headers.get('Authorization'), 'Bearer ' + (calls === 1 ? 'old' : 'new'));
    return calls === 1 ? new Response('', { status: 401 }) : Response.json({ id: 'p' });
  };
  assert.deepEqual(await apiFetch('/api/admin/products/p', { admin: true }), { id: 'p' });
  assert.equal(calls, 2);
  assert.deepEqual(refreshes, [false, true]);
});
test('403 displays access denial and never refreshes', async () => {
  let calls = 0;
  setTokenProvider(() => 'token');
  global.fetch = async () => {
    calls++;
    return Response.json({ detail: 'Forbidden' }, { status: 403 });
  };
  await assert.rejects(
    apiFetch('/api/admin/products', { admin: true }),
    e => e.status === 403 && e.message.includes('ADMIN'),
  );
  assert.equal(calls, 1);
});
test('ProblemDetail +json preserves backend publication error', async () => {
  global.fetch = async () =>
    new Response(JSON.stringify({ detail: 'Select a leaf category before publication' }), {
      status: 400,
      headers: { 'Content-Type': 'application/problem+json' },
    });
  await assert.rejects(
    apiFetch('/publish'),
    e => e.status === 400 && e.message === 'Select a leaf category before publication',
  );
});
test('multipart body keeps browser generated boundary', async () => {
  setTokenProvider(() => 'token');
  const body = new FormData();
  body.append('file', new Blob(['image']), 'photo.png');
  global.fetch = async (_, options) => {
    assert.equal(options.body, body);
    assert.equal(options.headers.has('Content-Type'), false);
    return new Response(null, { status: 204 });
  };
  assert.equal(await apiFetch('/images', { admin: true, method: 'POST', body }), null);
});
test('network errors and missing resource are readable', async () => {
  global.fetch = async () => {
    throw new TypeError('Failed to fetch');
  };
  await assert.rejects(apiFetch('/api/public/products'), /CORS/);
  global.fetch = async () => new Response('', { status: 404 });
  await assert.rejects(apiFetch('/missing'), e => e.status === 404 && e.message === 'Not found.');
});
test('second 401 stops retrying', async () => {
  let calls = 0;
  setTokenProvider(() => 'token');
  global.fetch = async () => {
    calls++;
    return new Response('', { status: 401 });
  };
  await assert.rejects(apiFetch('/api/admin/products', { admin: true }), e => e.status === 401);
  assert.equal(calls, 2);
});

test('category API preserves imageUrl for both levels and sends null to remove it', async () => {
  const clientUrl = moduleUrl(source);
  const adminSource = (await readFile('src/lib/api/adminApi.js', 'utf8')).replace(
    "'./client'",
    JSON.stringify(clientUrl),
  );
  const { adminApi } = await import(moduleUrl(adminSource));
  setTokenProvider(() => 'token');
  const categories = [1, 2].map(level => ({
    id: 'level-' + level,
    name: 'Category',
    level,
    parentId: level === 1 ? null : 'level-1',
    imageUrl: 'https://example.com/category-' + level + '.png',
  }));
  global.fetch = async (url, options) => {
    if (options.method === 'GET') return Response.json(categories);
    const body = JSON.parse(options.body);
    assert.equal(options.method, 'PUT');
    assert.equal(url.endsWith('/api/admin/categories/' + body.id), true);
    return Response.json(body);
  };
  assert.deepEqual(await adminApi.categories(), categories);
  for (const category of categories) {
    assert.deepEqual(await adminApi.saveCategory(category.id, category), category);
    const cleared = { ...category, imageUrl: null };
    assert.deepEqual(await adminApi.saveCategory(category.id, cleared), cleared);
  }
});

test('category image upload uses authenticated multipart and returns the saved category', async () => {
  const adminSource = (await readFile('src/lib/api/adminApi.js', 'utf8')).replace(
    "'./client'",
    JSON.stringify(moduleUrl(source)),
  );
  const { adminApi } = await import(moduleUrl(adminSource));
  setTokenProvider(() => 'token');
  const file = new File([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])], 'category.png', {
    type: 'image/png',
  });
  const category = {
    id: 'home',
    name: 'Home',
    level: 1,
    parentId: null,
    imageUrl: 'https://example.com/uploaded.png',
  };
  global.fetch = async (url, options) => {
    assert.ok(url.endsWith('/api/admin/categories/home/image'));
    assert.equal(options.method, 'POST');
    assert.equal(options.headers.get('Authorization'), 'Bearer token');
    assert.equal(options.headers.has('Content-Type'), false);
    assert.ok(options.body instanceof FormData);
    assert.equal(options.body.get('file').name, 'category.png');
    assert.equal(options.body.get('file').type, 'image/png');
    assert.equal(options.body.get('file').size, 8);
    return Response.json(category);
  };
  assert.deepEqual(await adminApi.uploadCategoryImage('home', file), category);
});
