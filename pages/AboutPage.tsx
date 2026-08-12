import React from 'react';
import Section from '../components/Section';
import { UserIcon } from '../components/icons';
import { asset } from '../src/lib/assets';
import { SITE } from '../constants';

const AboutPage: React.FC = () => {
  const academicStatementParagraphs = [
    'Hua-Xu Zhong works at the meeting point of technology, education, and practical artificial intelligence. He studies what actually happens when educational technologies and AI systems are put into use.',
    'His academic path began with an interdisciplinary undergraduate program. He came in hoping that mixed knowledge and technical integration could address real educational problems. The training widened his view, but it did not fully prepare him for the practical demands of the field. Even with a solid grasp of instructional theory and media design, he kept meeting a gap between theory and problem-solving. He tried programming as a career path, then found that his technical limits made it hard to go deeper. What stayed with him was simpler: knowledge and tools are not enough. You have to see the problem clearly, then turn theory into something you can actually do.',
    'During his master\'s studies, Hua-Xu returned to a core question: Can education actually solve real problems? Courses on information literacy and media education showed him that education is not only about transmitting knowledge. It is about comprehension and changing how people think. Through work on innovation, change, and management, he encountered design thinking, which gave him a way to put creativity and technology into educational settings. That shift did not come from abstract ideals. It came from what he saw in real learning environments, where technology\'s accelerating effect was hard to miss. He saw how innovation and digital tools could open new opportunities for learners.',
    '“Education is no longer just a tool for meeting needs. It is a systemic force capable of accelerating change.”',
    'That insight redirected his academic path. It is why he continues to work on educational technology and learning design.',
    'Outside of academia, Hua-Xu enjoys traveling, writing, listening to music, and playing basketball. He values every meaningful moment and refuses to waste time. He wants to build educational technology systems from his background in education, and to work seriously with large language models. He knows this era can empower people, and it can also overwhelm them. So he designs inquiry-based and exploratory learning frameworks that help students develop their potential, not only to survive the future, but to shape it. He is also a scholar who likes learning across disciplines, and he looks for ideas from other fields that can spark new work.',
  ];

  const quoteToEmphasize =
    '“Education is no longer just a tool for meeting needs. It is a systemic force capable of accelerating change.”';

  return (
    <Section
      title="About"
      eyebrow="Statement"
      subtitle="Academic journey and vision"
      className="bg-background"
    >
      <div className="surface-card overflow-hidden bg-card">
        <div className="grid items-stretch lg:grid-cols-12">
          <div className="bg-muted lg:col-span-5">
            <img
              src={asset('IMG/2.jpg')}
              alt={SITE.name}
              className="h-full min-h-[280px] w-full object-cover"
              loading="lazy"
            />
          </div>
          <div className="p-6 md:p-10 lg:col-span-7">
            <div className="mb-5 flex items-center">
              <UserIcon className="mr-3 h-7 w-7 flex-shrink-0 text-primary" />
              <h3 className="font-sans text-2xl font-semibold text-primary">Personal academic statement</h3>
            </div>
            <div className="space-y-4 text-justify leading-relaxed text-secondary">
              {academicStatementParagraphs.map((paragraph, index) =>
                paragraph === quoteToEmphasize ? (
                  <blockquote
                    key={index}
                    className="my-6 rounded-r-lg border-l-4 border-accent bg-gold-tint p-4 font-serif text-lg text-primary italic"
                  >
                    {paragraph}
                  </blockquote>
                ) : (
                  <p key={index}>{paragraph}</p>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
};

export default AboutPage;
