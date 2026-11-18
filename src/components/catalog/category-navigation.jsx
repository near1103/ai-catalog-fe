'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, ChevronDown, ChevronRight, LayoutGrid } from 'lucide-react';
import { categoryPath } from '@/utils/categories';
import { CategoryImage } from './category-image';

export const categoryHref = category => '/categories/' + encodeURIComponent(category.id);

export function CategoryTiles({ categories, onNavigate }) {
  return (
    <div className="category-tiles">
      {categories.map(category => (
        <Link
          className="category-tile"
          key={category.id}
          href={categoryHref(category)}
          onClick={onNavigate}
        >
          <CategoryImage src={category.imageUrl} />
          <span>{category.name}</span>
        </Link>
      ))}
    </div>
  );
}

export function CategoryNavigation({ categories, currentId }) {
  const [expanded, setExpanded] = useState(false);
  const roots = categories.filter(category => category.level === 1);
  const activeRoot = categoryPath(categories, currentId)[0]?.id;
  const close = () => setExpanded(false);

  return (
    <div className={'category-sidebar-menu' + (expanded ? ' is-expanded' : '')}>
      <button
        className="sidebar-category-toggle"
        aria-expanded={expanded}
        onClick={() => setExpanded(!expanded)}
      >
        <LayoutGrid size={19} /> Categories <ChevronDown size={17} />
      </button>
      <nav className="category-navigation" aria-label="Product categories">
        <Link
          className={'category-nav-all' + (!currentId ? ' selected' : '')}
          href="/catalog"
          onClick={close}
        >
          <LayoutGrid size={21} />
          <span>All products</span>
        </Link>
        {roots.map(category => (
          <div className="category-root-entry" key={category.id}>
            <div className={'category-root-row' + (activeRoot === category.id ? ' active' : '')}>
              <Link
                href={categoryHref(category)}
                aria-current={currentId === category.id ? 'page' : undefined}
                onClick={close}
              >
                <CategoryImage src={category.imageUrl} compact />
                <span>{category.name}</span>
                <ChevronRight className="category-row-chevron" size={15} aria-hidden="true" />
              </Link>
            </div>
          </div>
        ))}
        <Link className="category-nav-directory" href="/categories" onClick={close}>
          All categories <ArrowRight size={14} />
        </Link>
      </nav>
    </div>
  );
}
