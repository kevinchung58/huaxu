import React, { useMemo, useState } from 'react';
import Section from '../components/Section';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import { PROJECTS_DATA, PUBLICATIONS_DATA } from '../constants';
import { Publication, ResearchProject } from '../types';
import {
  BookOpenIcon,
  BriefcaseIcon,
  CalendarIcon,
  CheckIcon,
  ClipboardCopyIcon,
  LinkIcon,
} from '../components/icons';
import { isFilled } from '../src/lib/content';

const PublicationItem: React.FC<{ pub: Publication; itemNumber: number }> = ({ pub, itemNumber }) => {
  const [showBibtex, setShowBibtex] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyBibtex = () => {
    if (!pub.bibtex) return;
    navigator.clipboard.writeText(pub.bibtex).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    });
  };

  const renderAuthors = (authors: string) =>
    authors.split(/(Zhong, Hua-Xu)/gi).map((part, index) =>
      part.toLowerCase() === 'zhong, hua-xu' ? (
        <strong key={index} className="text-foreground">
          {part}
        </strong>
      ) : (
        part
      )
    );

  return (
    <article className="surface-card mb-4 bg-card p-5">
      <div className="flex items-start gap-4">
        <BookOpenIcon className="mt-1 h-5 w-5 flex-shrink-0 text-accent" />
        <div className="min-w-0">
          <h4 className="font-serif text-lg font-semibold text-primary">
            {itemNumber}. {pub.title}
          </h4>
          <p className="mt-1 text-sm text-muted-fg italic">{renderAuthors(pub.authors)}</p>
          <p className="mt-1 text-sm text-secondary">
            {pub.source} ({pub.year})
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
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
  const publicationTypes: Publication['type'][] = ['Journal', 'Conference', 'Book', 'Book Chapter'];
  const [activeType, setActiveType] = useState<Publication['type'] | 'All'>('All');

  const visiblePubs = useMemo(() => {
    const list =
      activeType === 'All' ? PUBLICATIONS_DATA : PUBLICATIONS_DATA.filter((item) => item.type === activeType);
    return [...list].sort((a, b) => b.year - a.year);
  }, [activeType]);

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
            <BookOpenIcon className="mr-3 h-7 w-7 text-accent" /> Publications
          </h3>
          <div className="mb-6 flex flex-wrap gap-2">
            {(['All', ...publicationTypes] as const).map((type) => {
              const count =
                type === 'All' ? PUBLICATIONS_DATA.length : PUBLICATIONS_DATA.filter((item) => item.type === type).length;
              if (type !== 'All' && count === 0) return null;
              const selected = activeType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setActiveType(type)}
                  className={`cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-200 ${
                    selected ? 'bg-primary text-on-primary' : 'bg-card text-secondary ring-1 ring-border hover:bg-muted'
                  }`}
                >
                  {type} ({count})
                </button>
              );
            })}
          </div>
          {visiblePubs.map((pub, index) => (
            <PublicationItem key={pub.id} pub={pub} itemNumber={index + 1} />
          ))}
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
    </div>
  );
};

export default ResearchPage;
