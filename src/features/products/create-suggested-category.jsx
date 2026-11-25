'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoaderCircle } from 'lucide-react';
import { z } from 'zod';
import { ErrorMessage, Field } from '@/components/ui/shared';
import { ImageUpload } from '@/components/ui/image-upload';
import { CategoryImage } from '@/components/catalog/category-image';

const levels = ['Department', 'Group', 'Category'];
const schema = z.object({
  categories: z.array(z.object({ name: z.string().trim().min(1, 'Enter a name').max(200) })),
});

export function CreateSuggestedCategory({ proposal, parents, disabled, mutation }) {
  const dialog = useRef(null);
  const titleId = useId();
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const {
    control,
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { categories: proposal.names.map(name => ({ name })) },
  });
  const { fields } = useFieldArray({ control, name: 'categories' });
  const pending = mutation.isPending;
  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl('');
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const submit = handleSubmit(async ({ categories }) => {
    try {
      await mutation.mutateAsync({
        body: { proposalId: proposal.id, names: categories.map(category => category.name) },
        imageFile,
      });
      dialog.current?.close();
    } catch {
      // The mutation error is displayed in the dialog.
    }
  });

  return (
    <>
      <button
        type="button"
        className="secondary"
        disabled={disabled}
        onClick={() => {
          reset();
          mutation.reset();
          dialog.current.showModal();
        }}
      >
        Review proposed {proposal.names.length === 1 ? 'category' : 'categories'}
      </button>
      <dialog
        ref={dialog}
        className="confirm-dialog category-proposal-dialog"
        aria-labelledby={titleId}
        aria-busy={pending}
        onClose={() => setImageFile(null)}
        onCancel={event => {
          if (pending) event.preventDefault();
        }}
      >
        <h2 id={titleId}>Create {proposal.names.length === 1 ? 'category' : 'categories'}</h2>
        <p>Review the names before creating the path and assigning it to this product.</p>
        {parents.length > 0 && <p>Under {parents.map(parent => parent.name).join(' / ')}</p>}
        <form onSubmit={submit}>
          {fields.map((field, index) => (
            <Field
              key={field.id}
              label={levels[parents.length + index]}
              error={errors.categories?.[index]?.name}
            >
              <input {...register(`categories.${index}.name`)} disabled={pending} maxLength={200} />
            </Field>
          ))}
          <fieldset className="category-proposal-image" disabled={pending}>
            <legend>Category image (optional)</legend>
            <p>The image will be used for the last category in the path.</p>
            <ImageUpload
              onSelect={setImageFile}
              busy={pending && !!imageFile}
              buttonLabel={imageFile ? 'Replace image' : 'Choose image'}
            />
            {imageFile && (
              <div className="category-image-preview">
                <CategoryImage src={previewUrl} />
                <div>
                  <strong>{imageFile.name}</strong>
                  <button type="button" className="ghost" onClick={() => setImageFile(null)}>
                    Remove image
                  </button>
                </div>
              </div>
            )}
          </fieldset>
          <ErrorMessage error={mutation.error} />
          <div className="confirm-dialog-actions">
            <button
              type="button"
              className="secondary"
              disabled={pending}
              onClick={() => dialog.current.close()}
            >
              Cancel
            </button>
            <button type="submit" disabled={pending}>
              {pending && (
                <LoaderCircle size={16} className="motion-safe:animate-spin" aria-hidden="true" />
              )}
              {pending ? 'Creating…' : 'Create and assign'}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
