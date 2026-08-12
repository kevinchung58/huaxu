import React, { useMemo, useState } from 'react';
import Section from '../components/Section';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import PublicationFigureModal from '../components/PublicationFigureModal';
import { PROJECTS_DATA, PUBLICATIONS_DATA } from '../constants';
import { Publication, ResearchProject } from '../types';
import {
  BookOpenIcon,
  BriefcaseIcon,
  CalendarIcon,
  CheckIcon,
  ClipboardCopyIcon,
  LinkIcon,
  SparklesIcon,
} from '../components/icons';
import { isFilled } from '../src/lib/content';

const highlightAuthors = (authors: string) =>
  authors.split(/(Zhong, Hua-Xu)/gi).map((part, index) =>
    part.toLowerCase() === 'zhong, hua-xu' ? (
      <strong key={index} className="text-foreground">
        {part}
      </strong>
    ) : (
      part
    )
  );

const PublicationItem: React.FC<{
  pub: Publication;
  itemNumber: number;
  onOpenFeatured?: (pub: Publication) => void;
}> = ({ pub, itemNumber, onOpenFeatured }) => {
  const [showBibtex, setShowBibtex] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyBibtex = () => {
    if (!pub.bibtex) return;
    navigator.clipboard.writeText(pub.bibtex).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <article
      className={`mb-4 p-5 ${pub.featured ? 'rounded-[var(--radius-card)] border-2 border-accent/40 bg-gold-tint/50 shadow-[var(--shadow-soft)]' : 'surface-card bg-card'}`}
    >
      <div className="flex items-start gap-4">
        <BookOpenIcon className="mt-1 h-5 w-5 flex-shrink-0 text-accent" />
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap gap-2">
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-secondary">{pub.year}</span>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">{pub.type}</span>
            {pub.featured && (
              <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-semibold text-accent">
                ★ Featured
              </span>
            )}
            {pub.correspondingAuthor && (
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                Corresponding author
              </span>
            )}
          </div>
          <h4 className="font-serif text-lg font-semibold text-primary">
            {pub.featured && onOpenFeatured ? (
              <button
                type="button"
                onClick={() => onOpenFeatured(pub)}
                className="cursor-pointer text-left transition-colors duration-200 hover:text-accent"
              >
                {itemNumber}. {pub.title}
              </button>
            ) : (
              <>
                {itemNumber}. {pub.title}
              </>
            )}
          </h4>
          <p className="mt-1 text-sm text-muted-fg italic">{highlightAuthors(pub.authors)}</p>
          <p className="mt-1 text-sm text-secondary">
            {pub.source} ({pub.year})
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {pub.featured && onOpenFeatured && (
              <button
                type="button"
                onClick={() => onOpenFeatured(pub)}
                className="cursor-pointer text-xs font-medium text-accent hover:text-accent-soft"
              >
                View figure
              </button>
            )}
            {pub.doi && (
              <a
                href={`https://doi.org/${pub.doi}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex cursor-pointer items-center text-xs font-medium text-accent hover:text-accent-soft"
              >
                <LinkIcon className="mr-1 h-3 w-3" /> DOI
              </a>
            )}
            {pub.url && (
              <a
                href={pub.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex cursor-pointer items-center text-xs font-medium text-accent hover:text-accent-soft"
              >
                <LinkIcon className="mr-1 h-3 w-3" /> Official link
              </a>
            )}
            {pub.bibtex && (
              <button
                type="button"
                onClick={() => setShowBibtex(!showBibtex)}
                className="cursor-pointer text-xs font-medium text-accent hover:text-accent-soft"
              >
                BibTeX
              </button>
            )}
          </div>
          {showBibtex && pub.bibtex && (
            <div className="relative mt-3 rounded-lg border border-border bg-muted p-3 text-xs text-secondary">
              <code className="whitespace-pre-wrap">{pub.bibtex}</code>
              <button
                type="button"
                onClick={handleCopyBibtex}
                className="absolute top-2 right-2 cursor-pointer rounded bg-primary p-1 text-white hover:bg-primary-soft"
                title="Copy BibTeX"
              >
                {copied ? <CheckIcon className="h-4 w-4" /> : <ClipboardCopyIcon className="h-4 w-4" />}
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

const ResearchPage: React.FC = () => {
  const [activeType, setActiveType] = useState<'All' | 'Journal' | 'Conference'>('All');
  const [openFeatured, setOpenFeatured] = useState<Publication | null>(null);

  const featured = useMemo(() => PUBLICATIONS_DATA.filter((item) => item.featured), []);

  const visiblePubs = useMemo(() => {
    const list =
      activeType === 'All' ? PUBLICATIONS_DATA : PUBLICATIONS_DATA.filter((item) => item.type === activeType);
    return [...list].sort((a, b) => b.year - a.year || a.title.localeCompare(b.title));
  }, [activeType]);

  const years = useMemo(() => Array.from(new Set(visiblePubs.map((item) => item.year))).sort((a, b) => b - a), [visiblePubs]);

  const journalCount = PUBLICATIONS_DATA.filter((item) => item.type === 'Journal').length;
  const conferenceCount = PUBLICATIONS_DATA.filter((item) => item.type === 'Conference').length;

  const projectsByStatus = (['Ongoing', 'Completed'] as ResearchProject['status'][]).map((status) => ({
    status,
    items: PROJECTS_DATA.filter((project) => project.status === status && isFilled(project.name)),
  }));

  return (
    <div>
      <Section
        title="Research"
        eyebrow="Output"
        subtitle="Publications and projects in educational technology, AI learning platforms, and design-based instruction."
        className="bg-muted/40"
      >
        <div className="mb-16">
          <h3 className="mb-5 flex items-center font-serif text-2xl font-semibold text-primary">
            <SparklesIcon className="mr-3 h-7 w-7 text-accent" /> Featured papers
          </h3>
          <div className="mb-12 grid gap-5 md:grid-cols-2">
            {featured.map((pub) => (
              <button
                key={pub.id}
                type="button"
                onClick={() => setOpenFeatured(pub)}
                className="surface-card-hover cursor-pointer border-2 border-accent/30 bg-gold-tint/40 p-5 text-left"
              >
                <div className="mb-2 flex flex-wrap gap-2">
                  <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-semibold text-accent">
                    ★ Featured
                  </span>
                  {pub.correspondingAuthor && (
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                      Corresponding author
                    </span>
                  )}
                </div>
                <h4 className="font-serif text-lg font-semibold text-primary">{pub.title}</h4>
                <p className="mt-2 text-sm text-muted-fg italic">{highlightAuthors(pub.authors)}</p>
                <p className="mt-1 text-sm text-secondary">{pub.source}</p>
                <p className="mt-3 text-xs font-medium text-accent">Open figure →</p>
              </button>
            ))}
          </div>

          <h3 className="mb-5 flex items-center font-serif text-2xl font-semibold text-primary">
            <BookOpenIcon className="mr-3 h-7 w-7 text-accent" /> Publications
          </h3>
          <div className="mb-8 flex flex-wrap gap-2">
            {(
              [
                { id: 'All', label: `All (${PUBLICATIONS_DATA.length})` },
                { id: 'Journal', label: `Journal (${journalCount})` },
                { id: 'Conference', label: `Conference (${conferenceCount})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveType(tab.id)}
                className={`cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-200 ${
                  activeType === tab.id
                    ? 'bg-primary text-on-primary'
                    : 'bg-card text-secondary ring-1 ring-border hover:bg-muted'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {years.map((year) => {
            const yearPubs = visiblePubs.filter((item) => item.year === year);
            return (
              <div key={year} className="mb-10">
                <h4 className="mb-4 border-b border-border pb-2 font-serif text-xl text-primary">
                  {year}
                  <span className="ml-2 font-sans text-sm font-normal text-muted-fg">
                    {yearPubs.length} {yearPubs.length === 1 ? 'publication' : 'publications'}
                  </span>
                </h4>
                {yearPubs.map((pub, index) => (
                  <PublicationItem
                    key={pub.id}
                    pub={pub}
                    itemNumber={index + 1}
                    onOpenFeatured={pub.featured ? setOpenFeatured : undefined}
                  />
                ))}
              </div>
            );
          })}
        </div>

        <div>
          <h3 className="mb-5 flex items-center font-serif text-2xl font-semibold text-primary">
            <BriefcaseIcon className="mr-3 h-7 w-7 text-accent" /> Research projects
          </h3>
          {projectsByStatus.map(({ status, items }) => (
            <div key={status} className="mb-8">
              <h4 className="mb-4 border-b border-border pb-2 text-lg font-medium text-secondary">{status}</h4>
              {items.length > 0 ? (
                <div className="space-y-5">
                  {items.map((proj) => (
                    <Card key={proj.id} title={proj.name} className="bg-card">
                      <p className="mb-1 text-sm">
                        <strong className="text-primary">Role:</strong> {proj.role}
                      </p>
                      {isFilled(proj.funding) && (
                        <p className="mb-1 text-sm">
                          <strong className="text-primary">Funding:</strong> {proj.funding}
                        </p>
                      )}
                      <p className="mb-1 flex items-center text-sm">
                        <CalendarIcon className="mr-1 h-4 w-4 text-accent" />
                        <strong className="mr-1 text-primary">Period:</strong> {proj.period}
                      </p>
                      <p className="mt-2 text-sm">
                        <strong className="text-accent">Goals:</strong> {proj.goals}
                      </p>
                      {isFilled(proj.outcomes) && (
                        <p className="mt-1 text-sm">
                          <strong className="text-accent">Outcomes:</strong> {proj.outcomes}
                        </p>
                      )}
                    </Card>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title={`No ${status.toLowerCase()} projects listed`}
                  description="When a new grant or collaboration starts, it will be recorded in this column with role, period, and outcomes."
                />
              )}
            </div>
          ))}
        </div>
      </Section>

      {openFeatured && <PublicationFigureModal publication={openFeatured} onClose={() => setOpenFeatured(null)} />}
    </div>
  );
};

export default ResearchPage;
