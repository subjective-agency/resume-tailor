"use client";

import React from "react";
import { ResumeData } from "@/types/resume";
import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";

const colors = [
  "bg-blue-50 border-blue-200 text-blue-800",
  "bg-green-50 border-green-200 text-green-800",
  "bg-purple-50 border-purple-200 text-purple-800",
  "bg-orange-50 border-orange-200 text-orange-800",
  "bg-teal-50 border-teal-200 text-teal-800",
  "bg-pink-50 border-pink-200 text-pink-800",
  "bg-yellow-50 border-yellow-200 text-yellow-800",
  "bg-indigo-50 border-indigo-200 text-indigo-800",
  "bg-rose-50 border-rose-200 text-rose-800",
  "bg-cyan-50 border-cyan-200 text-cyan-800",
];

const getCategoryColor = (set?: string) => {
  if (!set) return "bg-gray-50 border-gray-200 text-gray-800";
  let hash = 0;
  for (let i = 0; i < set.length; i++) {
    hash = set.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

const SkillBadge = ({ item }: { item: any }) => {
  const colorClass = getCategoryColor(item.set);
  return (
    <div className="relative group inline-block mr-2 mb-2 print:hidden">
      <div className={`px-3 py-1.5 rounded-md border text-sm font-medium cursor-default transition-colors ${colorClass}`}>
        {item.title}
      </div>
      {(item.description || item.set) && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 pointer-events-none">
          {item.set && <div className="font-bold mb-1 text-gray-300 uppercase tracking-wider text-[10px]">{item.set}</div>}
          {item.description && <div className="leading-relaxed prose prose-invert prose-sm max-w-none"><Markdown rehypePlugins={[rehypeRaw]}>{item.description}</Markdown></div>}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
};

export const ResumeView = React.forwardRef<
  HTMLDivElement,
  { data: ResumeData }
>(({ data }, ref) => {
  const { config, skills } = data;

  const emails = Array.isArray(config.email) ? config.email : [config.email];

  // Order of sections: header, about me, skills, tools, experience, education, certification. Exclude "broader context" section
  const orderedSections = ["Skills", "Tools", "Experience", "Education", "Certifications"];
  
  const renderSection = (section: any, idx: number) => {
    if (!section || section.title === "Broader Context") return null;

    return (
      <section key={idx} className="mb-6 print:mb-4">
        <h2 className="text-lg font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 mb-4 pb-1 print:mb-2">{section.title}</h2>
        
        {section.description && (
          <div className="text-gray-700 leading-relaxed mb-4 prose prose-sm max-w-none print:hidden">
            <Markdown rehypePlugins={[rehypeRaw]}>{section.description}</Markdown>
          </div>
        )}

        {section.layout === 'text' && typeof section.content === 'string' && (
          <div className="text-gray-700 leading-relaxed prose prose-sm max-w-none">
            <Markdown rehypePlugins={[rehypeRaw]}>{section.content}</Markdown>
          </div>
        )}

        {section.layout === 'list-pane' && Array.isArray(section.content) && (
          <div>
            {/* Screen View */}
            <div className="print:hidden flex flex-wrap">
              {section.content.map((item: any, i: number) => (
                <SkillBadge key={i} item={item} />
              ))}
            </div>
            {/* Print View */}
            <div className="hidden print:block text-sm text-gray-800 leading-relaxed">
              {section.content.map((item: any) => item.title).join(", ")}
            </div>
          </div>
        )}

        {(section.layout === 'list' || section.layout === 'top') && Array.isArray(section.content) && (
          <div className="space-y-4 print:space-y-2">
            {section.content.map((item: any, i: number) => (
              <div key={i} className="break-inside-avoid">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="text-lg print:text-base font-bold text-gray-900">
                    {item.title}
                    {item.sub_title && <span className="text-gray-600 font-normal ml-2">- {item.sub_title}</span>}
                  </h3>
                  {item.caption && <span className="text-sm text-gray-500 font-medium whitespace-nowrap ml-4">{item.caption}</span>}
                </div>
                {item.description && (
                  <div className="text-sm text-gray-700 mt-1 leading-relaxed prose prose-sm max-w-none">
                    <div className="print:hidden">
                      <Markdown rehypePlugins={[rehypeRaw]}>{item.description}</Markdown>
                    </div>
                    <div className="hidden print:block">
                      {(() => {
                        const match = item.description.match(/data-share-badge-id="([^"]+)"/);
                        if (match) {
                          return <a href={`https://www.credly.com/badges/${match[1]}`} className="text-indigo-600">https://www.credly.com/badges/{match[1]}</a>;
                        }
                        return <Markdown rehypePlugins={[rehypeRaw]}>{item.description}</Markdown>;
                      })()}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    );
  };

  return (
    <div
      ref={ref}
      className="max-w-4xl mx-auto p-10 bg-white text-black shadow-xl print:shadow-none print:p-8 print:m-0 font-sans print:text-[11px] print:leading-snug"
    >
      {/* Header */}
      <header className="border-b-2 border-gray-800 pb-6 mb-6 print:pb-4 print:mb-4">
        <h1 className="text-4xl print:text-3xl font-bold uppercase tracking-wider text-gray-900">
          {config.name}
        </h1>
        <p className="text-xl print:text-lg text-gray-600 mt-2 font-medium">{config.title}</p>
        <div className="flex flex-col gap-y-1 mt-4 text-sm print:text-xs text-gray-500">
          {emails.length > 0 && (
            <a href={`mailto:${emails[0]}`} className="hover:text-indigo-600 transition-colors">{emails[0]}</a>
          )}
          {config.website && (
            <a href={config.website} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 transition-colors">
              {config.website.replace(/^https?:\/\//, '')}
            </a>
          )}
          {config.github_username && (
            <a href={`https://github.com/${config.github_username}`} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 transition-colors">
              github.com/{config.github_username}
            </a>
          )}
          {config.linkedin_username && (
            <a href={`https://linkedin.com/in/${config.linkedin_username}`} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 transition-colors">
              linkedin.com/in/{config.linkedin_username}
            </a>
          )}
        </div>
      </header>

      {/* About */}
      {config.about_content && (
        <section className="mb-6 print:mb-4">
          <h2 className="text-lg font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 mb-4 pb-1 print:mb-2">
            <span className="print:hidden">About Me</span>
            <span className="hidden print:inline">Summary</span>
          </h2>
          <div className="text-gray-700 leading-relaxed prose prose-sm max-w-none">
            <Markdown rehypePlugins={[rehypeRaw]}>{config.about_content}</Markdown>
          </div>
        </section>
      )}

      {/* Ordered Sections */}
      {orderedSections.map((title, idx) => {
        const section = config.content?.find((s: any) => s.title === title);
        return section ? renderSection(section, idx) : null;
      })}
      
      {/* Detailed Skills from _skills.yml */}
      {skills?.content?.map((section: any, idx: number) => {
        if (section.title === "Broader Context") return null;
        return (
          <section key={`skill-${idx}`} className="mb-6 print:mb-4">
            <h2 className="text-lg font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 mb-4 pb-1 print:mb-2">
              Detailed {section.title}
            </h2>

            {section.description && (
              <div className="text-gray-700 leading-relaxed mb-4 prose prose-sm max-w-none print:hidden">
                <Markdown rehypePlugins={[rehypeRaw]}>{section.description}</Markdown>
              </div>
            )}

            {section.layout === "list-pane" && Array.isArray(section.content) && (
              <div>
                {/* Screen View */}
                <div className="print:hidden flex flex-wrap">
                  {section.content.map((item: any, i: number) => (
                    <SkillBadge key={i} item={item} />
                  ))}
                </div>
                {/* Print View */}
                <div className="hidden print:block text-sm text-gray-800 leading-relaxed">
                  {section.content.map((item: any) => item.title).join(", ")}
                </div>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
});
ResumeView.displayName = "ResumeView";
