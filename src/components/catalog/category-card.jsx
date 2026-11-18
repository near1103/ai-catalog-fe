import Link from 'next/link';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { CategoryImage } from './category-image';
import { categoryHref } from './category-navigation';

export function CategoryCard({ category, subcategories }) {
  return (
    <article className="category-card">
      <Link
        className="category-card-image"
        href={categoryHref(category)}
        aria-label={category.name}
      >
        <CategoryImage src={category.imageUrl} />
      </Link>
      <div className="category-card-content">
        <h2>
          <Link href={categoryHref(category)}>{category.name}</Link>
        </h2>
        {subcategories.length > 0 && (
          <ul className="category-card-links" aria-label={'Subcategories: ' + category.name}>
            {subcategories.map(child => (
              <li key={child.id}>
                <Link href={categoryHref(child)}>
                  <span>{child.name}</span>
                  <ChevronRight size={14} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link className="category-card-footer" href={categoryHref(category)}>
          View department <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
