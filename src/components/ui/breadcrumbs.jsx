import Link from 'next/link';
import { House } from 'lucide-react';

export function Breadcrumbs({ items, homeHref = '/', homeLabel = 'Home', label = 'Breadcrumb' }) {
  return (
    <nav className="breadcrumbs" aria-label={label}>
      <ol>
        <li>
          <Link
            className="breadcrumb-home"
            href={homeHref}
            aria-label={homeLabel}
            title={homeLabel}
          >
            <House size={16} strokeWidth={1.7} aria-hidden="true" />
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={item.href || index}>
            <span className="breadcrumb-separator" aria-hidden="true">
              /
            </span>
            {item.href ? (
              <Link href={item.href}>{item.label}</Link>
            ) : (
              <span aria-current="page">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
