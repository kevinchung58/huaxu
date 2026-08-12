import React from 'react';
import Section from '../components/Section';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import { EXTERNAL_LINKS_DATA } from '../constants';
import { ExternalLink, ExternalLinkCategory } from '../types';
import { ExternalLinkIcon, LinkIcon as DefaultLinkIcon } from '../components/icons';

const LinksPage: React.FC = () => {
  const mainCategoriesOrder: ExternalLinkCategory[] = [
    '文本生成與輔助 (Text Generation & LLM Assistance)',
    'AI 影音圖像生成 (AI Multimedia Generation)',
    'AI 學術應用與研究資源 (AI in Academic Applications & Research)',
    'GAI/AI 輔助學習與教學平台 (GAI/AI-Assisted Learning & Teaching Platforms)',
  ];

  const categoryLabels: Record<string, string> = {
    '文本生成與輔助 (Text Generation & LLM Assistance)': 'Text generation & LLM assistance',
    'AI 影音圖像生成 (AI Multimedia Generation)': 'AI multimedia generation',
    'AI 學術應用與研究資源 (AI in Academic Applications & Research)': 'AI for research',
    'GAI/AI 輔助學習與教學平台 (GAI/AI-Assisted Learning & Teaching Platforms)':
      'AI-assisted learning & teaching',
  };

  const linksByMainCategory = mainCategoriesOrder
    .map((mainCat) => {
      const categoryLinks = EXTERNAL_LINKS_DATA.filter((link) => link.category === mainCat);
      const subCategories = Array.from(
        new Set(categoryLinks.map((link) => link.subCategory).filter(Boolean))
      ) as string[];
      const linksWithoutSubCategory = categoryLinks.filter((link) => !link.subCategory);
      const groupedBySubCategory = subCategories.map((subCat) => ({
        name: subCat,
        links: categoryLinks.filter((link) => link.subCategory === subCat),
      }));
      if (linksWithoutSubCategory.length > 0) {
        groupedBySubCategory.unshift({ name: '', links: linksWithoutSubCategory });
      }
      return {
        mainCategoryName: mainCat,
        subGroups: groupedBySubCategory,
        hasLinks: categoryLinks.length > 0,
      };
    })
    .filter((group) => group.hasLinks);

  return (
    <Section
      title="Resources"
      eyebrow="Toolkit"
      subtitle="Curated GAI and academic tools. This page lives under More so the main research story stays in front."
      className="bg-muted/40"
    >
      {linksByMainCategory.map((mainGroup) => (
        <div key={mainGroup.mainCategoryName} className="mb-12">
          <h3 className="mb-6 border-b-2 border-accent/70 pb-2 font-serif text-2xl font-semibold text-primary">
            {categoryLabels[mainGroup.mainCategoryName] ?? mainGroup.mainCategoryName}
          </h3>
          {mainGroup.subGroups.map(
            (subGroup, subIndex) =>
              subGroup.links.length > 0 && (
                <div key={subGroup.name || `main-${subIndex}`} className={subGroup.name ? 'mt-8' : 'mt-0'}>
                  {subGroup.name && <h4 className="mb-4 text-lg font-medium text-secondary">{subGroup.name}</h4>}
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {subGroup.links.map((link: ExternalLink) => {
                      const IconComponent = link.icon || DefaultLinkIcon;
                      return (
                        <a
                          key={link.id}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group block cursor-pointer"
                        >
                          <Card className="flex h-full flex-col justify-between border-transparent p-4 hover:border-accent" hoverEffect>
                            <div className="flex items-center">
                              <IconComponent className="mr-2.5 h-5 w-5 flex-shrink-0 text-accent" />
                              <h5 className="min-w-0 flex-grow truncate font-medium text-primary group-hover:text-accent">
                                {link.name}
                              </h5>
                              <ExternalLinkIcon className="ml-2 h-3.5 w-3.5 flex-shrink-0 text-muted-fg group-hover:text-accent" />
                            </div>
                            {link.description && <p className="mt-2 text-xs text-muted-fg">{link.description}</p>}
                          </Card>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )
          )}
        </div>
      ))}
      {EXTERNAL_LINKS_DATA.length === 0 && (
        <EmptyState title="No links yet" description="External resources will be collected in this directory." />
      )}
    </Section>
  );
};

export default LinksPage;
