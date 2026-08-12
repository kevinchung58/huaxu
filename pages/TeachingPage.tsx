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
    'I believe that education is not the transfer of information, but the transformation of the learner.',
    'At the heart of my teaching is the belief that students are not empty vessels, but active agents capable of inquiry, creativity, and reflection. My role is to design spaces where students pose meaningful questions, explore real-world problems, and develop the confidence to navigate ambiguity. I draw on principles of constructivist learning, guiding students to construct knowledge through experience, collaboration, and experimentation.',
    'I emphasize creative problem-solving over rote solutions, because I see education as preparation for complexity—not certainty. In this process, failure is not something to be avoided, but a necessary condition for growth. Design thinking, open-ended inquiry, and playful exploration are central to how I help students engage with problems that don’t have clear answers.',
    'Yet I also recognize that students encounter barriers—whether cognitive, emotional, or situational. When human support reaches its limit, I turn to personalized learning with large language models (LLMs). These tools extend access to feedback, ideas, and scaffolding, allowing students to keep moving forward in their learning journey. For me, LLMs are not a replacement for human teaching, but a responsive support system—a bridge between learners and possibility.',
    'Ultimately, I teach because I believe in education as a form of liberation—one that empowers individuals not just to adapt to the world, but to imagine and build better ones.',
  ];

  return (
    <Section
      title="Teaching & practice"
      eyebrow="Classroom"
      subtitle="Fostering inquiry, creativity, and responsible use of AI."
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
