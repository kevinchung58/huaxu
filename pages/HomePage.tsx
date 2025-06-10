
import React from 'react';
import Section from '../components/Section';
import Card from '../components/Card';
import { LATEST_NEWS_DATA, AWARDS_DATA, EDUCATION_DATA, SOCIAL_LINKS } from '../constants';
import { NewsItem, AwardItem, EducationItem, SocialLink } from '../types';
import { AcademicCapIcon, SparklesIcon, LinkIcon, BriefcaseIcon, CalendarIcon } from '../components/icons'; // Assuming these are created

const HomePage: React.FC = () => {
  const researchInterests = [
    { id: 'ri1', name: 'Educational Technology', description: 'Leveraging innovative technologies to enhance learning experiences, instructional design, and educational outcomes.' },
    { id: 'ri2', name: 'Artificial Intelligence', description: 'Exploring the frontiers of AI, including machine learning, to solve complex problems.' },
    { id: 'ri3', name: 'Creativity and Design Thinking', description: 'Applying design thinking methodologies and fostering creative problem-solving in various domains, particularly in education and technology development.' },
    { id: 'ri4', name: 'AI in Education', description: 'Investigating the application and impact of artificial intelligence in educational settings, personalizing learning, and developing intelligent tutoring systems.' },
  ];

  return (
    <div className="animate-fadeIn">
      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
            <div className="md:w-1/3 flex-shrink-0">
              <img
                src="IMG/1.jpg" // Path confirmed: ensure 'Figure 1.jpg' is in the public root, case-sensitive.
                alt="Hua-Xu Zhong - Professional Photo"
                className="rounded-full shadow-2xl w-64 h-64 md:w-80 md:h-80 object-cover mx-auto border-4 border-sky-500"
                loading="lazy"
              />
            </div>
            <div className="md:w-2/3 text-center md:text-left">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-sky-600 mb-3">
                Hello, I'm Hua-Xu Zhong
              </h1>
              <p className="text-xl sm:text-2xl text-slate-700 mb-6">
                Researcher | Innovator
              </p>
              <p className="text-slate-600 text-lg leading-relaxed mb-3">
                Dr. Hua-Xu Zhong explores the intersection of technology, education, and practical AI application. I deeply understand and actively engage with the real-world challenges of implementing educational technologies and AI-driven systems. My passion lies in applying cutting-edge AI, particularly Large Language Models (LLMs), to create impactful learning solutions. My recent work focuses on developing LLM-powered educational systems, from GAI concept map generation to creativity-fostering tools. I firmly believe these technologies can significantly enhance learning experiences, optimize instructional design, and improve educational outcomes. My goal is to design inquiry-based learning frameworks that empower students to not just adapt to the future, but to actively shape it.
              </p>
              <p className="text-slate-600 text-lg leading-relaxed mb-6">
                I welcome collaborations with researchers, and educators to further explore and advance these exciting frontiers!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start mb-8">
                <a
                  href="#/research"
                  className="bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-transform hover:scale-105 transform flex items-center justify-center"
                >
                  <BriefcaseIcon className="w-5 h-5 mr-2" />
                  深入了解研究成果
                </a>
                {/* CV Download button removed as per user request */}
              </div>
              <div className="flex justify-center md:justify-start space-x-5">
                {SOCIAL_LINKS.slice(0, 5).map((link: SocialLink) => ( // Show first 5 prominent ones, or all if fewer than 5
                  <a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={link.name}
                    className="text-slate-500 hover:text-sky-600 transition-colors"
                  >
                    <link.icon className="w-7 h-7" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Research Interests */}
      <Section title="研究興趣 (Research Interests)" className="bg-slate-50">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {researchInterests.map(interest => (
            <Card key={interest.id} title={interest.name} className="bg-white">
              <p className="text-sm text-slate-600">{interest.description}</p>
            </Card>
          ))}
        </div>
      </Section>
      
      {/* Education Experience */}
      <Section title="教育經驗 (Educational Experience)" className="bg-white">
         <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {EDUCATION_DATA.map((edu: EducationItem) => ( 
            <Card key={edu.id} title={edu.degree} subtitle={edu.institution} className="bg-slate-50">
                <div className="flex items-center text-sm text-slate-600 mb-1">
                    <AcademicCapIcon className="w-5 h-5 mr-2 text-sky-600" />
                    {edu.field}
                </div>
                <div className="flex items-center text-sm text-slate-600">
                    <CalendarIcon className="w-5 h-5 mr-2 text-sky-600" />
                    {edu.year}
                </div>
            </Card>
          ))}
        </div>
      </Section>

      {/* Awards and Honors */}
      <Section title="重要獲獎與榮譽 (Awards & Honors)" className="bg-slate-50">
        <div className="grid md:grid-cols-2 gap-6">
          {AWARDS_DATA.slice(0, 4).map((award: AwardItem) => (
            <Card key={award.id} className="bg-white">
              <div className="flex items-start">
                <SparklesIcon className="w-6 h-6 mr-3 text-yellow-400 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-sky-600">{award.name}</h4>
                  {award.institution && <p className="text-sm text-slate-600">{award.institution}</p>}
                  <p className="text-sm text-slate-500">{award.year}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      {/* Latest News */}
      <Section title="最新消息 (Latest News)" className="bg-white">
        <div className="space-y-6">
          {LATEST_NEWS_DATA.slice(0, 5).map((news: NewsItem) => (
            <Card key={news.id} title={news.title} subtitle={news.date} className="bg-slate-50">
              <p className="text-slate-600">{news.content}</p>
            </Card>
          ))}
        </div>
      </Section>
    </div>
  );
};

export default HomePage;
