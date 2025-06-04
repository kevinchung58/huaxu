
import React from 'react';
import Section from '../components/Section';
import Card from '../components/Card';
import { ACADEMIC_SERVICE_DATA } from '../constants';
import { ServiceItem } from '../types';
import { UsersIcon, CalendarIcon } from '../components/icons';

const renderJournalReviewDetails = (details: string) => {
  const lines = details.split('\n');
  const elements: JSX.Element[] = [];
  let currentListItems: string[] = [];

  lines.forEach((line) => {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('- ')) {
          currentListItems.push(trimmedLine.substring(2).trim());
      } else {
          if (currentListItems.length > 0) {
              elements.push(
                  <ul key={`ul-${elements.length}`} className="list-disc list-inside text-slate-700 space-y-1.5 pl-5 mb-2 mt-2">
                      {currentListItems.map((item, itemIndex) => (
                          <li key={itemIndex}>{item}</li>
                      ))}
                  </ul>
              );
              currentListItems = []; // Reset for next potential list
          }
          if (trimmedLine !== '') { // Render non-empty lines that are not list items as paragraphs
              elements.push(<p key={`p-${elements.length}`} className="text-slate-700 mb-2">{line}</p>);
          }
      }
  });

  // If the details end with list items
  if (currentListItems.length > 0) {
      elements.push(
          <ul key={`ul-${elements.length}`} className="list-disc list-inside text-slate-700 space-y-1.5 pl-5 mb-2 mt-2">
              {currentListItems.map((item, itemIndex) => (
                  <li key={itemIndex}>{item}</li>
              ))}
          </ul>
      );
  }
  return elements;
};


const AcademicServicePage: React.FC = () => {
  const serviceCategories: { title: string, type: ServiceItem['type'][] }[] = [
    { title: '期刊與會議審稿 (Journal & Conference Reviewing)', type: ['Journal Reviewing', 'Conference Reviewing'] },
    { title: '學術期刊編輯職務 (Editorial Roles)', type: ['Editorial Role'] },
    { title: '學術委員會服務 (Committee Service)', type: ['Committee Service'] },
    { title: '學術會議組織 (Conference Organization)', type: ['Conference Organization'] },
    { title: '學生指導 (Student Mentoring)', type: ['Student Mentoring'] },
    { title: '學術推廣 (Academic Outreach)', type: ['Academic Outreach'] },
  ];

  return (
    <div className="animate-fadeIn">
      <Section title="學術服務與社群 (Academic Service & Community)" subtitle="Contributing to the Growth of Our Field" className="bg-white">
        {serviceCategories.map(category => {
          const items = ACADEMIC_SERVICE_DATA.filter(item => category.type.includes(item.type));
          if (items.length === 0) return null;

          return (
            <div key={category.title} className="mb-12">
              <h3 className="text-2xl font-semibold text-sky-600 mb-6 flex items-center">
                <UsersIcon className="w-7 h-7 mr-3"/> {category.title}
              </h3>
              <div className="space-y-4">
                {items.map((item: ServiceItem) => (
                  <Card key={item.id} className="bg-slate-50">
                    {item.type === 'Journal Reviewing' ? (
                      <div>{renderJournalReviewDetails(item.details)}</div>
                    ) : (
                      <p className="text-slate-700 font-medium">{item.details}</p>
                    )}
                    {item.period && (
                      <p className="text-sm text-slate-600 mt-1 flex items-center">
                        <CalendarIcon className="w-4 h-4 mr-1.5 text-sky-600" /> {item.period}
                      </p>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
         {ACADEMIC_SERVICE_DATA.length === 0 && (
            <p className="text-slate-600 text-center italic">No academic service activities listed yet.</p>
        )}
      </Section>
    </div>
  );
};

export default AcademicServicePage;