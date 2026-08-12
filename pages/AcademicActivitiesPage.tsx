import React, { useMemo, useState } from 'react';
import Section from '../components/Section';
import { ACADEMIC_ACTIVITIES_DATA, CAROUSEL_SLIDES_DATA } from '../constants';
import { AcademicActivity } from '../types';
import { CalendarIcon, LinkIcon, LocationIcon, XIcon } from '../components/icons';
import { asset } from '../src/lib/assets';
import { isFilled } from '../src/lib/content';

const typeLabel: Record<AcademicActivity['type'], string> = {
  'Invited Talk': 'Invited talk',
  'Conference Oral Presentation': 'Oral presentation',
  'Poster Presentation': 'Poster',
  'Conference Attendance': 'Conference',
  'Seminar/Workshop': 'Seminar / workshop',
  'Public Lecture': 'Public lecture',
};

const ActivityRow: React.FC<{ activity: AcademicActivity }> = ({ activity }) => (
  <article className="grid gap-3 border-b border-border py-5 md:grid-cols-[7.5rem_1fr]">
    <div>
      <p className="text-sm font-medium text-primary">{isFilled(activity.date) ? activity.date : 'Date TBD'}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted-fg">{typeLabel[activity.type]}</p>
    </div>
    <div>
      <h3 className="font-sans text-lg font-semibold text-primary">{activity.title || activity.eventName}</h3>
      {isFilled(activity.title) && isFilled(activity.eventName) && (
        <p className="mt-1 text-sm text-secondary">{activity.eventName}</p>
      )}
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-fg">
        {isFilled(activity.location) && (
          <span className="inline-flex items-center">
            <LocationIcon className="mr-1.5 h-4 w-4 text-primary" />
            {activity.location}
          </span>
        )}
        {isFilled(activity.role) && (
          <span className="inline-flex items-center">
            <CalendarIcon className="mr-1.5 h-4 w-4 text-primary" />
            {activity.role}
          </span>
        )}
      </div>
      {(activity.slidesUrl || activity.posterUrl) && (
        <div className="mt-3 flex gap-4">
          {activity.slidesUrl && (
            <a href={activity.slidesUrl} target="_blank" rel="noopener noreferrer" className="inline-flex cursor-pointer items-center text-sm text-accent hover:text-accent-soft">
              <LinkIcon className="mr-1 h-3.5 w-3.5" /> Slides
            </a>
          )}
          {activity.posterUrl && (
            <a href={activity.posterUrl} target="_blank" rel="noopener noreferrer" className="inline-flex cursor-pointer items-center text-sm text-accent hover:text-accent-soft">
              <LinkIcon className="mr-1 h-3.5 w-3.5" /> Poster
            </a>
          )}
        </div>
      )}
    </div>
  </article>
);

const AcademicActivitiesPage: React.FC = () => {
  const [lightbox, setLightbox] = useState<(typeof CAROUSEL_SLIDES_DATA)[number] | null>(null);

  const photos = useMemo(
    () => CAROUSEL_SLIDES_DATA.filter((slide) => isFilled(slide.imageUrl)),
    []
  );

  const records = useMemo(
    () =>
      ACADEMIC_ACTIVITIES_DATA.filter(
        (act) => isFilled(act.title) || isFilled(act.eventName)
      ).sort((a, b) => (b.date || '').localeCompare(a.date || '')),
    []
  );

  return (
    <Section
      title="Academic activities"
      eyebrow="Community"
      subtitle="A photo archive and a running record of talks. Captions and venues will be attached as they are confirmed."
      className="bg-background"
    >
      <div className="mb-16">
        <h3 className="mb-2 font-sans text-xl font-semibold text-primary">Gallery</h3>
        <p className="mb-6 max-w-2xl text-sm text-muted-fg">
          Photographs from conferences and workshops. Click a frame to view it larger.
        </p>
        {photos.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {photos.map((slide) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setLightbox(slide)}
                className="group cursor-pointer overflow-hidden rounded-[var(--radius-card)] border border-border bg-card text-left shadow-[var(--shadow-soft)]"
              >
                <img
                  src={asset(slide.imageUrl)}
                  alt={slide.alt || 'Academic activity'}
                  className="aspect-[16/10] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
                <div className="px-4 py-3">
                  <p className="text-sm font-medium text-primary">
                    {slide.caption || 'Caption forthcoming'}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-fg">Conference / workshop photograph</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-[var(--radius-card)] border border-dashed border-border bg-card px-6 py-12 text-center">
            <p className="font-sans font-semibold text-primary">No photographs archived yet</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-fg">
              Add images to the gallery when event photos are ready. They will appear as framed tiles, not as empty category lists.
            </p>
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-2 font-sans text-xl font-semibold text-primary">Talks and visits</h3>
        <p className="mb-6 max-w-2xl text-sm text-muted-fg">
          Invited talks, oral and poster presentations, workshops, and conference attendance — listed as a CV timeline when records are added.
        </p>
        {records.length > 0 ? (
          <div className="rounded-[var(--radius-card)] border border-border bg-card px-5 md:px-7">
            {records.map((activity) => (
              <ActivityRow key={activity.id} activity={activity} />
            ))}
          </div>
        ) : (
          <div className="rounded-[var(--radius-card)] border border-dashed border-border bg-card px-6 py-12">
            <p className="font-sans font-semibold text-primary">No talks listed yet</p>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-fg">
              This page will not invent events. When you add a title, venue, and date, they will appear here as a single timeline — not as four empty sections.
            </p>
          </div>
        )}
      </div>

      {lightbox && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 cursor-pointer bg-primary/70"
            aria-label="Close photograph"
            onClick={() => setLightbox(null)}
          />
          <div className="relative z-10 max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-lift)]">
            <button
              type="button"
              onClick={() => setLightbox(null)}
              className="absolute top-3 right-3 z-10 cursor-pointer rounded-full bg-primary/80 p-2 text-white"
              aria-label="Close"
            >
              <XIcon className="h-5 w-5" />
            </button>
            <img
              src={asset(lightbox.imageUrl)}
              alt={lightbox.alt || 'Academic activity'}
              className="max-h-[80vh] w-full object-contain bg-primary"
            />
            <p className="px-5 py-3 text-sm text-secondary">{lightbox.caption || lightbox.alt || 'Academic activity'}</p>
          </div>
        </div>
      )}
    </Section>
  );
};

export default AcademicActivitiesPage;
