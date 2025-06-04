import React from 'react';
import Section from '../components/Section';
import Card from '../components/Card';
import { COURSES_DATA } from '../constants';
import { Course } from '../types';
import { AcademicCapIcon, LightBulbIcon, LinkIcon, ExternalLinkIcon } from '../components/icons';

const TeachingPage: React.FC = () => {
  const teachingWebsiteUrl = "#"; // Replace with your actual teaching website URL

  const teachingPhilosophyParagraphs = [
    "I believe that education is not the transfer of information, but the transformation of the learner.",
    "At the heart of my teaching is the belief that students are not empty vessels, but active agents capable of inquiry, creativity, and reflection. My role is to design spaces where students pose meaningful questions, explore real-world problems, and develop the confidence to navigate ambiguity. I draw on principles of constructivist learning, guiding students to construct knowledge through experience, collaboration, and experimentation.",
    "I emphasize creative problem-solving over rote solutions, because I see education as preparation for complexity—not certainty. In this process, failure is not something to be avoided, but a necessary condition for growth. Design thinking, open-ended inquiry, and playful exploration are central to how I help students engage with problems that don’t have clear answers.",
    "Yet I also recognize that students encounter barriers—whether cognitive, emotional, or situational. When human support reaches its limit, I turn to personalized learning with large language models (LLMs). These tools extend access to feedback, ideas, and scaffolding, allowing students to keep moving forward in their learning journey. For me, LLMs are not a replacement for human teaching, but a responsive support system—a bridge between learners and possibility.",
    "Ultimately, I teach because I believe in education as a form of liberation—one that empowers individuals not just to adapt to the world, but to imagine and build better ones."
  ];

  return (
    <div className="animate-fadeIn">
      <Section title="教學與實踐 (Teaching & Practice)" subtitle="Fostering Knowledge and Inspiring Minds" className="bg-white">
        
        {/* Teaching Philosophy */}
        <div className="mb-12">
            <Card className="bg-slate-50">
                <div className="flex items-center mb-4">
                    <LightBulbIcon className="w-8 h-8 mr-3 text-yellow-400" />
                    <h3 className="text-2xl font-semibold text-sky-600">教學理念 (Teaching Philosophy)</h3>
                </div>
                <div className="space-y-4 text-slate-700 leading-relaxed">
                  {teachingPhilosophyParagraphs.map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
            </Card>
        </div>

        {/* Courses Taught */}
        <div className="mb-12">
          <h3 className="text-2xl font-semibold text-sky-600 mb-6 flex items-center">
            <AcademicCapIcon className="w-7 h-7 mr-3"/> 開設課程 (Courses Taught)
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {COURSES_DATA.map((course: Course) => (
              <Card key={course.id} title={course.name} subtitle={course.code} className="bg-slate-50">
                <p className="text-sm text-slate-600 mb-1"><strong>Semester:</strong> {course.semester}</p>
                {course.description && <p className="text-sm text-slate-700 mb-3">{course.description}</p>}
                {course.syllabusUrl && (
                  <a
                    href={course.syllabusUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-sky-600 hover:text-sky-700 transition-colors"
                  >
                    <LinkIcon className="w-4 h-4 mr-1" />
                    View Syllabus
                  </a>
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* Teaching Website Link */}
        <div>
          <h3 className="text-2xl font-semibold text-sky-600 mb-4">教學網站 (Teaching Website)</h3>
          <p className="text-slate-600 mb-6">
            For more detailed course materials, resources, and announcements, please visit my dedicated teaching website.
          </p>
          <a
            href={teachingWebsiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 px-8 rounded-lg shadow-md transition-transform hover:scale-105 transform"
          >
            <ExternalLinkIcon className="w-5 h-5 mr-2" />
            訪問教學網站主頁 (Visit Teaching Homepage)
          </a>
        </div>
      </Section>
    </div>
  );
};

export default TeachingPage;