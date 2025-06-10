import React from 'react';
import Section from '../components/Section';
import Card from '../components/Card';
import { UserIcon } from '../components/icons';

const AboutPage: React.FC = () => {
  const academicStatementParagraphs = [
    "Hua-Xu Zhong is passionate about exploring the intersection of technology, education, and the practical application of artificial intelligence. He is deeply engaged in examining the real-world challenges involved in implementing educational technologies and AI-driven systems.",
    "His academic journey began with an interdisciplinary undergraduate program, where he carried a strong sense of hope and ambition—believing that diverse knowledge and technical integration could address real-world educational issues. While this training broadened his perspective, it did not fully equip him to tackle the practical demands of the field. Even with a solid understanding of instructional theories and media design principles, he found a gap between theoretical knowledge and actual problem-solving. At one point, he turned to programming in hopes of carving out a career path. However, he soon realized that his limitations in technical aptitude made it difficult to go deeper. This experience led to an important realization: knowledge and tools alone are not enough—what truly matters is the ability to grasp the essence of problems and transform theory into actionable practice.",
    "During his master's studies, Hua-Xu began to re-evaluate a core question: Can education truly solve real problems? Courses on information literacy and media education helped him understand that education is not merely about transmitting knowledge—it is about fostering comprehension and transforming ways of thinking. More importantly, through studies in innovation, change, and management, he encountered design thinking, which opened up new possibilities for applying creativity and technology in educational contexts. This transformation was not driven by abstract educational ideals, but by what he witnessed in real-world learning environments—places where the accelerating power of technology became undeniably clear. He saw how innovation and digital tools could actively create new opportunities for learners.",
    "“Education is no longer just a tool for meeting needs—it is a systemic force capable of accelerating change.”",
    "This insight marked a turning point in his academic path and laid the foundation for his ongoing commitment to educational technology and learning design research.",
    "Outside of academia, Hua-Xu enjoys traveling, writing, listening to music, and playing basketball. He values every meaningful moment and refuses to waste time. His aspiration is to develop educational technology systems rooted in his educational background, to actively engage with the era of large language models (LLMs). He understands that this era holds the potential to empower individuals, but also the risk of overwhelming them. Therefore, he is committed to designing inquiry-based and exploratory learning frameworks that help students fully develop their potential—not just to survive the future, but to shape it. He is also a scholar eager to learn across disciplines, always willing to explore how perspectives from different fields can inspire innovation."
  ];

  const quoteToEmphasize = "“Education is no longer just a tool for meeting needs—it is a systemic force capable of accelerating change.”";

  return (
    <div className="animate-fadeIn">
      <Section title="關於我 (About Me)" subtitle="My Academic Journey and Vision" className="bg-white">
        <div className="max-w-7xl mx-auto"> {/* Increased max-width for better two-column layout */}
          <Card className="bg-slate-50 p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-stretch">
              {/* Left Column: Image */}
              <div className="md:w-1/2 flex-shrink-0 text-center">
                <img
                  src="/IMG/2.jpg" // 路徑修正，未來 GitHub Pages 會自動加上 base
                  alt="Hua-Xu Zhong"
                  className="rounded-lg shadow-xl w-full mx-auto h-3/4 object-cover"
                  loading="lazy"
                />
              </div>

              {/* Right Column: Academic Statement */}
              <div className="md:w-1/2">
                <div className="flex items-center mb-4">
                  <UserIcon className="w-8 h-8 mr-3 text-sky-600 flex-shrink-0" />
                  <h3 className="text-2xl font-semibold text-sky-600">個人學術論述 (Personal Academic Statement)</h3>
                </div>
                <div className="space-y-4 text-slate-700 leading-relaxed text-justify">
                  {academicStatementParagraphs.map((paragraph, index) => {
                    if (paragraph === quoteToEmphasize) {
                      return (
                        <p key={index} className="font-semibold text-slate-800 italic my-6 p-3 bg-sky-100 border-l-4 border-sky-500 rounded-r-md">
                          {paragraph}
                        </p>
                      );
                    }
                    return <p key={index}>{paragraph}</p>;
                  })}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </Section>
    </div>
  );
};

export default AboutPage;