'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react';
import { CategoryImage } from './category-image';

export function ProductGallery({ images, name }) {
  const slides = (images || [])
    .filter(image => image?.url)
    .slice()
    .sort((a, b) => Number(!!b.isPrimary) - Number(!!a.isPrimary));
  const [selected, setSelected] = useState(0);
  const thumbnails = useRef(null);
  const touch = useRef(null);
  const index = Math.min(selected, Math.max(0, slides.length - 1));
  const multiple = slides.length > 1;
  const move = direction => setSelected((index + direction + slides.length) % slides.length);

  useEffect(() => {
    const strip = thumbnails.current;
    const thumbnail = strip?.children[index];
    if (!thumbnail) {
      return;
    }
    const left = thumbnail.offsetLeft - strip.offsetLeft;
    if (left < strip.scrollLeft) {
      strip.scrollTo({ left });
    } else if (left + thumbnail.offsetWidth > strip.scrollLeft + strip.clientWidth) {
      strip.scrollTo({ left: left + thumbnail.offsetWidth - strip.clientWidth });
    }
  }, [index]);
  if (!slides.length) {
    return (
      <div className="empty product-gallery-empty">
        <ImageIcon size={36} />
        <p>No images</p>
      </div>
    );
  }

  return (
    <section
      className="product-gallery"
      role="region"
      aria-roledescription="carousel"
      aria-label="Product images"
      tabIndex={multiple ? 0 : undefined}
      onKeyDown={event => {
        if (!multiple) {
          return;
        }
        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          move(-1);
        }
        if (event.key === 'ArrowRight') {
          event.preventDefault();
          move(1);
        }
        if (event.key === 'Home') {
          event.preventDefault();
          setSelected(0);
        }
        if (event.key === 'End') {
          event.preventDefault();
          setSelected(slides.length - 1);
        }
      }}
    >
      <div
        className="gallery-stage"
        onTouchStart={event => {
          touch.current =
            event.touches.length === 1
              ? { x: event.touches[0].clientX, y: event.touches[0].clientY }
              : null;
        }}
        onTouchCancel={() => {
          touch.current = null;
        }}
        onTouchEnd={event => {
          const start = touch.current;
          touch.current = null;
          if (!multiple || !start || !event.changedTouches.length) {
            return;
          }
          const dx = event.changedTouches[0].clientX - start.x;
          const dy = event.changedTouches[0].clientY - start.y;
          if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2) {
            move(dx < 0 ? 1 : -1);
          }
        }}
      >
        <div
          className="gallery-slide"
          role="img"
          aria-label={name + ' — image ' + (index + 1) + ' of ' + slides.length}
        >
          <CategoryImage src={slides[index].url} />
        </div>
        {multiple && (
          <>
            <button
              type="button"
              className="gallery-arrow gallery-previous"
              aria-label="Previous image"
              onClick={() => move(-1)}
            >
              <ChevronLeft size={22} />
            </button>
            <button
              type="button"
              className="gallery-arrow gallery-next"
              aria-label="Next image"
              onClick={() => move(1)}
            >
              <ChevronRight size={22} />
            </button>
            <span className="gallery-counter" role="status" aria-live="polite" aria-atomic="true">
              {index + 1} / {slides.length}
            </span>
          </>
        )}
      </div>
      {multiple && (
        <div
          className="gallery-thumbnails"
          ref={thumbnails}
          role="group"
          aria-label="Choose product image"
        >
          {slides.map((image, slideIndex) => (
            <button
              type="button"
              key={image.url + '-' + slideIndex}
              className={'gallery-thumbnail' + (slideIndex === index ? ' is-selected' : '')}
              aria-label={'Show image ' + (slideIndex + 1) + ' of ' + slides.length}
              aria-pressed={slideIndex === index}
              onClick={() => setSelected(slideIndex)}
            >
              <CategoryImage src={image.url} />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
