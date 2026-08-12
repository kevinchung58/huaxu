import React from 'react';
import { Link } from 'react-router-dom';
import Section from '../components/Section';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import {
  AWARDS_DATA,
  EDUCATION_DATA,
  LATEST_NEWS_DATA,
  PROJECTS_DATA,
  PUBLICATIONS_DATA,
  SITE,
  SOCIAL_LINKS,
} from '../constants';
import { AwardItem, EducationItem, NewsItem, SocialLink } from '../types';
import {
  AcademicCapIcon,
  BriefcaseIcon,
  CalendarIcon,
  SparklesIcon,
} from '../components/icons';
import { asset } from '../src/lib/assets';
import { filled } from '../src/lib/content';

const HomePage: React.FC = () => {
  const researchInterests = [
    {
      id: 'ri1',
      name: 'Educational Technology',
      description:
        'Leveraging innovative technologies to enhance learning experiences, instructional design, and educational outcomes.',
    },
    {
      id: 'ri2',
      name: 'Artificial Intelligence',
      description: 'Exploring the frontiers of AI, including machine learning, to solve complex problems.',
    },
    {
      id: 'ri3',
      name: 'Creativity and Design Thinking',
      description:
        'Applying design thinking methodologies and fostering creative problem-solving in education and technology development.',
    },
    {
      id: 'ri4',
      name: 'AI in Education',
      description:
        'Investigating how AI personalizes learning and supports intelligent tutoring and inquiry-based classrooms.',
    },
  ];

  const awards = filled(AWARDS_DATA, ['name']);
  const projects = PROJECTS_DATA.filter((project) => project.name !== 'N/A');

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-soft to-[#15293f] text-white">
        <div className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-48 w-48 rounded-full bg-paper/10 blur-2xl" />
        <div className="container mx-auto max-w-6xl px-4 py-16 md:py-24">
          <div className="flex flex-col items-center gap-10 md:flex-row md:items-center md:gap-14">
            <div className="flex-shrink-0">
              <img
                src={asset('IMG/1.jpg')}
                alt={`${SITE.name} professional portrait`}
                className="mx-auto h-56 w-56 rounded-full border-4 border-gold-tint/80 object-cover shadow-[var(--shadow-xl)] md:h-72 md:w-72"
                width={288}
                height={288}
              />
            </div>
            <div className="text-center md:text-left">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-amber-200">
                Educational technology · AI · design thinking
              </p>
              <h1 className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
                {SITE.name}
                <span className="mt-2 block font-sans text-lg font-normal text-slate-200 sm:text-xl">
                  {SITE.chineseName} · {SITE.honorific}
                </span>
              </h1>
              <p className="mt-4 text-xl text-amber-100">{SITE.role}</p>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-200 md:text-lg">
                I work at the intersection of technology, education, and practical AI. My recent work focuses on
                LLM-powered learning systems — from GAI concept-map generation to tools that foster creativity —
                so students can inquire, not only adapt.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row md:justify-start">
                <Link to="/research" className="btn-primary">
                  <BriefcaseIcon className="h-5 w-5" />
                  View research
                </Link>
                <Link to="/about" className="btn border-2 border-white/70 bg-transparent text-white hover:bg-white hover:text-primary">
                  About my work
                </Link>
              </div>
              <div className="mt-6 flex justify-center gap-4 md:justify-start">
                {SOCIAL_LINKS.map((link: SocialLink) => (
                  <a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={link.name}
                    className="cursor-pointer text-slate-200 transition-colors duration-200 hover:text-white"
                  >
                    <link.icon className="h-6 w-6" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          <dl className="mt-14 grid grid-cols-2 gap-3 md:grid-cols-3">
            {[
              { label: 'Publications', value: `${PUBLICATIONS_DATA.length}` },
              { label: 'Research projects', value: `${projects.length}` },
              { label: 'Latest papers', value: '2025' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl bg-white/10 px-5 py-4 backdrop-blur-sm">
                <dt className="text-xs uppercase tracking-wider text-slate-300">{stat.label}</dt>
                <dd className="mt-1 font-serif text-3xl text-white">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <Section title="Research interests" eyebrow="Focus" subtitle="Four threads that connect my papers, platforms, and classroom experiments.">
        <div className="grid gap-5 md:grid-cols-2">
          {researchInterests.map((interest) => (
            <Card key={interest.id} title={interest.name} className="bg-card">
              <p className="text-sm leading-relaxed text-muted-fg">{interest.description}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="Education" eyebrow="Path" className="bg-muted/60">
        <div className="grid gap-5 md:grid-cols-3">
          {EDUCATION_DATA.map((edu: EducationItem) => (
            <Card key={edu.id} title={edu.degree} subtitle={edu.institution} className="bg-card">
              <div className="mb-1 flex items-start text-sm text-secondary">
                <AcademicCapIcon className="mt-0.5 mr-2 h-5 w-5 flex-shrink-0 text-accent" />
                {edu.field}
              </div>
              <div className="flex items-center text-sm text-muted-fg">
                <CalendarIcon className="mr-2 h-5 w-5 flex-shrink-0 text-accent" />
                {edu.year}
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="Awards & honors" eyebrow="Recognition">
        {awards.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2">
            {awards.slice(0, 4).map((award: AwardItem) => (
              <Card key={award.id} className="bg-card">
                <div className="flex items-start">
                  <SparklesIcon className="mt-1 mr-3 h-6 w-6 flex-shrink-0 text-accent" />
                  <div>
                    <h4 className="font-serif text-lg font-semibold text-primary">{award.name}</h4>
                    {award.institution && <p className="text-sm text-muted-fg">{award.institution}</p>}
                    <p className="text-sm text-muted-fg">{award.year}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<SparklesIcon className="h-6 w-6" />}
            title="Honors will appear here"
            description="This space is reserved for awards and distinctions. The layout is ready — records will be added as they are confirmed."
          />
        )}
      </Section>

      <Section title="Latest news" eyebrow="Updates" className="bg-muted/60">
        <div className="space-y-4">
          {LATEST_NEWS_DATA.map((news: NewsItem) => (
            <Card key={news.id} title={news.title} subtitle={news.date} className="bg-card">
              <p className="text-sm leading-relaxed">{news.content}</p>
            </Card>
          ))}
        </div>
      </Section>
    </div>
  );
};

export default HomePage;
