import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile('src/utils/categories.js', 'utf8');
const { categorySelection, isCategorySelectionValid } = await import(
  'data:text/javascript;base64,' + Buffer.from(source).toString('base64')
);
const categories = [
  { id: 'home', level: 1, parentId: null },
  { id: 'electronics', level: 1, parentId: null },
  { id: 'furniture', level: 2, parentId: 'home' },
  { id: 'lighting', level: 2, parentId: 'home' },
  { id: 'audio', level: 2, parentId: 'electronics' },
  { id: 'chairs', level: 3, parentId: 'furniture' },
  { id: 'lamps', level: 3, parentId: 'lighting' },
];
const empty = { rootId: '', groupId: '', leafId: '' };

test('existing leaf resolves into all three dependent selections', () => {
  assert.deepEqual(categorySelection(categories, 'chairs'), {
    rootId: 'home',
    groupId: 'furniture',
    leafId: 'chairs',
  });
  assert.deepEqual(categorySelection(categories, 'lamps'), {
    rootId: 'home',
    groupId: 'lighting',
    leafId: 'lamps',
  });
});
test('only complete matching paths can be assigned', () => {
  assert.equal(
    isCategorySelectionValid(categories, {
      rootId: 'home',
      groupId: 'furniture',
      leafId: 'chairs',
    }),
    true,
  );
  assert.equal(
    isCategorySelectionValid(categories, {
      rootId: 'electronics',
      groupId: 'furniture',
      leafId: 'chairs',
    }),
    false,
  );
  assert.equal(
    isCategorySelectionValid(categories, { rootId: 'home', groupId: 'lighting', leafId: 'chairs' }),
    false,
  );
  assert.equal(
    isCategorySelectionValid(categories, { rootId: 'home', groupId: 'furniture', leafId: '' }),
    false,
  );
});
test('missing categories and non-leaf IDs produce empty selections', () => {
  for (const id of [null, undefined, 'missing', 'home', 'furniture'])
    assert.deepEqual(categorySelection(categories, id), empty);
});
test('orphaned or incorrectly levelled paths cannot be assigned', () => {
  assert.deepEqual(
    categorySelection(
      categories.filter(c => c.id !== 'home'),
      'chairs',
    ),
    empty,
  );
  assert.deepEqual(
    categorySelection(
      categories.filter(c => c.id !== 'furniture'),
      'chairs',
    ),
    empty,
  );
  assert.deepEqual(
    categorySelection(
      categories.map(c => (c.id === 'furniture' ? { ...c, level: 1 } : c)),
      'chairs',
    ),
    empty,
  );
});
