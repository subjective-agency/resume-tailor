export interface ContentItem {
  title: string;
  layout: string;
  description?: string;
  content?: any;
}

export interface ResumeData {
  config: {
    name: string;
    title: string;
    email: string | string[];
    website: string;
    github_username?: string;
    linkedin_username?: string;
    about_content: string;
    content: ContentItem[];
    [key: string]: any;
  };
  skills: {
    content: ContentItem[];
    [key: string]: any;
  };
}
