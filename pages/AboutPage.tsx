import React from 'react';
import Section from '../components/Section';
import { UserIcon } from '../components/icons';
import { asset } from '../src/lib/assets';
import { SITE } from '../constants';

const AboutPage: React.FC = () => {
  const academicStatementParagraphs = [
    'Hua-Xu Zhong is passionate about exploring the intersection of technology, education, and the practical application of artificial intelligence. He is deeply engaged in examining the real-world challenges involved in implementing educational technologies and AI-driven systems.',
    'His academic journey began with an interdisciplinary undergraduate program, where he carried a strong sense of hope and ambition—believing that diverse knowledge and technical integration could address real-world educational issues. While this training broadened his perspective, it did not fully equip him to tackle the practical demands of the field. Even with a solid understanding of instructional theories and media design principles, he found a gap between theoretical knowledge and actual problem-solving. At one point, he turned to programming in hopes of carving out a career path. However, he soon realized that his limitations in technical aptitude made it difficult to go deeper. This experience led to an important realization: knowledge and tools alone are not enough—what truly matters is the ability to grasp the essence of problems and transform theory into actionable practice.',
    'During his master\'s studies, Hua-Xu began to re-evaluate a core question: Can education truly solve real problems? Courses on information literacy and media education helped him understand that education is not merely about transmitting knowledge—it is about fostering comprehension and transforming ways of thinking. More importantly, through studies in innovation, change, and management, he encountered design thinking, which opened up new possibilities for applying creativity and technology in educational contexts. This transformation was not driven by abstract educational ideals, but by what he witnessed in real-world learning environments—places where the accelerating power of technology became undeniably clear. He saw how innovation and digital tools could actively create new opportunities for learners.',
    '“Education is no longer just a tool for meeting needs—it is a systemic force capable of accelerating change.”',
    'This insight marked a turning point in his academic path and laid the foundation for his ongoing commitment to educational technology and learning design research.',
    'Outside of academia, Hua-Xu enjoys traveling, writing, listening to music, and playing basketball. He values every meaningful moment and refuses to waste time. His aspiration is to develop educational technology systems rooted in his educational background, to actively engage with the era of large language models (LLMs). He understands that this era holds the potential to empower individuals, but also the risk of overwhelming them. Therefore, he is committed to designing inquiry-based and exploratory learning frameworks that help students fully develop their potential—not just to survive the future, but to shape it. He is also a scholar eager to learn across disciplines, always willing to explore how perspectives from different fields can inspire innovation.',
  ];

  const quoteToEmphasize =
    '“Education is no longer just a tool for meeting needs—it is a systemic force capable of accelerating change.”';

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
              <UserIcon className="mr-3 h-7 w-7 flex-shrink-0 text-accent" />
              <h3 className="font-serif text-2xl font-semibold text-primary">Personal academic statement</h3>
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
