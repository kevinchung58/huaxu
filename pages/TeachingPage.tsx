import React from 'react';
import Section from '../components/Section';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import { COURSES_DATA } from '../constants';
import { Course } from '../types';
import { AcademicCapIcon, ExternalLinkIcon, LightBulbIcon, LinkIcon } from '../components/icons';
import { isFilled } from '../src/lib/content';

const TeachingPage: React.FC = () => {
  const teachingWebsiteUrl = '#';
  const courses = COURSES_DATA.filter((course) => isFilled(course.name));

  const teachingPhilosophyParagraphs = [
    'I believe education is not the transfer of information. It is the transformation of the learner.',
    'I treat students as people who can inquire, create, and reflect, not as empty vessels. My job is to design spaces where they ask real questions, work on real problems, and get used to ambiguity. I draw on constructivist learning: students build knowledge through experience, collaboration, and experiment.',
    'I emphasize creative problem-solving over rote answers, because I see education as preparation for complexity, not certainty. Failure is not something to avoid. It is how growth happens. Design thinking, open-ended inquiry, and playful exploration are how I help students work on problems that do not have clear answers.',
    'Students also hit barriers, cognitive, emotional, or situational. When human support runs out, I use large language models for personalized learning. They extend access to feedback, ideas, and scaffolding so students can keep going. For me, LLMs do not replace human teaching. They are a support system between the learner and what they might do next.',
    'I teach because I believe education can be a form of liberation. It should help people imagine and build better worlds, not only adapt to the one they have.',
  ];

  return (
    <Section
      title="Teaching & practice"
      eyebrow="Classroom"
      subtitle="Inquiry, creativity, and careful use of AI."
      className="bg-background"
    >
      <div className="mb-14">
        <Card hoverEffect={false} className="bg-gold-tint/50">
          <div className="mb-4 flex items-center">
            <LightBulbIcon className="mr-3 h-8 w-8 text-primary" />
            <h3 className="font-sans text-2xl font-semibold text-primary">Teaching philosophy</h3>
          </div>
          <div className="space-y-4 leading-relaxed text-secondary">
            {teachingPhilosophyParagraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </Card>
      </div>

      <div className="mb-14">
        <h3 className="mb-6 flex items-center font-sans text-2xl font-semibold text-primary">
          <AcademicCapIcon className="mr-3 h-7 w-7 text-primary" /> Courses taught
        </h3>
        {courses.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course: Course) => (
              <Card key={course.id} title={course.name} subtitle={course.code} className="bg-card">
                {isFilled(course.semester) && (
                  <p className="mb-1 text-sm">
                    <strong>Semester:</strong> {course.semester}
                  </p>
                )}
                {isFilled(course.description) && <p className="mb-3 text-sm">{course.description}</p>}
                {course.syllabusUrl && (
                  <a
                    href={course.syllabusUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex cursor-pointer items-center text-sm text-accent hover:text-accent-soft"
                  >
                    <LinkIcon className="mr-1 h-4 w-4" />
                    View syllabus
                  </a>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<AcademicCapIcon className="h-6 w-6" />}
            title="Course list in preparation"
            description="Syllabi and semester offerings will live in this grid. The philosophy above is current; formal course records will be added when teaching appointments are listed."
          />
        )}
      </div>

      {teachingWebsiteUrl && teachingWebsiteUrl !== '#' && (
        <div>
          <h3 className="mb-3 font-serif text-2xl font-semibold text-primary">Teaching website</h3>
          <p className="mb-6 text-muted-fg">
            For course materials, resources, and announcements, visit the dedicated teaching site.
          </p>
          <a href={teachingWebsiteUrl} target="_blank" rel="noopener noreferrer" className="btn-primary">
            <ExternalLinkIcon className="h-5 w-5" />
            Visit teaching homepage
          </a>
        </div>
      )}
    </Section>
  );
};

export default TeachingPage;
