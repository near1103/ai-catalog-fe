'use client';

import { useId, useRef, useState } from 'react';
import { LoaderCircle, Trash2 } from 'lucide-react';
import { ErrorMessage } from './shared';

export function ConfirmButton({
  children,
  title,
  description,
  confirmLabel = 'Delete',
  onConfirm,
  ...buttonProps
}) {
  const dialog = useRef(null);
  const titleId = useId();
  const descriptionId = useId();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  const confirm = async () => {
    if (pending) return;

    setPending(true);
    setError(null);

    try {
      await onConfirm();
      dialog.current?.close();
    } catch (error) {
      setError(error);
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <button
        {...buttonProps}
        type="button"
        onClick={() => {
          setError(null);
          dialog.current.showModal();
        }}
      >
        {children}
      </button>
      <dialog
        ref={dialog}
        className="confirm-dialog"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        aria-busy={pending}
        onCancel={event => {
          if (pending) event.preventDefault();
        }}
      >
        <div className="confirm-dialog-icon">
          <Trash2 size={23} aria-hidden="true" />
        </div>
        <h2 id={titleId}>{title}</h2>
        <p id={descriptionId}>{description}</p>
        <ErrorMessage error={error} />
        <div className="confirm-dialog-actions">
          <button
            type="button"
            className="secondary"
            autoFocus
            disabled={pending}
            onClick={() => dialog.current.close()}
          >
            Cancel
          </button>
          <button
            type="button"
            className="confirm-dialog-delete"
            disabled={pending}
            onClick={confirm}
          >
            {pending && <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />}
            {pending ? 'Deleting…' : confirmLabel}
          </button>
        </div>
      </dialog>
    </>
  );
}
