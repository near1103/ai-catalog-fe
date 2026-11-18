'use client';

import { useState } from 'react';
import { ImageIcon } from 'lucide-react';

export function CategoryImage({ src, compact = false }) {
  const [failedSrc, setFailedSrc] = useState(null);

  return (
    <span className={compact ? 'category-thumbnail' : 'category-image'} aria-hidden="true">
      {src && src !== failedSrc ? (
        <img key={src} src={src} alt="" loading="lazy" onError={() => setFailedSrc(src)} />
      ) : (
        <ImageIcon size={compact ? 20 : 36} strokeWidth={1.3} />
      )}
    </span>
  );
}
