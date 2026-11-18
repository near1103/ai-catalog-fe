'use client';

import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Field, ErrorMessage } from '@/components/ui/shared';

const schema = z
  .object({
    name: z.string().trim().min(1, 'Enter a name').max(300),
    description: z.string().max(20000),
    characteristics: z
      .array(
        z.object({
          key: z.string().trim().min(1, 'Enter a key').max(100),
          value: z.string().trim().min(1, 'Enter a value').max(2000),
        }),
      )
      .max(100),
  })
  .superRefine((formValues, context) => {
    const seen = new Set();
    formValues.characteristics.forEach((row, index) => {
      if (seen.has(row.key)) {
        context.addIssue({
          code: 'custom',
          message: 'Keys must be unique',
          path: ['characteristics', index, 'key'],
        });
      }
      seen.add(row.key);
    });
  });
const getDefaultValues = product => ({
  name: product?.name || '',
  description: product?.description || '',
  characteristics: Object.entries(product?.characteristics || {}).map(([key, value]) => ({
    key,
    value,
  })),
});

export function ProductForm({ product, onSave, busy, error }) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm({ resolver: zodResolver(schema), defaultValues: getDefaultValues(product) });
  const { fields, append, remove } = useFieldArray({ control, name: 'characteristics' });

  useEffect(() => {
    reset(getDefaultValues(product));
  }, [product?.id, reset]);

  const submit = handleSubmit(async formValues => {
    const savedProduct = await onSave({
      name: formValues.name,
      description: formValues.description,
      characteristics: Object.fromEntries(
        formValues.characteristics.map(({ key, value }) => [key, value]),
      ),
    });

    if (savedProduct) {
      reset(getDefaultValues(savedProduct));
    }
  });

  return (
    <form className="panel" onSubmit={submit}>
      <h2>Basic information</h2>
      <ErrorMessage error={error} />
      <Field label="Product name" error={errors.name}>
        <input {...register('name')} />
      </Field>
      <Field label="Description" error={errors.description}>
        <textarea rows={6} {...register('description')} />
      </Field>
      <h2>Specifications</h2>
      <p className="muted">Add specifications as name and value pairs.</p>
      {fields.map((field, index) => (
        <div className="characteristic" key={field.id}>
          <Field label="Name" error={errors.characteristics?.[index]?.key}>
            <input {...register('characteristics.' + index + '.key')} />
          </Field>
          <Field label="Value" error={errors.characteristics?.[index]?.value}>
            <input {...register('characteristics.' + index + '.value')} />
          </Field>
          <button
            type="button"
            className="ghost danger"
            aria-label="Remove specification"
            onClick={() => remove(index)}
          >
            ×
          </button>
        </div>
      ))}
      <ErrorMessage
        error={
          errors.characteristics?.root ||
          (!Array.isArray(errors.characteristics) && errors.characteristics)
        }
      />
      <button
        type="button"
        className="secondary"
        disabled={fields.length >= 100}
        onClick={() => append({ key: '', value: '' })}
      >
        + Specification
      </button>
      <div className="form-footer">
        <span className="muted">{isDirty ? 'You have unsaved changes' : ''}</span>
        <button disabled={busy}>
          {busy ? 'Saving…' : product ? 'Save changes' : 'Create draft'}
        </button>
      </div>
    </form>
  );
}
