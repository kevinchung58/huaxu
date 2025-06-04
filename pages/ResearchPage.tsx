import React, { useState } from 'react';
import Section from '../components/Section';
import Card from '../components/Card';
import { PUBLICATIONS_DATA, PROJECTS_DATA } from '../constants';
import { Publication, ResearchProject } from '../types';
import { BookOpenIcon, BriefcaseIcon, LinkIcon, CalendarIcon, ClipboardCopyIcon, CheckIcon } from '../components/icons'; // Replaced SparklesIcon with CheckIcon

const PublicationItem: React.FC<{ pub: Publication; itemNumber: number }> = ({ pub, itemNumber }) => {
  const [showBibtex, setShowBibtex] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyBibtex = () => {
    if (pub.bibtex) {
      navigator.clipboard.writeText(pub.bibtex).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(err => console.error('Failed to copy BibTeX:', err));
    }
  };

  // Helper to make "Zhong, Hua-Xu" bold and black
  const renderAuthors = (authors: string) => {
    const parts = authors.split(/(Zhong, Hua-Xu)/gi);
    return parts.map((part, index) => {
      if (part.toLowerCase() === 'zhong, hua-xu') {
        return <strong key={index} className="text-black">{part}</strong>;
      }
      return part;
    });
  };


  return (
    <Card className="mb-6 bg-white">
      <div className="flex items-start">
        <BookOpenIcon className="w-6 h-6 mr-4 text-sky-600 flex-shrink-0 mt-1" />
        <div>
          <h4 className="text-lg font-semibold text-sky-600">{itemNumber}. {pub.title}</h4>
          <p className="text-sm text-slate-600 italic">{renderAuthors(pub.authors)}</p>
          <p className="text-sm text-slate-600">{pub.source} ({pub.year})</p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 items-center">
            {pub.doi && (
              <a href={`https://doi.org/${pub.doi}`} target="_blank" rel="noopener noreferrer" className="text-xs text-sky-600 hover:text-sky-700 flex items-center">
                <LinkIcon className="w-3 h-3 mr-1" /> DOI
              </a>
            )}
            {pub.url && (
              <a href={pub.url} target="_blank" rel="noopener noreferrer" className="text-xs text-sky-600 hover:text-sky-700 flex items-center">
                <LinkIcon className="w-3 h-3 mr-1" /> Official Link
              </a>
            )}
            {/* PDF Download Link Removed */}
            {pub.bibtex && (
              <button onClick={() => setShowBibtex(!showBibtex)} className="text-xs text-sky-600 hover:text-sky-700 flex items-center">
                BibTeX
              </button>
            )}
          </div>
          {showBibtex && pub.bibtex && (
            <div className="mt-2 p-3 bg-slate-100 rounded text-xs text-slate-700 whitespace-pre-wrap relative border border-slate-200">
              <code>{pub.bibtex}</code>
              <button 
                onClick={handleCopyBibtex}
                className="absolute top-2 right-2 p-1 bg-sky-600 hover:bg-sky-700 rounded text-white"
                title="Copy BibTeX"
              >
                {copied ? <CheckIcon className="w-4 h-4" /> : <ClipboardCopyIcon className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

const ResearchPage: React.FC = () => {
  const publicationTypes: Publication['type'][] = ['Journal', 'Conference', 'Book', 'Book Chapter'];
  const projectStatuses: ResearchProject['status'][] = ['Ongoing', 'Completed'];

  return (
    <div className="animate-fadeIn">
      <Section title="研究成果 (Research)" subtitle="My Contributions to Science and Technology" className="bg-slate-50">
        
        {/* Publications Section */}
        <div className="mb-16">
          <h3 className="text-2xl font-semibold text-sky-600 mb-6 flex items-center">
            <BookOpenIcon className="w-7 h-7 mr-3"/> 出版物 (Publications)
          </h3>
          {publicationTypes.map(type => {
            const filteredPubs = PUBLICATIONS_DATA.filter(p => p.type === type).sort((a, b) => b.year - a.year);
            if (filteredPubs.length === 0) return null;
            return (
              <div key={type} className="mb-8">
                <h4 className="text-xl font-medium text-slate-700 mb-4 border-b border-slate-300 pb-2">{type} Articles</h4>
                {filteredPubs.map((pub, index) => <PublicationItem key={pub.id} pub={pub} itemNumber={index + 1} />)}
              </div>
            );
          })}
        </div>

        {/* Research Projects Section */}
        <div>
          <h3 className="text-2xl font-semibold text-sky-600 mb-6 flex items-center">
            <BriefcaseIcon className="w-7 h-7 mr-3"/> 研究計畫 (Research Projects)
          </h3>
          {projectStatuses.map(status => {
            const filteredProjects = PROJECTS_DATA.filter(p => p.status === status);
            if (filteredProjects.length === 0) return null;
            return (
              <div key={status} className="mb-8">
                <h4 className="text-xl font-medium text-slate-700 mb-4 border-b border-slate-300 pb-2">{status} Projects</h4>
                <div className="space-y-6">
                  {filteredProjects.map(proj => (
                    <Card key={proj.id} title={proj.name} className="bg-white">
                      <p className="text-sm text-slate-600 mb-1"><strong className="text-slate-700">Role:</strong> {proj.role}</p>
                      {proj.funding && <p className="text-sm text-slate-600 mb-1"><strong className="text-slate-700">Funding:</strong> {proj.funding}</p>}
                      <p className="text-sm text-slate-600 mb-1 flex items-center"><CalendarIcon className="w-4 h-4 mr-1 text-sky-600" /> <strong className="text-slate-700">Period:</strong> {proj.period}</p>
                      <p className="mt-2 text-slate-700"><strong className="text-sky-600">Goals:</strong> {proj.goals}</p>
                      {proj.outcomes && <p className="mt-1 text-slate-700"><strong className="text-sky-600">Outcomes:</strong> {proj.outcomes}</p>}
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Section>
    </div>
  );
};

export default ResearchPage;