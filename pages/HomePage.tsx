import React from 'react';
import { Link } from 'react-router-dom';
import Section from '../components/Section';
import Card from '../components/Card';
import {
  EDUCATION_DATA,
  LATEST_NEWS_DATA,
  PROJECTS_DATA,
  PUBLICATIONS_DATA,
  SITE,
  SOCIAL_LINKS,
} from '../constants';
import { EducationItem, NewsItem, SocialLink } from '../types';
import { BriefcaseIcon } from '../components/icons';
import { asset } from '../src/lib/assets';

const formatNewsDate = (iso: string) => {
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return { month: '', day: iso, year: '' };
  }
  return {
    month: date.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
    day: String(date.getDate()).padStart(2, '0'),
    year: String(date.getFullYear()),
  };
};

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

  const projects = PROJECTS_DATA.filter((project) => project.name !== 'N/A');

  return (
    <div>
      <section className="relative overflow-hidden bg-primary text-white">
        <div className="container mx-auto max-w-6xl px-4 py-16 md:py-24">
          <div className="flex flex-col items-center gap-10 md:flex-row md:items-center md:gap-14">
            <div className="flex-shrink-0">
              <img
                src={asset('IMG/1.jpg')}
                alt={`${SITE.name} professional portrait`}
                className="mx-auto h-56 w-56 rounded-full border-4 border-white/20 object-cover shadow-[var(--shadow-lift)] md:h-72 md:w-72"
                width={288}
                height={288}
              />
            </div>
            <div className="text-center md:text-left">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                Educational technology · AI · design thinking
              </p>
              <h1 className="font-sans text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
                {SITE.name}
                <span className="mt-2 block text-lg font-normal text-white/85 sm:text-xl">
                  {SITE.chineseName} · {SITE.honorific}
                </span>
              </h1>
              <p className="mt-4 text-xl text-white">{SITE.role}</p>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-50 md:text-lg">
                I work at the intersection of technology, education, and practical AI. My recent work focuses on
                LLM-powered learning systems — from GAI concept-map generation to tools that foster creativity —
                so students can inquire, not only adapt.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row md:justify-start">
                <Link to="/research" className="btn-primary">
                  <BriefcaseIcon className="h-5 w-5" />
                  View research
                </Link>
                <Link
                  to="/about"
                  className="inline-flex cursor-pointer items-center justify-center rounded-lg border-2 border-white/80 px-6 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-white hover:text-primary"
                >
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
                    className="cursor-pointer text-white/85 transition-colors duration-200 hover:text-white"
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
              { label: 'Latest papers', value: '2026' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl bg-white/10 px-5 py-4">
                <dt className="text-xs font-medium uppercase tracking-wider text-white/70">{stat.label}</dt>
                <dd className="mt-1 font-sans text-3xl font-semibold text-white">{stat.value}</dd>
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

      <Section title="Education" eyebrow="Path" className="bg-card">
        <ol className="relative ml-2 border-l-2 border-primary/15 pl-8">
          {EDUCATION_DATA.map((edu: EducationItem) => (
            <li key={edu.id} className="relative mb-10 last:mb-0">
              <span className="absolute top-1.5 -left-[41px] h-3.5 w-3.5 rounded-full border-2 border-primary bg-card" />
              <p className="text-sm font-medium text-muted-fg">{edu.year}</p>
              <h3 className="mt-1 font-sans text-xl font-semibold text-primary">{edu.degree}</h3>
              <p className="mt-1 text-secondary">{edu.institution}</p>
              <p className="mt-1 text-sm text-muted-fg">{edu.field}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Latest news" eyebrow="Updates" className="bg-background">
        <div className="divide-y divide-border rounded-[var(--radius-card)] border border-border bg-card">
          {LATEST_NEWS_DATA.map((news: NewsItem) => {
            const stamped = formatNewsDate(news.date);
            return (
              <article key={news.id} className="flex gap-5 px-5 py-5 md:gap-8 md:px-7">
                <time dateTime={news.date} className="w-16 shrink-0 text-primary md:w-20">
                  <span className="block text-[11px] font-semibold tracking-wide text-muted-fg">{stamped.month}</span>
                  <span className="block font-sans text-3xl font-semibold leading-none">{stamped.day}</span>
                  <span className="mt-1 block text-xs text-muted-fg">{stamped.year}</span>
                </time>
                <div className="min-w-0">
                  <h3 className="font-sans text-lg font-semibold text-primary">{news.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-secondary">{news.content}</p>
                </div>
              </article>
            );
          })}
        </div>
      </Section>
    </div>
  );
};

export default HomePage;
