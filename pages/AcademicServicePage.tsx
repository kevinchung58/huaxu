import React from 'react';
import Section from '../components/Section';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import { ACADEMIC_SERVICE_DATA } from '../constants';
import { ServiceItem } from '../types';
import { CalendarIcon, UsersIcon } from '../components/icons';

const renderJournalReviewDetails = (details: string) => {
  const lines = details.split('\n');
  const elements: React.ReactNode[] = [];
  let currentListItems: string[] = [];

  const flushList = () => {
    if (currentListItems.length === 0) return;
    elements.push(
      <ul key={`ul-${elements.length}`} className="mt-3 mb-2 list-disc space-y-1.5 pl-5 text-secondary">
        {currentListItems.map((item, itemIndex) => (
          <li key={itemIndex}>{item}</li>
        ))}
      </ul>
    );
    currentListItems = [];
  };

  lines.forEach((line) => {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('- ')) {
      currentListItems.push(trimmedLine.substring(2).trim());
    } else {
      flushList();
      if (trimmedLine !== '') {
        elements.push(
          <p key={`p-${elements.length}`} className="mb-2 text-secondary">
            {line}
          </p>
        );
      }
    }
  });
  flushList();
  return elements;
};

const AcademicServicePage: React.FC = () => {
  const serviceCategories: { title: string; type: ServiceItem['type'][] }[] = [
    { title: 'Journal & conference reviewing', type: ['Journal Reviewing', 'Conference Reviewing'] },
    { title: 'Editorial roles', type: ['Editorial Role'] },
    { title: 'Committee service', type: ['Committee Service'] },
    { title: 'Conference organization', type: ['Conference Organization'] },
    { title: 'Student mentoring', type: ['Student Mentoring'] },
    { title: 'Academic outreach', type: ['Academic Outreach'] },
  ];

  return (
    <Section
      title="Academic service"
      eyebrow="Community"
      subtitle="Reviewing and other contributions to the field."
      className="bg-background"
    >
      {serviceCategories.map((category) => {
        const items = ACADEMIC_SERVICE_DATA.filter((item) => category.type.includes(item.type));
        return (
          <div key={category.title} className="mb-12">
            <h3 className="mb-6 flex items-center font-serif text-2xl font-semibold text-primary">
              <UsersIcon className="mr-3 h-7 w-7 text-accent" /> {category.title}
            </h3>
            {items.length > 0 ? (
              <div className="space-y-4">
                {items.map((item: ServiceItem) => (
                  <Card key={item.id} hoverEffect={false} className="bg-card">
                    {item.type === 'Journal Reviewing' ? (
                      <div>{renderJournalReviewDetails(item.details)}</div>
                    ) : (
                      <p className="font-medium text-secondary">{item.details}</p>
                    )}
                    {item.period && (
                      <p className="mt-2 flex items-center text-sm text-muted-fg">
                        <CalendarIcon className="mr-1.5 h-4 w-4 text-accent" /> {item.period}
                      </p>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                title={`${category.title} will be listed here`}
                description="This category is ready for editorial roles, committees, or mentoring notes when they are available."
              />
            )}
          </div>
        );
      })}
    </Section>
  );
};

export default AcademicServicePage;
