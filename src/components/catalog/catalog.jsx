'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ShoppingBag, ArrowUpRight, ImageIcon, LayoutGrid, Package, Store } from 'lucide-react';
import { publicApi } from '@/lib/api/publicApi';
import { QueryState } from '@/components/ui/shared';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { categoryPath, inCategory } from '@/utils/categories';
import { CategoryImage } from './category-image';
import { CategoryCard } from './category-card';
import { ProductGallery } from './product-gallery';
import { CategoryNavigation, CategoryTiles, categoryHref } from './category-navigation';

export function PublicShell({ children }) {
  const pathname = usePathname();
  const isCatalogActive = pathname.startsWith('/categories');
  const isAllProductsActive = pathname === '/catalog' || pathname === '/';

  return (
    <div className="storefront">
      <header className="public-header">
        <Link href="/" className="brand" aria-label="Shop — home">
          <ShoppingBag size={30} /> shop
        </Link>
        <nav aria-label="Main navigation">
          <Link
            href="/categories"
            className={'header-nav-link' + (isCatalogActive ? ' is-active' : '')}
            aria-current={isCatalogActive ? 'page' : undefined}
          >
            <LayoutGrid size={20} /> Catalog
          </Link>
          <Link
            href="/catalog"
            className={'header-nav-link' + (isAllProductsActive ? ' is-active' : '')}
            aria-current={isAllProductsActive ? 'page' : undefined}
          >
            <Package size={20} /> All products
          </Link>
        </nav>
        <Link className="header-nav-link header-admin" href="/admin" aria-label="Admin dashboard">
          <Store size={20} />
          <span>Admin dashboard</span>
        </Link>
      </header>
      <main className="public-main">{children}</main>
      <footer>
        <Link className="brand" href="/">
          <ShoppingBag size={22} /> shop
        </Link>
        <span>Product catalog</span>
        <Link href="/admin">Manage catalog ↗</Link>
      </footer>
    </div>
  );
}

function ProductCard({ product, categories }) {
  const image = product.images?.find(image => image.isPrimary) || product.images?.[0];
  const categoryName =
    categories.find(category => category.id === product.categoryId)?.name || 'Product';

  return (
    <Link className="product-card" href={'/products/' + encodeURIComponent(product.id)}>
      <div className="product-image">
        <CategoryImage src={image?.url} />
      </div>
      <div className="p-5">
        <p className="product-category">{categoryName}</p>
        <h3>{product.name}</h3>
        <p className="line-clamp-2 muted">{product.description}</p>
        <span className="product-details-link">
          View details <ArrowUpRight size={15} />
        </span>
      </div>
    </Link>
  );
}

export function Catalog({ categoryId }) {
  const categories = useQuery({ queryKey: ['categories'], queryFn: publicApi.categories });
  const products = useQuery({ queryKey: ['public-products'], queryFn: publicApi.products });
  const category = useQuery({
    queryKey: ['category', categoryId],
    queryFn: () => publicApi.category(categoryId),
    enabled: !!categoryId,
  });

  const allCategories = categories.data || [];
  const filteredProducts = (products.data || []).filter(
    product => !categoryId || inCategory(allCategories, product.categoryId, categoryId),
  );
  const subcategories = categoryId
    ? allCategories.filter(category => category.parentId === categoryId)
    : [];
  const breadcrumbItems = categoryPath(allCategories, categoryId).map(category => ({
    label: category.name,
    href: category.id === categoryId ? undefined : categoryHref(category),
  }));
  const isCatalogReady =
    products.isSuccess && categories.isSuccess && (!categoryId || category.isSuccess);

  return (
    <PublicShell>
      <div className="catalog-layout">
        <aside className="catalog-sidebar">
          <QueryState query={categories} />
          <CategoryNavigation categories={allCategories} currentId={categoryId} />
        </aside>
        <section className="catalog-results">
          {categoryId && <Breadcrumbs label="Category breadcrumb" items={breadcrumbItems} />}
          <div className="page-heading">
            <div>
              <h1>{categoryId ? category.data?.name || 'Category' : 'All products'}</h1>
            </div>
            <span className="product-count">
              {products.isSuccess
                ? filteredProducts.length === 1
                  ? '1 product'
                  : filteredProducts.length + ' products'
                : ''}
            </span>
          </div>
          {categoryId && <QueryState query={category} />}
          {subcategories.length > 0 && (
            <section className="browse-categories" aria-label="Subcategories">
              <CategoryTiles categories={subcategories} />
            </section>
          )}
          <QueryState query={products} />
          {isCatalogReady &&
            (filteredProducts.length ? (
              <div className="product-grid">
                {filteredProducts.map(product => (
                  <ProductCard key={product.id} product={product} categories={allCategories} />
                ))}
              </div>
            ) : (
              <div className="empty">
                <ImageIcon size={32} strokeWidth={1.3} />
                <h3>No products in this category yet</h3>
                <Link className="button secondary" href="/catalog">
                  All products
                </Link>
              </div>
            ))}
        </section>
      </div>
    </PublicShell>
  );
}

