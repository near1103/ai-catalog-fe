'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  ShoppingBag,
  Package,
  FolderTree,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  ArrowUpRight,
  UserRound,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/features/auth/auth-provider';
import { ErrorMessage } from '@/components/ui/shared';

export function AdminShell({ children }) {
  const auth = useAuth();
  const path = usePathname();
  const router = useRouter();
  const cache = useQueryClient();
  const [error, setError] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const login = path === '/admin/login';

  useEffect(() => {
    if (!auth.loading && !auth.user && !login) {
      router.replace('/admin/login');
    }
  }, [auth.loading, auth.user, login, router]);

  useEffect(() => {
    const expired = () => {
      cache.removeQueries({ predicate: query => String(query.queryKey[0]).startsWith('admin-') });
      router.replace('/admin/login');
    };
    window.addEventListener('auth-expired', expired);
    return () => window.removeEventListener('auth-expired', expired);
  }, [cache, router]);
  if (login) {
    return children;
  }
  if (auth.loading || !auth.user) {
    return (
      <main className="login-wrap">
        <p>{auth.error || 'Checking your session…'}</p>
      </main>
    );
  }

  return (
    <div className={'admin-shell' + (collapsed ? ' sidebar-collapsed' : '')}>
      <aside className="admin-sidebar">
        <Link className="brand" href="/admin" aria-label="Shop — admin dashboard">
          <ShoppingBag size={27} />
          <span className="admin-wordmark">
            shop<small>merchant center</small>
          </span>
        </Link>
        <p className="nav-caption">Workspace</p>
        <nav aria-label="Administration">
          <Link
            title="Products"
            aria-current={path.includes('products') ? 'page' : undefined}
            className={path.includes('products') ? 'selected' : ''}
            href="/admin/products"
          >
            <Package size={19} />
            <span>Products</span>
          </Link>
          <Link
            title="Categories"
            aria-current={path.includes('categories') ? 'page' : undefined}
            className={path.includes('categories') ? 'selected' : ''}
            href="/admin/categories"
          >
            <FolderTree size={19} />
            <span>Categories</span>
          </Link>
        </nav>
        <div className="sidebar-bottom">
          <Link className="store-link" href="/catalog" title="View store">
            <ArrowUpRight size={18} />
            <span>View store</span>
          </Link>
          <button
            className="ghost collapse-button"
            aria-label={collapsed ? 'Expand menu' : 'Collapse menu'}
            aria-expanded={!collapsed}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <PanelLeftOpen size={19} /> : <PanelLeftClose size={19} />}
            <span>Collapse sidebar</span>
          </button>
        </div>
      </aside>
      <div className="admin-content">
        <header className="admin-top">
          <div className="admin-location">
            <span>Workspace</span>
            <ChevronRight size={14} />
            <strong>{path.includes('categories') ? 'Categories' : 'Products'}</strong>
          </div>
          <div>
            <span className="user-avatar">
              <UserRound size={17} />
            </span>
            <span className="account-email">{auth.user.email}</span>
            <button
              className="ghost"
              title="Sign out"
              onClick={async () => {
                try {
                  await auth.logout();
                  cache.clear();
                  router.replace('/admin/login');
                } catch (caughtError) {
                  setError(caughtError.message);
                }
              }}
            >
              <LogOut size={16} />
              <span>Sign out</span>
            </button>
          </div>
        </header>
        <main>
          <ErrorMessage error={error} />
          {children}
        </main>
      </div>
    </div>
  );
}
