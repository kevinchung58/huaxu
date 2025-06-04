
import React from 'react';
import Section from '../components/Section';
import Card from '../components/Card';
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

  const linksByMainCategory = mainCategoriesOrder.map(mainCat => {
    const categoryLinks = EXTERNAL_LINKS_DATA.filter(link => link.category === mainCat);
    
    const subCategories = Array.from(new Set(categoryLinks.map(link => link.subCategory).filter(Boolean))) as string[];
    const linksWithoutSubCategory = categoryLinks.filter(link => !link.subCategory);

    const groupedBySubCategory = subCategories.map(subCat => ({
      name: subCat,
      links: categoryLinks.filter(link => link.subCategory === subCat),
    }));

    if (linksWithoutSubCategory.length > 0) {
      groupedBySubCategory.unshift({ name: '', links: linksWithoutSubCategory });
    }
    
    return {
      mainCategoryName: mainCat,
      subGroups: groupedBySubCategory,
      hasLinks: categoryLinks.length > 0,
    };
  }).filter(group => group.hasLinks);

  return (
    <div className="animate-fadeIn">
      <Section title="資源連結 (Links)" subtitle="Explore GAI/AI Platforms and Academic Resources" className="bg-slate-50">
        
        {linksByMainCategory.map(mainGroup => (
          <div key={mainGroup.mainCategoryName} className="mb-12">
            <h3 className="text-2xl font-semibold text-sky-600 mb-6 border-b-2 border-sky-500 pb-2">
              {mainGroup.mainCategoryName}
            </h3>
            
            {mainGroup.subGroups.map((subGroup, subIndex) => (
              subGroup.links.length > 0 && (
                <div key={subGroup.name || `main-${subIndex}`} className={subGroup.name ? "mt-8" : "mt-0"}>
                  {subGroup.name && (
                    <h4 className="text-xl font-medium text-slate-700 mb-4">
                      {subGroup.name}
                    </h4>
                  )}
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {subGroup.links.map((link: ExternalLink) => {
                      const IconComponent = link.icon || DefaultLinkIcon;
                      return (
                        <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="block group">
                          <Card 
                            className="h-full bg-white hover:border-sky-500 border-2 border-transparent transition-colors flex flex-col justify-between p-4"
                            hoverEffect={true}
                          >
                            <div>
                              <div className="flex items-center mb-1.5">
                                <IconComponent className="w-5 h-5 mr-2.5 text-sky-600 flex-shrink-0" />
                                <h5 className="text-md font-medium text-sky-600 group-hover:text-sky-700 flex-grow truncate">{link.name}</h5>
                                <ExternalLinkIcon className="w-3.5 h-3.5 ml-2 text-slate-400 group-hover:text-sky-600 flex-shrink-0" />
                              </div>
                              {link.description && <p className="text-xs text-slate-500 mt-1">{link.description}</p>}
                            </div>
                          </Card>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )
            ))}
          </div>
        ))}
         {EXTERNAL_LINKS_DATA.length === 0 && ( 
             <p className="text-slate-600 text-center italic">No external links listed yet.</p>
        )}
      </Section>
    </div>
  );
};

export default LinksPage;