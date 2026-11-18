'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoaderCircle, Sparkles } from 'lucide-react';
import { z } from 'zod';
import { adminApi } from '@/lib/api/adminApi';
import { ErrorMessage, Field } from '@/components/ui/shared';
import { categoryPath, categorySelection, isCategorySelectionValid } from '@/utils/categories';

const schema = z.object({
  rootId: z.string().min(1, 'Choose a department'),
  groupId: z.string().min(1, 'Choose a group'),
  leafId: z.string().min(1, 'Choose a category'),
});
const version = product =>
  JSON.stringify([product.id, product.categoryId, product.categorySource, product.aiSuggestion]);
const recommendation = (categories, suggestion) => {
  const path = categorySelection(categories, suggestion?.leafCategoryId);
  return path.rootId === suggestion?.rootCategoryId &&
    path.groupId === suggestion?.sectionCategoryId
    ? path
    : categorySelection(categories, null);
};
const initialSelection = (categories, product) => {
  const assigned = categorySelection(categories, product.categoryId);
  return assigned.leafId ? assigned : recommendation(categories, product.aiSuggestion);
};

export function CategoryActions({ product, categories, refresh, disabled = false }) {
  const cache = useQueryClient();
  const [notice, setNotice] = useState('');
  const serverVersion = version(product);
  const synchronized = useRef(serverVersion);
  const {
    register,
    watch,
    setValue,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialSelection(categories, product),
  });
  const selected = watch();

  useEffect(() => {
    if (synchronized.current === serverVersion) {
      return;
    }
    synchronized.current = serverVersion;
    reset(initialSelection(categories, product));
    setNotice('');
  }, [serverVersion, categories, product, reset]);
  const update = (updated, selection) => {
    synchronized.current = version(updated);
    cache.setQueryData(['admin-product', product.id], updated);
    reset(selection);
  };
  const manual = useMutation({
    mutationFn: leafId => adminApi.action(product.id, 'category', 'PUT', { categoryId: leafId }),
    onSuccess: updated => {
      update(updated, categorySelection(categories, updated.categoryId));
      setNotice('Category saved.');
    },
    onSettled: refresh,
  });
  const suggest = useMutation({
    mutationFn: () => adminApi.action(product.id, 'ai-suggestion'),
    retry: false,
    onSuccess: updated => {
      update(updated, recommendation(categories, updated.aiSuggestion));
      setNotice('Recommendation ready. Review the selected categories before applying.');
    },
    onSettled: refresh,
  });
  const decision = useMutation({
    mutationFn: accept =>
      adminApi.action(
        product.id,
        accept ? 'ai-suggestion/accept' : 'ai-suggestion',
        accept ? 'POST' : 'DELETE',
      ),
    onSuccess: (updated, accept) => {
      update(updated, categorySelection(categories, updated.categoryId));
      setNotice(accept ? 'AI recommendation applied.' : 'Recommendation dismissed.');
    },
    onSettled: refresh,
  });
  const busy = disabled || manual.isPending || suggest.isPending || decision.isPending;
  const suggestion = product.aiSuggestion;
  const suggested = recommendation(categories, suggestion);
  const hasRecommendation = !!suggested.leafId;
  const matchesRecommendation =
    hasRecommendation &&
    selected.rootId === suggested.rootId &&
    selected.groupId === suggested.groupId &&
    selected.leafId === suggested.leafId;
  const roots = categories.filter(category => category.level === 1);
  const groups = categories.filter(
    category => category.level === 2 && category.parentId === selected.rootId,
  );
  const leaves = categories.filter(
    category => category.level === 3 && category.parentId === selected.groupId,
  );
  const complete = isCategorySelectionValid(categories, selected);
  const hasCategoryTree = categories.some(
    category => category.level === 3 && categorySelection(categories, category.id).leafId,
  );
  const clearErrors = () => {
    manual.reset();
    suggest.reset();
    decision.reset();
    setNotice('');
  };
  const submit = handleSubmit(values => {
    if (!isCategorySelectionValid(categories, values)) {
      return;
    }
    clearErrors();
    if (matchesRecommendation) {
      decision.mutate(true);
    } else manual.mutate(values.leafId);
  });

  return (
    <section className="panel category-actions">
      <div className="category-action-heading">
        <h2>Categorization</h2>
        <span className="category-source">
          {product.categorySource === 'AI'
            ? 'Assigned by AI'
            : product.categorySource === 'MANUAL'
              ? 'Assigned manually'
              : 'Not assigned'}
        </span>
      </div>
      <p className="category-assigned">
        {categoryPath(categories, product.categoryId)
          .map(category => category.name)
          .join(' / ') || 'No category assigned'}
      </p>
      <button
        type="button"
        className="category-ai-button"
        disabled={busy || !hasCategoryTree}
        onClick={() => {
          clearErrors();
          suggest.mutate();
        }}
      >
        {suggest.isPending ? (
          <LoaderCircle size={18} className="animate-spin" aria-hidden="true" />
        ) : (
          <Sparkles size={18} aria-hidden="true" />
        )}
        {suggest.isPending
          ? 'Generating recommendation…'
          : suggestion
            ? 'Generate a new recommendation'
            : 'Suggest with AI'}
      </button>
      <p className="category-ai-help">
        {hasCategoryTree
          ? 'Uses the saved product name, description, and specifications.'
          : 'Add a complete three-level category path to enable AI suggestions.'}
      </p>
      {!hasCategoryTree && (
        <Link className="table-link" href="/admin/categories">
          Manage categories
        </Link>
      )}
      <form onSubmit={submit}>
        <div className="category-selectors">
          <Field label="1. Department" error={errors.rootId}>
            <select
              disabled={busy || !roots.length}
              {...register('rootId', {
                onChange: () => {
                  setValue('groupId', '', { shouldDirty: true });
                  setValue('leafId', '', { shouldDirty: true });
                  setNotice('');
                },
              })}
            >
              <option value="">Choose a department</option>
              {roots.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="2. Group" error={errors.groupId}>
            <select
              disabled={busy || !selected.rootId || !groups.length}
              {...register('groupId', {
                onChange: () => {
                  setValue('leafId', '', { shouldDirty: true });
                  setNotice('');
                },
              })}
            >
              <option value="">
                {!selected.rootId
                  ? 'Choose a department first'
                  : !groups.length
                    ? 'No groups in this department'
                    : 'Choose a group'}
              </option>
              {groups.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="3. Category" error={errors.leafId}>
            <select
              disabled={busy || !selected.groupId || !leaves.length}
              {...register('leafId', { onChange: () => setNotice('') })}
            >
              <option value="">
                {!selected.groupId
                  ? 'Choose a group first'
                  : !leaves.length
                    ? 'No categories in this group'
                    : 'Choose a category'}
              </option>
              {leaves.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <ErrorMessage error={manual.error || suggest.error || decision.error} />
        {suggestion && (
          <div className="category-recommendation">
            <div className="category-recommendation-heading">
              <Sparkles size={16} aria-hidden="true" />
              <strong>AI recommendation</strong>
            </div>
            <p>{suggestion.reason}</p>
            {!hasRecommendation ? (
              <p className="muted">
                The recommended category is no longer available. Choose another category or request
                a new recommendation.
              </p>
            ) : (
              !matchesRecommendation && (
                <button
                  type="button"
                  className="ghost"
                  disabled={busy}
                  onClick={() => {
                    reset(suggested);
                    setNotice('');
                  }}
                >
                  Use recommendation in the lists
                </button>
              )
            )}
            <button
              type="button"
              className="ghost"
              disabled={busy}
              onClick={() => {
                clearErrors();
                decision.mutate(false);
              }}
            >
              Dismiss recommendation
            </button>
          </div>
        )}
        {notice && (
          <p className="category-action-notice" role="status">
            {notice}
          </p>
        )}
        <button type="submit" className="category-apply-button" disabled={busy || !complete}>
          {manual.isPending || decision.isPending
            ? 'Saving…'
            : matchesRecommendation
              ? 'Accept recommendation'
              : 'Apply category'}
        </button>
        {!complete && (
          <p className="category-selection-help">Select all three levels to apply a category.</p>
        )}
      </form>
    </section>
  );
}
