import React from 'react';
import Section from '../components/Section';
import Card from '../components/Card';
import Carousel from '../components/Carousel';
import EmptyState from '../components/EmptyState';
import { ACADEMIC_ACTIVITIES_DATA, CAROUSEL_SLIDES_DATA } from '../constants';
import { AcademicActivity } from '../types';
import { CalendarIcon, LinkIcon, LocationIcon, PresentationChartBarIcon, SparklesIcon } from '../components/icons';
import { isFilled } from '../src/lib/content';

const ActivityItem: React.FC<{ activity: AcademicActivity }> = ({ activity }) => (
  <Card className="flex h-full flex-col justify-between bg-card">
    <div>
      <h4 className="font-serif text-lg font-semibold text-primary">{activity.title || activity.eventName}</h4>
      {isFilled(activity.title) && isFilled(activity.eventName) && (
        <p className="text-sm text-muted-fg">{activity.eventName}</p>
      )}
      <div className="mt-2 space-y-1 text-xs text-muted-fg">
        {isFilled(activity.date) && (
          <p className="flex items-center">
            <CalendarIcon className="mr-1.5 h-3.5 w-3.5 text-accent" /> {activity.date}
          </p>
        )}
        {isFilled(activity.location) && (
          <p className="flex items-center">
            <LocationIcon className="mr-1.5 h-3.5 w-3.5 text-accent" /> {activity.location}
          </p>
        )}
        {isFilled(activity.role) && <p>Role: {activity.role}</p>}
      </div>
    </div>
    {(activity.slidesUrl || activity.posterUrl) && (
      <div className="mt-3 flex flex-wrap gap-3 border-t border-border pt-3">
        {activity.slidesUrl && (
          <a
            href={activity.slidesUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex cursor-pointer items-center text-xs text-accent hover:text-accent-soft"
          >
            <LinkIcon className="mr-1 h-3 w-3" /> Slides
          </a>
        )}
        {activity.posterUrl && (
          <a
            href={activity.posterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex cursor-pointer items-center text-xs text-accent hover:text-accent-soft"
          >
            <LinkIcon className="mr-1 h-3 w-3" /> Poster
          </a>
        )}
      </div>
    )}
  </Card>
);

const AcademicActivitiesPage: React.FC = () => {
  const activityTypes: { title: string; type: AcademicActivity['type'][] }[] = [
    {
      title: 'Presentations & talks',
      type: ['Invited Talk', 'Conference Oral Presentation', 'Poster Presentation'],
    },
    { title: 'Conference attendance', type: ['Conference Attendance'] },
    { title: 'Seminars & workshops', type: ['Seminar/Workshop'] },
    { title: 'Public lectures', type: ['Public Lecture'] },
  ];

  const featuredSlides = CAROUSEL_SLIDES_DATA.filter((slide) => isFilled(slide.imageUrl));

  return (
    <Section
      title="Academic activities"
      eyebrow="Community"
      subtitle="Talks, posters, and gatherings with the research community."
      className="bg-muted/40"
    >
      <div className="mb-16">
        <h3 className="mb-6 flex items-center font-serif text-2xl font-semibold text-primary">
          <SparklesIcon className="mr-3 h-7 w-7 text-accent" /> Featured
        </h3>
        {featuredSlides.length > 0 ? (
          <Carousel slides={featuredSlides} autoPlayInterval={6000} />
        ) : (
          <EmptyState
            title="Photo gallery coming soon"
            description="Conference and workshop photographs will appear in this carousel once they are archived."
          />
        )}
      </div>

      {activityTypes.map((section) => {
        const activities = ACADEMIC_ACTIVITIES_DATA.filter(
          (act) => section.type.includes(act.type) && (isFilled(act.title) || isFilled(act.eventName))
        );

        return (
          <div key={section.title} className="mb-12">
            <h3 className="mb-6 flex items-center font-serif text-2xl font-semibold text-primary">
              <PresentationChartBarIcon className="mr-3 h-7 w-7 text-accent" /> {section.title}
            </h3>
            {activities.length > 0 ? (
              <div className="grid gap-5 md:grid-cols-2">
                {activities.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </div>
            ) : (
              <EmptyState
                title={`No ${section.title.toLowerCase()} listed yet`}
                description="Titles, venues, and dates will populate this section. The card layout is already in place for talks, posters, and workshops."
              />
            )}
          </div>
        );
      })}
    </Section>
  );
};

export default AcademicActivitiesPage;
