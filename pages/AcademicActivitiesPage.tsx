
import React from 'react';
import Section from '../components/Section';
import Card from '../components/Card';
import Carousel from '../components/Carousel';

import { ACADEMIC_ACTIVITIES_DATA, CAROUSEL_SLIDES_DATA } from '../constants';
import { AcademicActivity } from '../types';
import { PresentationChartBarIcon, CalendarIcon, LocationIcon, LinkIcon, SparklesIcon } from '../components/icons';

const ActivityItem: React.FC<{ activity: AcademicActivity }> = ({ activity }) => (
  <Card className="mb-4 bg-white flex flex-col justify-between">
    <div>
      <h4 className="text-md font-semibold text-sky-600">{activity.title || activity.eventName}</h4>
      {activity.title && activity.eventName !== "N/A" && <p className="text-sm text-slate-600">{activity.eventName}</p>}
      {activity.title && activity.eventName === "N/A" && activity.title !== "N/A" && <p className="text-sm text-slate-600">{activity.eventName}</p>} 
      
      <div className="text-xs text-slate-500 mt-1 space-y-0.5">
        <p className="flex items-center"><CalendarIcon className="w-3.5 h-3.5 mr-1.5 text-sky-600" /> {activity.date}</p>
        <p className="flex items-center"><LocationIcon className="w-3.5 h-3.5 mr-1.5 text-sky-600" /> {activity.location}</p>
        {activity.role && activity.role !== "N/A" && <p>Role: {activity.role}</p>}
      </div>
    </div>
    {(activity.slidesUrl || activity.posterUrl) && (
    <div className="mt-3 pt-3 border-t border-slate-200 flex flex-wrap gap-3 items-center">
      {activity.slidesUrl && (
        <a href={activity.slidesUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-sky-600 hover:text-sky-700 flex items-center">
          <LinkIcon className="w-3 h-3 mr-1" /> Slides
        </a>
      )}
      {activity.posterUrl && (
        <a href={activity.posterUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-sky-600 hover:text-sky-700 flex items-center">
          <LinkIcon className="w-3 h-3 mr-1" /> Poster
        </a>
      )}
      {/* "View Photos" button removed */}
    </div>
    )}
  </Card>
);

const AcademicActivitiesPage: React.FC = () => {

  const activityTypes: { title: string, type: AcademicActivity['type'][], isPresentationSection?: boolean }[] = [
    { title: '學術演講與報告 (Presentations & Talks)', type: ['Invited Talk', 'Conference Oral Presentation', 'Poster Presentation'], isPresentationSection: true },
    { title: '學術會議參與 (Conference Attendance)', type: ['Conference Attendance'] },
    { title: '研討會與工作坊 (Seminars & Workshops)', type: ['Seminar/Workshop'] },
    { title: '公開講座/科普活動 (Public Lectures/Outreach Events)', type: ['Public Lecture'] },
  ];

  return (
    <div className="animate-fadeIn">
      <Section title="學術活動 (Academic Activities)" subtitle="Engaging with the Global Academic Community" className="bg-slate-50">

        {/* Featured Activities Carousel */}
        <div className="mb-16">
          <h3 className="text-2xl font-semibold text-sky-600 mb-6 flex items-center">
            <SparklesIcon className="w-7 h-7 mr-3 text-yellow-400"/> 精選活動展示 (Featured Activities)
          </h3>
          {CAROUSEL_SLIDES_DATA.length > 0 ? (
            <Carousel slides={CAROUSEL_SLIDES_DATA} autoPlayInterval={6000} />
          ) : (
            <p className="text-slate-600 text-center">No featured activities to display in carousel.</p>
          )}
        </div>
        
        {activityTypes.map(section => {
          const activities = ACADEMIC_ACTIVITIES_DATA.filter(act => section.type.includes(act.type));
          if (activities.length === 0 && !section.title.includes("公開講座")) return null;

          return (
            <div key={section.title} className="mb-12">
              <h3 className="text-2xl font-semibold text-sky-600 mb-6 flex items-center">
                <PresentationChartBarIcon className="w-7 h-7 mr-3"/> {section.title}
              </h3>
              {activities.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-6">
                  {activities.map(activity => (
                    <ActivityItem 
                      key={activity.id} 
                      activity={activity} 
                    />
                  ))}
                </div>
              ) : (
                <p className="text-slate-600 italic">No activities listed for this category yet.</p>
              )}
            </div>
          );
        })}
      </Section>

    </div>
  );
};

export default AcademicActivitiesPage;
