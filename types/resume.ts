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

export type CompanyTypeKey =
  | 'product_it'
  | 'outsourcing'
  | 'startup_miltech'
  | 'enterprise'
  | 'agencies'
  | 'international';

export interface AmplifyPoint {
  title: string;
  description: string;
}

export interface CutOrFixPoint {
  title: string;
  description: string;
}

export interface CriticalGap {
  gap_type: string;
  description: string;
}

export interface GapAnalysisResult {
  meta: { used_archetype: CompanyTypeKey };
  strategic_audit: {
    score: number;
    verdict: string;
  };
  amplify_points: AmplifyPoint[];
  cut_or_fix_points: CutOrFixPoint[];
  critical_gaps: CriticalGap[];
}

