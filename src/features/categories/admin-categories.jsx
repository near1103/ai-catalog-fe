'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Search, Trash2, X } from 'lucide-react';
import { z } from 'zod';
import { adminApi } from '@/lib/api/adminApi';
import { QueryState, ErrorMessage, Field } from '@/components/ui/shared';
import { CategoryImage } from '@/components/catalog/category-image';
import { ImageUpload } from '@/components/ui/image-upload';
import { ConfirmButton } from '@/components/ui/confirm-button';
import { categoryPath } from '@/utils/categories';

const schema = z.object({
  id: z
    .string()
    .regex(/^[A-Za-z0-9_-]{1,100}$/, 'Use Latin letters, numbers, _ or -; up to 100 characters'),
  name: z.string().trim().min(1, 'Enter a name').max(200),
  parentId: z.string(),
  imageUrl: z.union([z.literal(''), z.url('Enter a valid URL')]),
});
const empty = { id: '', name: '', parentId: '', imageUrl: '' };

export default function AdminCategories() {
  const cache = useQueryClient();
  const categoriesQuery = useQuery({
    queryKey: ['admin-categories'],
    queryFn: adminApi.categories,
  });
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [filePreview, setFilePreview] = useState('');
  const [level, setLevel] = useState(1);
  const [department, setDepartment] = useState('');
  const [customId, setCustomId] = useState(false);
  const formPanel = useRef(null);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), defaultValues: empty });
  const imageUrl = watch('imageUrl');
  const name = watch('name');
  const parentId = watch('parentId');

  useEffect(() => {
    if (editing || customId) {
      return;
    }
    const base = name
      .trim()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 90);
    let id = base;
    let suffix = 2;
    while (id && categoriesQuery.data?.some(category => category.id === id)) {
      id = base + '-' + suffix++;
    }
    setValue('id', id);
  }, [name, editing, customId, categoriesQuery.data, setValue]);

  useEffect(() => {
    if (!imageFile) {
      setFilePreview('');
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setFilePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);
  const invalidate = () =>
    Promise.all([
      cache.invalidateQueries({ queryKey: ['admin-categories'] }),
      cache.invalidateQueries({ queryKey: ['categories'] }),
      cache.invalidateQueries({ queryKey: ['category'] }),
    ]);
  const save = useMutation({
    mutationFn: async values => {
      const parent = categoriesQuery.data.find(category => category.id === values.parentId);
      if (!editing && level > 1 && (!parent || parent.level !== level - 1)) {
        throw new Error('Choose a parent category for the selected level.');
      }
      const categoryLevel = editing?.level || (parent ? parent.level + 1 : 1);
      if (!editing && categoriesQuery.data.some(category => category.id === values.id)) {
        throw new Error('This ID already exists. Choose a different one.');
      }
      const category = await adminApi.saveCategory(values.id, {
        name: values.name,
        parentId: values.parentId || null,
        level: categoryLevel,
        imageUrl: values.imageUrl || null,
      });
      if (!imageFile) {
        return category;
      }
      // Keep the created category editable if the file upload needs a retry.
      setEditing(category);
      return adminApi.uploadCategoryImage(category.id, imageFile);
    },
    onSuccess: (_, values) => {
      reset({ ...empty, parentId: values.parentId });
      setImageFile(null);
      setEditing(null);
      setCustomId(false);
      setNotice('Category saved. You can add another category here.');
    },
    onSettled: invalidate,
  });
  const remove = useMutation({
    mutationFn: adminApi.deleteCategory,
    onSuccess: async (_, id) => {
      await invalidate();
      if (editing?.id === id) {
        setEditing(null);
        setImageFile(null);
        setCustomId(false);
        setLevel(1);
        setDepartment('');
        reset(empty);
      }
      setNotice('Category deleted.');
    },
  });
  const busy = save.isPending || remove.isPending;
  const categories = categoriesQuery.data || [];
  const paths = new Map(
    categories.map(category => [category.id, categoryPath(categories, category.id)]),
  );
  const sorted = [...categories].sort((a, b) =>
    paths
      .get(a.id)
      .map(category => category.name)
      .join('/')
      .localeCompare(
        paths
          .get(b.id)
          .map(category => category.name)
          .join('/'),
        'en',
      ),
  );
  const term = search.trim().toLocaleLowerCase('en');
  const matching = sorted.filter(category =>
    (
      category.id +
      ' ' +
      paths
        .get(category.id)
        .map(candidateCategory => candidateCategory.name)
        .join(' / ')
    )
      .toLocaleLowerCase('en')
      .includes(term),
  );
  const matchingIds = new Set(matching.map(category => category.id));
  const visibleIds = new Set(
    matching.flatMap(category =>
      paths.get(category.id).map(candidateCategory => candidateCategory.id),
    ),
  );
  const visible = term ? sorted.filter(category => visibleIds.has(category.id)) : sorted;
  const edit = category => {
    setImageFile(null);
    setEditing(category);
    setNotice('');
    save.reset();
    reset({
      id: category.id,
      name: category.name,
      parentId: category.parentId || '',
      imageUrl: category.imageUrl || '',
    });
    setLevel(category.level);
    setDepartment(
      categoryPath(categories, category.id).find(candidateCategory => candidateCategory.level === 1)
        ?.id || '',
    );
    formPanel.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const create = (parent = null) => {
    setEditing(null);
    setImageFile(null);
    setNotice('');
    setCustomId(false);
    save.reset();
    setLevel(parent ? parent.level + 1 : 1);
    setDepartment(
      parent
        ? categoryPath(categories, parent.id).find(category => category.level === 1)?.id || ''
        : '',
    );
    reset({ ...empty, parentId: parent?.id || '' });
    formPanel.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    requestAnimationFrame(() =>
      formPanel.current?.querySelector('input[name="name"]')?.focus({ preventScroll: true }),
    );
  };

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Catalog structure</p>
          <h1>Categories</h1>
          <p className="muted">Organize departments, groups, and product categories.</p>
        </div>
        <button disabled={busy} onClick={() => create()}>
          <Plus size={17} /> Add category
        </button>
      </div>
      <QueryState query={categoriesQuery} />
      <ErrorMessage error={remove.error} />
      {notice && (
        <p role="status" className="success">
          {notice}
        </p>
      )}
      {categoriesQuery.isSuccess && (
        <div className="admin-two-col">
          <section className="panel">
            <div className="category-list-heading">
              <h2>Category tree</h2>
              <span>
                {term ? visible.length + ' of ' + categories.length : categories.length} categories
              </span>
            </div>
            <div className="category-search" role="search">
              <Search size={17} aria-hidden="true" />
              <input
                type="search"
                aria-label="Search categories"
                placeholder="Search by name, ID, or category path…"
                value={search}
                onChange={event => setSearch(event.target.value)}
              />
              {search && (
                <button
                  type="button"
                  aria-label="Clear category search"
                  onClick={() => setSearch('')}
                >
                  <X size={16} />
                </button>
              )}
            </div>
            {!categories.length ? (
              <p className="empty">No categories yet.</p>
            ) : !visible.length ? (
              <div className="empty">
                <Search size={28} />
                <h3>No categories found</h3>
                <p>Try a different name or ID.</p>
                <button className="secondary" type="button" onClick={() => setSearch('')}>
                  Clear search
                </button>
              </div>
            ) : (
              visible.map(category => (
                <div
                  className={
                    'category-row' +
                    (term && !matchingIds.has(category.id) ? ' is-context' : '') +
                    (editing?.id === category.id ? ' is-selected' : '')
                  }
                  key={category.id}
                  style={{ paddingLeft: 12 + (category.level - 1) * 18 }}
                >
                  <div className="category-row-info">
                    <CategoryImage src={category.imageUrl} compact />
                    <div>
                      <strong>{category.name}</strong>
                      <small>
                        {category.id} · level {category.level}
                      </small>
                    </div>
                  </div>
                  <div className="actions">
                    {category.level < 3 && (
                      <button
                        type="button"
                        className="ghost category-add-child"
                        disabled={busy}
                        aria-label={'Add subcategory to ' + category.name}
                        title="Add subcategory"
                        onClick={() => create(category)}
                      >
                        <Plus size={16} />
                        <span>Add</span>
                      </button>
                    )}
                    <button className="ghost" disabled={busy} onClick={() => edit(category)}>
                      Edit
                    </button>
                    <ConfirmButton
                      className="danger ghost"
                      disabled={busy}
                      title="Delete category?"
                      description={
                        '“' +
                        category.name +
                        '” will be permanently deleted. This action cannot be undone.'
                      }
                      confirmLabel="Delete category"
                      onConfirm={() => remove.mutateAsync(category.id)}
                    >
                      Delete
                    </ConfirmButton>
                  </div>
                </div>
              ))
            )}
          </section>
          <section className="panel category-editor-panel" ref={formPanel}>
            <h2>{editing ? 'Edit category' : 'New category'}</h2>
            <p className="muted">
              {editing
                ? 'Update the name or image. The category location stays the same.'
                : 'Choose where the category belongs, then add its name and an optional image.'}
            </p>
            <ErrorMessage error={save.error} />
            <form
              onSubmit={handleSubmit(values => {
                setNotice('');
                save.mutate(values);
              })}
            >
              {editing ? (
                <div className="category-location">
                  <small>Category location</small>
                  <p>
                    {paths
                      .get(editing.id)
                      ?.map(category => category.name)
                      .join(' / ')}
                  </p>
                </div>
              ) : (
                <>
                  <Field label="Category level">
                    <select
                      value={level}
                      disabled={busy}
                      onChange={event => {
                        setLevel(Number(event.target.value));
                        setDepartment('');
                        setValue('parentId', '');
                      }}
                    >
                      <option value={1}>1. Department</option>
                      <option value={2}>2. Group</option>
                      <option value={3}>3. Product category</option>
                    </select>
                  </Field>
                  {level > 1 && (
                    <Field label="Department">
                      <select
                        value={department}
                        disabled={busy}
                        required
                        onChange={event => {
                          setDepartment(event.target.value);
                          setValue('parentId', level === 2 ? event.target.value : '');
                        }}
                      >
                        <option value="">Choose a department</option>
                        {categories
                          .filter(category => category.level === 1)
                          .map(category => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                      </select>
                    </Field>
                  )}
                  {level === 3 && (
                    <Field label="Group">
                      <select
                        value={parentId}
                        disabled={busy || !department}
                        required
                        onChange={event => setValue('parentId', event.target.value)}
                      >
                        <option value="">
                          {department ? 'Choose a group' : 'Choose a department first'}
                        </option>
                        {categories
                          .filter(
                            category => category.level === 2 && category.parentId === department,
                          )
                          .map(category => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                      </select>
                    </Field>
                  )}
                  {level > 1 &&
                    !(level === 2
                      ? categories.some(category => category.level === 1)
                      : categories.some(
                          category => category.level === 2 && category.parentId === department,
                        )) && (
                      <p className="category-selection-help">
                        {level === 2
                          ? 'Create a department first.'
                          : 'Choose a department with a group, or add a group first.'}
                      </p>
                    )}
                </>
              )}
              <input type="hidden" {...register('parentId')} />
              <Field label="Category name" error={errors.name}>
                <input
                  disabled={busy}
                  placeholder={
                    level === 1
                      ? 'e.g. Home & Garden'
                      : level === 2
                        ? 'e.g. Furniture'
                        : 'e.g. Chairs'
                  }
                  {...register('name')}
                />
              </Field>
              <details className="category-id-settings" open={errors.id ? true : undefined}>
                <summary>Category ID{editing ? '' : ' (generated automatically)'}</summary>
                <Field label="ID" error={errors.id}>
                  <input
                    readOnly={!!editing}
                    disabled={busy}
                    {...register('id', { onChange: () => setCustomId(true) })}
                  />
                </Field>
                <p className="muted">
                  {editing
                    ? 'The category ID cannot be changed.'
                    : 'You can use your own unique ID. Use Latin letters, numbers, hyphens, or underscores.'}
                </p>
              </details>
              <input type="hidden" {...register('imageUrl')} />
              <div className="category-image-field">
                <h3>Category image</h3>
                <ImageUpload
                  key={editing?.id || 'new'}
                  busy={busy}
                  buttonLabel={imageFile || imageUrl ? 'Replace image' : 'Choose image'}
                  onSelect={file => {
                    setImageFile(file);
                    save.reset();
                    setNotice('');
                  }}
                />
                {(filePreview || imageUrl) && (
                  <div className="category-image-preview">
                    <CategoryImage src={filePreview || imageUrl} />
                    <div>
                      <strong>{imageFile ? imageFile.name : 'Current image'}</strong>
                      <p>
                        {imageFile
                          ? 'The image will be uploaded when you save.'
                          : 'Saved category image'}
                      </p>
                      <button
                        type="button"
                        className="ghost danger"
                        disabled={busy}
                        onClick={() => {
                          setImageFile(null);
                          setValue('imageUrl', '', { shouldDirty: true });
                        }}
                      >
                        <Trash2 size={14} /> Remove image
                      </button>
                    </div>
                  </div>
                )}
                <ErrorMessage error={errors.imageUrl} />
              </div>
              <div className="actions">
                <button disabled={busy || (!editing && level > 1 && !parentId)}>
                  {save.isPending ? 'Saving…' : editing ? 'Save changes' : 'Create category'}
                </button>
                <button
                  type="button"
                  className="secondary"
                  disabled={busy}
                  onClick={() => create()}
                >
                  {editing ? 'Cancel editing' : 'Reset'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
