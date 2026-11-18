export function categoryPath(categories, id) {
  const path = [];
  const seen = new Set();
  while (id && !seen.has(id)) {
    seen.add(id);
    const category = categories.find(candidateCategory => candidateCategory.id === id);
    if (!category) {
      break;
    }
    path.unshift(category);
    id = category.parentId;
  }
  return path;
}

export function inCategory(categories, productCategory, selected) {
  return categoryPath(categories, productCategory).some(category => category.id === selected);
}

export function categorySelection(categories, leafId) {
  const leaf = categories.find(category => category.id === leafId && category.level === 3);
  const group =
    leaf && categories.find(category => category.id === leaf.parentId && category.level === 2);
  const root =
    group && categories.find(category => category.id === group.parentId && category.level === 1);
  return root
    ? { rootId: root.id, groupId: group.id, leafId: leaf.id }
    : { rootId: '', groupId: '', leafId: '' };
}

export function isCategorySelectionValid(categories, selection) {
  const path = categorySelection(categories, selection.leafId);
  return !!path.leafId && path.rootId === selection.rootId && path.groupId === selection.groupId;
}
