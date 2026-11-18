'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, ArrowUpRight } from 'lucide-react';
import { adminApi } from '@/lib/api/adminApi';
import { QueryState, Status } from '@/components/ui/shared';
import { CategoryImage } from '@/components/catalog/category-image';

const tabs = [
  ['', 'All products'],
  ['DRAFT', 'Drafts'],
  ['ACTIVE', 'Published'],
  ['INACTIVE', 'Inactive'],
];

export default function AdminProducts() {
  const [status, setStatus] = useState('');
  const productsQuery = useQuery({
    queryKey: ['admin-products', status],
    queryFn: () => adminApi.products(status),
  });
  const products = productsQuery.data || [];

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Manage your inventory</p>
          <h1>Products</h1>
        </div>
        <Link className="button" href="/admin/products/new">
          <Plus size={17} /> Add product
        </Link>
      </div>
      <div className="tabs" role="group" aria-label="Product status">
        {tabs.map(([value, label]) => (
          <button
            key={value}
            className={status === value ? '' : 'secondary'}
            aria-pressed={status === value}
            onClick={() => setStatus(value)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="catalog-toolbar">
        <span className="muted">
          {productsQuery.isSuccess
            ? products.length === 1
              ? '1 product'
              : products.length + ' products'
            : 'Inventory'}
        </span>
      </div>
      <QueryState query={productsQuery} />
      {productsQuery.isSuccess &&
        (products.length ? (
          <div className="panel table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Status</th>
                  <th>Categorization</th>
                  <th>Last updated</th>
                  <th>
                    <span className="sr-only">Open</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.id}>
                    <td>
                      <Link
                        className="table-product table-link"
                        href={'/admin/products/' + encodeURIComponent(product.id)}
                      >
                        <CategoryImage
                          src={
                            (product.images?.find(image => image.isPrimary) || product.images?.[0])
                              ?.url
                          }
                          compact
                        />
                        <span>
                          {product.name}
                          <small>{product.id}</small>
                        </span>
                      </Link>
                    </td>
                    <td>
                      <Status value={product.status} />
                    </td>
                    <td>{product.categorySource || 'Not selected'}</td>
                    <td>
                      {product.updatedAt
                        ? new Date(product.updatedAt).toLocaleString('en-GB')
                        : '—'}
                    </td>
                    <td>
                      <Link
                        className="subtle"
                        href={'/admin/products/' + encodeURIComponent(product.id)}
                        aria-label={'Edit ' + product.name}
                      >
                        <ArrowUpRight size={17} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty">
            <h3>No products yet</h3>
            <p>Add your first product to get started.</p>
            <Link className="button secondary" href="/admin/products/new">
              <Plus size={16} /> Add product
            </Link>
          </div>
        ))}
    </>
  );
}
