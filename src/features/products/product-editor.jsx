'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useMutationState, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/adminApi';
import { ProductForm } from './product-form';
import { QueryState, ErrorMessage, Status } from '@/components/ui/shared';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { ImageUpload } from '@/components/ui/image-upload';
import { ConfirmButton } from '@/components/ui/confirm-button';
import { CategoryActions } from './category-actions';

const draftSuggestionKey = ['draft-category-suggestion'];

function ProductImages({ product, refresh }) {
  const upload = useMutation({
    mutationFn: file => adminApi.upload(product.id, file),
    onSettled: refresh,
  });
  const change = useMutation({
    mutationFn: ({ index, primary }) =>
      adminApi.action(
        product.id,
        'images/' + index + (primary ? '/primary' : ''),
        primary ? 'PUT' : 'DELETE',
      ),
    onSettled: refresh,
  });
  const busy = upload.isPending || change.isPending;

  return (
    <section className="panel">
      <h2>Images</h2>
      <p className="muted">Upload product photos and choose the primary image.</p>
      <ImageUpload busy={busy} onSelect={file => upload.mutate(file)} />
      <ErrorMessage error={upload.error || change.error} />
      <div className="admin-gallery">
        {product.images?.map((image, index) => (
          <div key={image.url + index}>
            <img src={image.url} alt={product.name + ' — ' + (index + 1)} />
            <div className="actions">
              <button
                className="secondary"
                disabled={busy || image.isPrimary}
                onClick={() => change.mutate({ index, primary: true })}
              >
                {image.isPrimary ? '★ Primary' : 'Set as primary'}
              </button>
              <ConfirmButton
                className="ghost danger"
                disabled={busy}
                title="Delete image?"
                description="This image will be permanently removed from the product."
                confirmLabel="Delete image"
                onConfirm={() => change.mutateAsync({ index })}
              >
                Delete
              </ConfirmButton>
            </div>
          </div>
        ))}
      </div>
      {product.status === 'ACTIVE' && (
        <p className="muted">
          Check the product status after removing an image. The server may change it to INACTIVE.
        </p>
      )}
    </section>
  );
}

export default function ProductEditor({ id }) {
  const router = useRouter();
  const cache = useQueryClient();
  const [notice, setNotice] = useState('');
  const productQuery = useQuery({
    queryKey: ['admin-product', id],
    queryFn: () => adminApi.product(id),
    enabled: !!id,
  });
  const categories = useQuery({ queryKey: ['admin-categories'], queryFn: adminApi.categories });
  const draftSuggestion = useMutation({
    mutationKey: draftSuggestionKey,
    mutationFn: productId => adminApi.action(productId, 'ai-suggestion'),
    retry: false,
    onSuccess: (_, productId) =>
      cache.invalidateQueries({ queryKey: ['admin-product', productId] }),
  });
  const initialSuggestion = useMutationState({
    filters: {
      mutationKey: draftSuggestionKey,
      predicate: mutation => !!id && mutation.state.variables === id,
    },
    select: mutation => mutation.state,
  }).at(-1);
  const refresh = () =>
    Promise.all([
      ...(id ? [cache.invalidateQueries({ queryKey: ['admin-product', id] })] : []),
      cache.invalidateQueries({ queryKey: ['admin-products'] }),
      cache.invalidateQueries({ queryKey: ['public-products'] }),
      ...(id ? [cache.invalidateQueries({ queryKey: ['public-product', id] })] : []),
    ]);
  const save = useMutation({
    mutationFn: body => (id ? adminApi.updateProduct(id, body) : adminApi.createProduct(body)),
    onSuccess: async savedProduct => {
      setNotice('Product saved.');
      if (!id) {
        cache.setQueryData(['admin-product', savedProduct.id], savedProduct);
        draftSuggestion.mutate(savedProduct.id);
        router.replace('/admin/products/' + encodeURIComponent(savedProduct.id));
      }
      await refresh();
    },
  });
  const action = useMutation({
    mutationFn: kind =>
      adminApi.action(id, kind === 'delete' ? '' : kind, kind === 'delete' ? 'DELETE' : 'POST'),
    onSettled: refresh,
    onSuccess: (_, kind) => {
      if (kind === 'delete') {
        router.replace('/admin/products');
      } else setNotice('Status updated.');
    },
  });
  const product = productQuery.data;

  return (
    <>
      <Breadcrumbs
        homeHref="/admin"
        homeLabel="Admin dashboard"
        items={[
          { label: 'Products', href: '/admin/products' },
          { label: id ? product?.name || 'Product' : 'New product' },
        ]}
      />
      <div className="page-heading">
        <div>
          <p className="eyebrow">Product editor</p>
          <h1>{id ? product?.name || 'Product' : 'New product'}</h1>
        </div>
        {product && <Status value={product.status} />}
      </div>
      {notice && (
        <p role="status" className="success">
          {notice}
        </p>
      )}
      {id && <QueryState query={productQuery} />}
      {(!id || product) && (
        <>
          <ProductForm
            product={product}
            busy={save.isPending}
            error={save.error}
            onSave={body => save.mutateAsync(body).catch(() => null)}
          />
          {!product && (
            <section className="panel">
              <h2>Categorization</h2>
              <p className="muted">
                Saving the draft starts an AI recommendation. You can review it in the editor.
              </p>
            </section>
          )}
          {product && (
            <>
              <div className="editor-columns">
                <div>
                  <QueryState query={categories} />
                  {categories.isSuccess && (
                    <CategoryActions
                      key={product.id}
                      product={product}
                      categories={categories.data}
                      refresh={refresh}
                      disabled={save.isPending || action.isPending}
                      initialSuggestion={initialSuggestion}
                    />
                  )}
                </div>
                <ProductImages product={product} refresh={refresh} />
              </div>
              <section className="panel">
                <h2>Publishing</h2>
                <p className="muted">
                  The server checks publishing requirements. Save your changes before publishing.
                </p>
                <ErrorMessage error={action.error} />
                <div className="actions">
                  {product.status !== 'ACTIVE' ? (
                    <button
                      disabled={action.isPending || save.isPending}
                      onClick={() => action.mutate('publish')}
                    >
                      Publish
                    </button>
                  ) : (
                    <button
                      className="secondary"
                      disabled={action.isPending || save.isPending}
                      onClick={() => action.mutate('deactivate')}
                    >
                      Deactivate
                    </button>
                  )}
                  <ConfirmButton
                    className="danger secondary"
                    disabled={action.isPending || save.isPending}
                    title="Delete product?"
                    description={
                      '“' +
                      product.name +
                      '” and its images will be permanently deleted. This action cannot be undone.'
                    }
                    confirmLabel="Delete product"
                    onConfirm={() => action.mutateAsync('delete')}
                  >
                    Delete product
                  </ConfirmButton>
                  {action.isPending && <span role="status">Processing…</span>}
                </div>
              </section>
            </>
          )}
        </>
      )}
    </>
  );
}