export function CategoriesPage() {
  const categories = useQuery({ queryKey: ['categories'], queryFn: publicApi.categories });
  const rootCategories = (categories.data || []).filter(category => category.level === 1);

  return (
    <PublicShell>
      <div className="catalog-layout">
        <aside className="catalog-sidebar">
          <QueryState query={categories} />
          <CategoryNavigation categories={categories.data || []} />
        </aside>
        <section className="catalog-results">
          <Breadcrumbs items={[{ label: 'Categories' }]} />
          <div className="page-heading">
            <h1>Product catalog</h1>
          </div>
          {categories.isSuccess &&
            (rootCategories.length ? (
              <div className="category-directory">
                {rootCategories.map(category => (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    subcategories={categories.data.filter(child => child.parentId === category.id)}
                  />
                ))}
              </div>
            ) : (
              <p className="empty">No categories yet.</p>
            ))}
        </section>
      </div>
    </PublicShell>
  );
}

export function ProductDetails({ id }) {
  const productQuery = useQuery({
    queryKey: ['public-product', id],
    queryFn: () => publicApi.product(id),
  });
  const categories = useQuery({ queryKey: ['categories'], queryFn: publicApi.categories });
  const product = productQuery.data;
  const leafCategory = (categories.data || []).find(
    category => category.id === product?.categoryId && category.level === 3,
  );
  const products = useQuery({
    queryKey: ['public-products'],
    queryFn: publicApi.products,
    enabled: !!leafCategory,
  });

  const recommendedProducts = leafCategory
    ? (products.data || []).filter(
        candidate => candidate.id !== product.id && candidate.categoryId === leafCategory.id,
      )
    : [];
  const specifications = Object.entries(product?.characteristics || {});
  const breadcrumbItems = [
    ...categoryPath(categories.data || [], product?.categoryId).map(category => ({
      label: category.name,
      href: categoryHref(category),
    })),
    { label: product?.name || 'Product' },
  ];

  return (
    <PublicShell>
      <div className="product-details-page">
        <Breadcrumbs label="Product breadcrumb" items={breadcrumbItems} />
        <QueryState query={productQuery} />
        {product && (
          <>
            <div className="details-grid">
              <ProductGallery key={product.id} images={product.images} name={product.name} />
              <div>
                <p className="eyebrow">Product details</p>
                <h1>{product.name}</h1>
                <p className="description">{product.description || 'No description yet.'}</p>
                <h2>Specifications</h2>
                <dl className="specs">
                  {specifications.map(([name, value]) => (
                    <div key={name}>
                      <dt>{name}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
                {!specifications.length && <p className="muted">No specifications yet.</p>}
                <QueryState query={categories} />
              </div>
            </div>
            {recommendedProducts.length > 0 && (
              <section className="recommended-products" aria-label="Recommended products">
                <div className="recommendations-heading">
                  <h2>Recommended products</h2>
                  <Link href={categoryHref(leafCategory)}>
                    View category <ArrowUpRight size={15} />
                  </Link>
                </div>
                <div className="product-grid">
                  {recommendedProducts.map(product => (
                    <ProductCard key={product.id} product={product} categories={categories.data} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </PublicShell>
  );
}
