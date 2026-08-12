import React, { useEffect } from 'react';
import { Publication } from '../types';
import { asset } from '../src/lib/assets';
import { LinkIcon, XIcon } from './icons';

interface PublicationFigureModalProps {
  publication: Publication;
  onClose: () => void;
}

const highlightAuthors = (authors: string) =>
  authors.split(/(H\.-X\. Zhong\*?)(?=,|$)/g).map((part, index) =>
    part.startsWith('H.-X. Zhong') ? (
      <strong key={index} className="text-foreground">
        {part}
      </strong>
    ) : (
      part
    )
  );

const PublicationFigureModal: React.FC<PublicationFigureModalProps> = ({ publication, onClose }) => {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 cursor-pointer bg-primary/60 backdrop-blur-sm"
        aria-label="Close featured paper"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="featured-paper-title"
        className="relative z-10 max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-card p-5 shadow-[var(--shadow-xl)] md:p-8"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 cursor-pointer rounded-full p-2 text-muted-fg transition-colors duration-200 hover:bg-muted hover:text-foreground"
          aria-label="Close"
        >
          <XIcon className="h-5 w-5" />
        </button>

        <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">Featured paper</p>
        <h3 id="featured-paper-title" className="mt-2 pr-8 font-serif text-2xl font-semibold text-primary">
          {publication.title}
        </h3>
        <p className="mt-2 text-sm text-muted-fg italic">{highlightAuthors(publication.authors)}</p>
        <p className="mt-1 text-sm text-secondary">
          {publication.source} ({publication.year})
        </p>
        {publication.correspondingAuthor && (
          <p className="mt-2 text-xs font-medium text-accent">Corresponding author: Hua-Xu Zhong</p>
        )}

        <div className="mt-5 overflow-hidden rounded-xl border border-border bg-muted">
          {publication.figureUrl ? (
            <figure>
              <img
                src={asset(publication.figureUrl)}
                alt={publication.figureCaption || `Figure from ${publication.title}`}
                className="mx-auto max-h-[28rem] w-full object-contain bg-white"
              />
              {publication.figureCaption && (
                <figcaption className="px-4 py-3 text-sm text-muted-fg">{publication.figureCaption}</figcaption>
              )}
            </figure>
          ) : (
            <div className="px-6 py-16 text-center">
              <p className="font-serif text-lg text-primary">Figure forthcoming</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-fg">
                The paper figure will appear here once the official graphic is added. Title and citation are ready now.
              </p>
            </div>
          )}
        </div>

        {publication.doi && (
          <a
            href={`https://doi.org/${publication.doi}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary mt-5"
          >
            <LinkIcon className="h-4 w-4" />
            Open DOI
          </a>
        )}
      </div>
    </div>
  );
};

export default PublicationFigureModal;
