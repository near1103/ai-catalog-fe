'use client';

import { useRef, useState } from 'react';
import { ImagePlus, LoaderCircle, Upload } from 'lucide-react';
import { ErrorMessage } from './shared';

const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export function ImageUpload({ onSelect, busy = false, buttonLabel = 'Choose image' }) {
  const input = useRef(null);
  const dragDepth = useRef(0);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const selectFile = file => {
    if (!file || busy) {
      return;
    }
    setError('');
    if (!acceptedTypes.includes(file.type)) {
      setError('Choose a JPEG, PNG, WebP, or GIF image.');
      return;
    }
    if (!file.size) {
      setError('The selected image is empty. Choose another file.');
      return;
    }
    onSelect(file);
  };

  return (
    <div className="image-upload-wrapper">
      <div
        className={
          'image-upload' + (dragging && !busy ? ' is-dragging' : '') + (busy ? ' is-uploading' : '')
        }
        role="group"
        aria-label="Upload image"
        aria-busy={busy}
        onDragEnter={event => {
          event.preventDefault();
          dragDepth.current++;
          if (!busy) {
            setDragging(true);
          }
        }}
        onDragOver={event => {
          event.preventDefault();
          event.dataTransfer.dropEffect = busy ? 'none' : 'copy';
        }}
        onDragLeave={event => {
          event.preventDefault();
          dragDepth.current = Math.max(0, dragDepth.current - 1);
          if (!dragDepth.current) {
            setDragging(false);
          }
        }}
        onDrop={event => {
          event.preventDefault();
          dragDepth.current = 0;
          setDragging(false);
          selectFile(event.dataTransfer.files?.[0]);
        }}
      >
        <span className="image-upload-icon" aria-hidden="true">
          {busy ? (
            <LoaderCircle size={25} className="animate-spin" />
          ) : (
            <ImagePlus size={25} strokeWidth={1.5} />
          )}
        </span>
        <div className="image-upload-copy">
          <strong>{busy ? 'Uploading image…' : 'Add an image'}</strong>
          <p>
            {busy
              ? 'Please wait while your image is saved.'
              : 'Drag and drop your image here, or choose a file.'}
          </p>
          <small>JPEG, PNG, WebP, or GIF</small>
        </div>
        <button
          type="button"
          className="image-upload-button"
          disabled={busy}
          onClick={() => input.current?.click()}
        >
          <Upload size={16} aria-hidden="true" />
          {busy ? 'Uploading…' : buttonLabel}
        </button>
        <input
          ref={input}
          type="file"
          accept={acceptedTypes.join(',')}
          hidden
          disabled={busy}
          aria-label="Image file"
          onChange={event => {
            const file = event.target.files?.[0];
            event.target.value = '';
            selectFile(file);
          }}
        />
      </div>
      <ErrorMessage error={error} />
    </div>
  );
}
