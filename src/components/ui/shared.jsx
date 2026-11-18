'use client';

import { LoaderCircle } from 'lucide-react';

export function ErrorMessage({ error }) {
  return error ? (
    <div role="alert" className="error">
      {error.message || error}
    </div>
  ) : null;
}

export function QueryState({ query }) {
  if (query.isPending) {
    return (
      <p role="status" className="loading">
        <LoaderCircle size={18} className="animate-spin" /> Loading…
      </p>
    );
  }
  if (query.isError) {
    return (
      <div>
        <ErrorMessage error={query.error} />
        <button onClick={() => query.refetch()}>Try again</button>
      </div>
    );
  }
  return null;
}

export function Field({ label, error, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {error && <small className="text-red-700">{error.message}</small>}
    </label>
  );
}

export function Status({ value }) {
  return <span className={'status status-' + value}>{value}</span>;
}
