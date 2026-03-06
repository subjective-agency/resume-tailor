import { GoogleGenAI, Type } from "@google/genai";
import OpenAI from "openai";
import { ResumeData, CompanyTypeKey, GapAnalysisResult } from "@/types/resume";

export const ARCHETYPE_LABELS: Record<CompanyTypeKey, string> = {
  product_it: 'Product IT / Tech',
  outsourcing: 'IT Outsourcing & Service',
  startup_miltech: 'Startups & MilTech',
  enterprise: 'Enterprise',
  agencies: 'Digital Agencies & Creative',
  international: 'International Corporate',
};

export const COMPANY_TYPE_INSTRUCTIONS: Record<CompanyTypeKey, string> = {
  product_it: `You are analyzing for a PRODUCT IT/TECH environment.
REQUIRE: business metrics (Revenue, Retention, MAU, conversion rates), hypothesis testing, ownership (responsibility for results), user impact.
ANTI-PATTERNS: process-oriented description without result metrics, execution tasks without impact, "developed features" without business context.`,

  outsourcing: `You are analyzing for an IT OUTSOURCING & SERVICE environment.
REQUIRE: specific technical stack, English level (B2+), client communication skills, variety of projects.
ANTI-PATTERNS: lack of technical depth, vague phrasing, no mention of English, only one project for many years.`,

  startup_miltech: `You are analyzing for a STARTUPS & MILTECH environment.
REQUIRE: speed, adaptability, "wearing many hats", domain expertise, fast iterations, MVP experience.
ANTI-PATTERNS: long projects (2+ years) without mentioning fast iterations, corporate bureaucracy, overly formal tone, processes instead of results.`,

  enterprise: `You are analyzing for a LARGE SYSTEMIC BUSINESS / ENTERPRISE environment.
REQUIRE: stability, process optimization, legacy system experience, scale, compliance, documentation.
ANTI-PATTERNS: "chaos", "startup mentality", job-hopping (frequent job changes), lack of long-term projects.`,

  agencies: `You are analyzing for a DIGITAL AGENCIES & CREATIVE environment.
REQUIRE: diverse portfolio, speed, creativity, client presentation skills, visual/design skills.
ANTI-PATTERNS: boring purely technical descriptions without project context, lack of portfolio links, only one type of project.`,

  international: `You are analyzing for an INTERNATIONAL CORPORATE environment (FMCG, Big4, Pharma).
REQUIRE: soft skills, compliance, structured approach, teamwork, English C1+, international experience.
ANTI-PATTERNS: job-hopping, slang, informality, no mention of cross-functional collaboration.`,
};

export function getCompanyTypeInstructions(companyType?: CompanyTypeKey): string {
  if (!companyType) return "";
  return COMPANY_TYPE_INSTRUCTIONS[companyType] ?? COMPANY_TYPE_INSTRUCTIONS.product_it;
}

export const PROMPT_TEMPLATES = {
  company_classification: {
    ID: "company_classification",
    NAME: "Company Classification",
    DESCRIPTION: "Classify company type from job description",
    CONTENT: `Analyze the following job description and classify the company into one of the following 6 types.
Types:
1. product_it (Product IT / Tech companies)
2. outsourcing (IT Outsourcing & Service)
3. startup_miltech (Startups & MilTech)
4. enterprise (Large Systemic Business / Enterprise)
5. agencies (Digital Agencies & Creative)
6. international (International Corporate, FMCG, Big4)

Input:
- Job title: [job_title]
- Job description: [job_description]

Output MUST be ONLY a valid JSON object with a single key "type" matching one of the exact string IDs above.
Do not use markdown blocks like \`\`\`json.
Example: {"type": "product_it"}`
  },

  gap_analysis: {
    ID: "gap_analysis",
    NAME: "Gap Analysis",
    DESCRIPTION: "Performs strategic gap analysis before tailoring",
    CONTENT: `You are an expert career strategist.
You are analyzing a resume for a specific role and company archetype. You need to give clear advice: what to amplify, what to cut, and what skills are critically missing.

CONTEXT OF ANALYSIS:
- Target Role: [job_title]
- Company Archetype: [archetype_label]
- Archetype Rules:
[company_instructions]

Job Description:
[job_description]

Candidate's Canonical Experience:
[canonical_experience]

Candidate's Proof of Skill (Projects/Portfolio):
[canonical_proof_of_skill]

Candidate's Education:
[canonical_education]

Candidate's Certifications:
[canonical_certifications]

Candidate's Complete Skills:
[skills]

OUTPUT FORMAT:
Return ONLY a valid JSON object with the following schema. No markdown blocks like \`\`\`json.

{
  "meta": {
    "used_archetype": "[archetype_key]"
  },
  "strategic_audit": {
    "score": <number 0-100>,
    "verdict": "<short assessment, max 3 sentences>"
  },
  "amplify_points": [
    { "title": "<IMPERATIVE, max 5-7 words>", "description": "<why important, max 2 sentences>" }
  ],
  "cut_or_fix_points": [
    { "title": "<IMPERATIVE, max 5-7 words>", "description": "<why it's noise, max 2 sentences>" }
  ],
  "critical_gaps": [
    { "gap_type": "<skill tag>", "description": "<why it's critically missing>" }
  ]
}

RULES:
- Score 0-30: Needs complete rework
- Score 31-60: Needs serious adaptation
- Score 61-80: Good foundation, needs targeted improvements
- Score 81-100: Excellent match
- amplify_points: min 2-3 points
- cut_or_fix_points: min 2-3 points
- critical_gaps: only list skills physically ABSENT from the resume but CRITICALLY REQUIRED for this role/archetype. Do not duplicate rephrasing advice here. If no gaps, return empty array [].`
  },

  professional_summary: {
    ID: "professional_summary",
    NAME: "Professional Summary Generator",
    DESCRIPTION: "Generates a compelling professional summary tailored to the job description",
    CONTENT: `You are an expert resume writer. 
    You understand that most achievements can be re-worded to better resonate with requirements of a specific job without being dishonest.
    You are given my canonical professional summary, list of my skills, and title and description of a job I want to apply to.
    Your task is to write a new professional summary tailored to this concrete job.
    You MUST NOT imply nor state directly that I have any experience, skills, or achievements that I don't actually have.

Context / Company Archetype Rules (follow these carefully):
[archetype_instructions]

Input:
- Canonical summary: [canonical_summary]
- Job title: [job_title]
- Job description: [job_description]
- Skills: [skills]

Output:
Write a professional summary that:
1. Is based on the canonical summary but re-worded to better match the job description
2. Incorporates skills that: 1) are contained in the job description; 2) match semantically to at least 1 skill from the list of my skills
3. Uses industry-specific terminology
4. Demonstrates value proposition
5. Must be condensed to ~100 words if the canonical summary is larger than 100 words.
6. MUST be written in the first person (e.g., use "I", "my", do not use the third person like "Denis" or "He").

Format:
Professional Summary:
[summary_text]`,
  },

  experience_tailoring: {
    ID: "experience_tailoring",
    NAME: "Experience Tailoring for Job Description",
    DESCRIPTION: "Tailors work experience to match job requirements",
    CONTENT: `You are a career expert specializing in resume optimization. 
    You understand that most achievements can be re-worded to better resonate with requirements of a specific job without being dishonest.
    You are given my canonical experience section, list of my skills, and title and description of a job I want to apply to.
    Experience section consists of multiple experience items, each with a title, description and other information.
    You want to tailor the canonical work experience to better fit with [position] role by following this flow: 
        - For each experience item, identify which requirements from the job description it matches with (based on title, description and skills)
        - If it matches with any requirement, re-word the experience item to better highlight the aspects that match with the job description and incorporate relevant skills
        - If it doesn't match with any requirement, summarize the experience item in 1 line and keep it as is
    
Context / Company Archetype Rules (follow these carefully):
[archetype_instructions]

Input:
- Canonical experience: [canonical_experience]
- Job title: [job_title]
- Job description: [job_description]
- Skills: [skills]

Output:
Rewrite the experience section such that it:
1. Is based on the canonical experience, and has the same number of experience items, some of which are re-worded to better match the job description, while others are summarized
2. Use keywords from the job description
3. Demonstrate value delivered

Format:
Experience:
[tailored_experience_text]`,
  },

  skills_optimization: {
    ID: "skills_optimization",
    NAME: "Skills Section Optimization",
    DESCRIPTION: "Optimizes skills section for ATS compatibility",
    CONTENT: `You are an ATS optimization specialist. 
    You are given the entire list of my skills (based on taxonomy of skills from RFIA), and title and description of a job I want to apply to.
    Your task is to select those skills from my list that are most semantically relevant to the job description.

Input:
- Job title: [job_title]
- Job description: [job_description]
- Skills: [skills]

Output:
Create an simple list of skills that is a subset of my complete skills list. The resulting list:
- should be 23-27% of the original list max (by skill count) but not less than 10 skills
- must include the most impactful and relevant skills for the given job description

Format:
Skills:
[optimized_skills_text]`,
  },

  education_tailoring: {
    ID: "education_tailoring",
    NAME: "Education Tailoring",
    DESCRIPTION: "Tailors education section",
    CONTENT: `You are a career expert specializing in resume optimization.
    You are given my canonical education section and title and description of a job I want to apply to.
    Education section consists of multiple items.
    You want to tailor the canonical education to better fit with [position] role by following this flow:
        - For each education item, determine if it is relevant to the job description.
        - If it is relevant, summarize the description into 1 short sentence.
        - If it is not relevant, keep the item but drop the description entirely.
    
Input:
- Canonical education: [canonical_education]
- Job title: [job_title]
- Job description: [job_description]

Output:
Rewrite the education section based on the rules above.
Return ONLY a valid JSON array of the tailored education items based on the input schema. Do not include markdown formatting like \`\`\`json.`,
  },

  proof_of_skill_tailoring: {
    ID: "proof_of_skill_tailoring",
    NAME: "Proof of Skill Tailoring",
    DESCRIPTION: "Tailors proof of skill section",
    CONTENT: `You are a career expert specializing in resume optimization.
    You are given my canonical proof of skill section and title and description of a job I want to apply to.
    Your task is to tailor the proof of skill content to better fit the [position] role.
    
Input:
- Canonical proof of skill: [canonical_proof_of_skill]
- Job title: [job_title]
- Job description: [job_description]

Output:
Tailor the content of the proof of skill section. If the project is relevant to the job, summarize it into a concise description suitable for a professional resume. If not relevant, you may still include a brief summary but focus on transferable technical skills.
Return ONLY the tailored string content for the section. Do not include markdown formatting like \`\`\`json.`,
  },

  certifications_tailoring: {
    ID: "certifications_tailoring",
    NAME: "Certifications Tailoring",
    DESCRIPTION: "Tailors certifications section",
    CONTENT: `You are a career expert specializing in resume optimization.
    You are given my canonical certifications section and title and description of a job I want to apply to.
    Certifications section consists of multiple items.
    You want to tailor the canonical certifications to better fit with [position] role by following this flow:
        - For each item, determine if it is relevant to the job description.
        - If it is relevant, keep it.
        - If it is not relevant, do not include the item at all.
    
Input:
- Canonical certifications: [canonical_certifications]
- Job title: [job_title]
- Job description: [job_description]

Output:
Rewrite the certifications section based on the rules above.
Return ONLY a valid JSON array of the tailored certification items based on the input schema. Do not include markdown formatting like \`\`\`json.`,
  },

  cover_letter: {
    ID: "cover_letter",
    NAME: "Cover Letter Generator",
    DESCRIPTION: "Generates personalized cover letter",
    CONTENT: `You are a professional cover letter writer.
    You understand that most achievements can be re-worded to better resonate with requirements of a specific job without being dishonest.
    You are given professional summary optimized for the job description, experience that is also optimized for the job description, a proof of skill section describing personal projects, a list of my skills, and title and description of a job I want to apply to.
    Your task is to write a compelling cover letter for position: [position].
    Rule of thumb: cover letter completes the resume, it doesn't repeat it. So if some information is already present in the resume, you can omit it from the cover letter or just briefly mention it without going into details.

Input:
- Optimized summary: [optimized_summary]
- Optimized Experience: [optmized_experience]
- Proof of Skill: [proof_of_skill]
- Job title: [job_title]
- Job description: [job_description]
- Skills: [skills]

Output:
Write a 4-paragraph cover letter that:
1. Has a greeting in the 1st paragraph. Addresses the hiring manager by name if it's mentioned in the job description, otherwise addresses "Hiring Team"
2. Has introductory part in the 2nd paragraph, with explanation why I'm interested in the position, and showing some interest in the company
3. Has 3rd paragraph dedicated to my skills and experience (including personal projects from Proof of Skill) that are most relevant to the job, with examples of successes.
4. In the 4th paragraph expresses gratitude for considering my application, followed with a call to action for the interview.
5. IMPORTANT: Each of the paragraphs must be dried out to 3 sentences max, and the resulting cover letter must be no more than ~180-200 words in total.

Format:
Dear {Name of Hiring Manager or "Hiring Team"},

[paragraph_1]

[paragraph_2]

[paragraph_3]

[paragraph_4]

Sincerely,
[my_name]`,
  },
} as const;

interface AIProvider {
  generateContent: (params: { prompt: string; jsonMode?: boolean }) => Promise<string>;
}

function getAIProvider(): AIProvider {
  if (process.env.GEMINI_API_KEY) {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    return {
      generateContent: async ({ prompt, jsonMode }) => {
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt,
          config: jsonMode ? { responseMimeType: "application/json" } : undefined,
        });
        return response.text || "";
      },
    };
  }

  if (process.env.OPENAI_API_KEY) {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    return {
      generateContent: async ({ prompt, jsonMode }) => {
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [{ role: "user", content: prompt }],
          response_format: jsonMode ? { type: "json_object" } : undefined,
        });
        return response.choices[0].message.content || "";
      },
    };
  }

  throw new Error("Server configuration error: No AI provider API key set (GEMINI_API_KEY or OPENAI_API_KEY)");
}

const parseJsonSafe = (text: string, fallback: any) => {
  try {
    const cleaned = text.replace(/^```json\n/, "").replace(/\n```$/, "").replace(/^```/, "").replace(/```$/, "").trim();
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed;
    if (typeof parsed === 'object' && parsed !== null) {
      if (Array.isArray(fallback)) {
        const firstArray = Object.values(parsed).find(val => Array.isArray(val as any));
        if (firstArray) return firstArray;
      }
      return parsed;
    }
    return fallback;
  } catch (e) {
    console.error("Failed to parse JSON", e);
    return fallback;
  }
};

export async function classifyCompany(
  jobTitle: string,
  jobDescription: string
): Promise<CompanyTypeKey> {
  const provider = getAIProvider();
  const prompt = PROMPT_TEMPLATES.company_classification.CONTENT
    .replace("[job_title]", jobTitle)
    .replace("[job_description]", jobDescription);

  const text = await provider.generateContent({ prompt, jsonMode: true });
  const result = parseJsonSafe(text, { type: 'product_it' });
  
  if (result && result.type && Object.keys(COMPANY_TYPE_INSTRUCTIONS).includes(result.type)) {
    return result.type as CompanyTypeKey;
  }
  return 'product_it';
}

export async function analyzeGaps(
  canonicalData: ResumeData,
  jobTitle: string,
  jobDescription: string,
  companyType: CompanyTypeKey
): Promise<GapAnalysisResult> {
  const provider = getAIProvider();

  const skillsList = JSON.stringify(
    canonicalData.skills.content?.[0]?.content || canonicalData.skills.content
  );
  const canonicalExperience = JSON.stringify(
    canonicalData.config.content?.find((c: any) => c.title === 'Experience')?.content || []
  );
  const canonicalProofOfSkill = JSON.stringify(
    canonicalData.config.content?.find((c: any) => c.title === 'Proof of Skill')?.content || []
  );
  const canonicalEducation = JSON.stringify(
    canonicalData.config.content?.find((c: any) => c.title === 'Education')?.content || []
  );
  const canonicalCertifications = JSON.stringify(
    canonicalData.config.content?.find((c: any) => c.title === 'Certifications')?.content || []
  );

  const archetypeLabel = ARCHETYPE_LABELS[companyType];
  const companyInstructions = COMPANY_TYPE_INSTRUCTIONS[companyType];

  const prompt = PROMPT_TEMPLATES.gap_analysis.CONTENT
    .replace("[job_title]", jobTitle)
    .replace("[archetype_label]", archetypeLabel)
    .replace("[company_instructions]", companyInstructions)
    .replace("[job_description]", jobDescription)
    .replace("[canonical_experience]", canonicalExperience)
    .replace("[canonical_proof_of_skill]", canonicalProofOfSkill)
    .replace("[canonical_education]", canonicalEducation)
    .replace("[canonical_certifications]", canonicalCertifications)
    .replace("[skills]", skillsList)
    .replace("[archetype_key]", companyType);

  const text = await provider.generateContent({ prompt, jsonMode: true });
  const fallback: GapAnalysisResult = {
    meta: { used_archetype: companyType },
    strategic_audit: { score: 50, verdict: "Analysis failed to parse." },
    amplify_points: [],
    cut_or_fix_points: [],
    critical_gaps: []
  };
  
  return parseJsonSafe(text, fallback) as GapAnalysisResult;
}

export async function tailorResume(
  canonicalData: ResumeData,
  jobTitle: string,
  jobDescription: string,
  companyType?: CompanyTypeKey
): Promise<ResumeData> {
  const provider = getAIProvider();

  const skillsList = JSON.stringify(
    canonicalData.skills.content?.[0]?.content || canonicalData.skills.content
  );
  const canonicalSummary = canonicalData.config.about_content;
  const canonicalExperience = JSON.stringify(
    canonicalData.config.content?.find((c: any) => c.title === 'Experience')?.content || []
  );
  const canonicalEducation = JSON.stringify(
    canonicalData.config.content?.find((c: any) => c.title === 'Education')?.content || []
  );
  const canonicalProofOfSkill = JSON.stringify(
    canonicalData.config.content?.find((c: any) => c.title === 'Proof of Skill')?.content || []
  );
  const canonicalCertifications = JSON.stringify(
    canonicalData.config.content?.find((c: any) => c.title === 'Certifications')?.content || []
  );

  const archetypeInstructions = getCompanyTypeInstructions(companyType);

  // 1. Professional Summary
  const summaryPrompt = PROMPT_TEMPLATES.professional_summary.CONTENT
    .replace("[archetype_instructions]", archetypeInstructions)
    .replace("[canonical_summary]", canonicalSummary)
    .replace("[job_title]", jobTitle)
    .replace("[job_description]", jobDescription)
    .replace("[skills]", skillsList);

  // 2. Experience
  const experiencePrompt = PROMPT_TEMPLATES.experience_tailoring.CONTENT
    .replace("[archetype_instructions]", archetypeInstructions)
    .replace("[position]", jobTitle)
    .replace("[canonical_experience]", canonicalExperience)
    .replace("[job_title]", jobTitle)
    .replace("[job_description]", jobDescription)
    .replace("[skills]", skillsList) + "\n\nIMPORTANT: Return ONLY a valid JSON array of the tailored experience items based on the input schema. Do not include markdown formatting like ```json.";

  // 3. Skills
  const skillsPrompt = PROMPT_TEMPLATES.skills_optimization.CONTENT
    .replace("[job_title]", jobTitle)
    .replace("[job_description]", jobDescription)
    .replace("[skills]", skillsList) + "\n\nIMPORTANT: Return ONLY a valid JSON array of the optimized skill items based on the input schema. Do not include markdown formatting like ```json.";

  // 4. Education
  const educationPrompt = PROMPT_TEMPLATES.education_tailoring.CONTENT
    .replace("[position]", jobTitle)
    .replace("[canonical_education]", canonicalEducation)
    .replace("[job_title]", jobTitle)
    .replace("[job_description]", jobDescription);

  // 5. Proof of Skill
  const proofOfSkillPrompt = PROMPT_TEMPLATES.proof_of_skill_tailoring.CONTENT
    .replace("[position]", jobTitle)
    .replace("[canonical_proof_of_skill]", canonicalProofOfSkill)
    .replace("[job_title]", jobTitle)
    .replace("[job_description]", jobDescription);

  // 6. Certifications
  const certificationsPrompt = PROMPT_TEMPLATES.certifications_tailoring.CONTENT
    .replace("[position]", jobTitle)
    .replace("[canonical_certifications]", canonicalCertifications)
    .replace("[job_title]", jobTitle)
    .replace("[job_description]", jobDescription);

  const [summaryText, experienceText, skillsText, educationText, proofOfSkillText, certificationsText] = await Promise.all([
    provider.generateContent({ prompt: summaryPrompt }),
    provider.generateContent({ prompt: experiencePrompt, jsonMode: true }),
    provider.generateContent({ prompt: skillsPrompt, jsonMode: true }),
    provider.generateContent({ prompt: educationPrompt, jsonMode: true }),
    provider.generateContent({ prompt: proofOfSkillPrompt }),
    provider.generateContent({ prompt: certificationsPrompt, jsonMode: true })
  ]);

  const tailoredSummary = summaryText.replace("Professional Summary:\n", "").trim() || canonicalSummary;
  
  const tailoredExperience = parseJsonSafe(experienceText, canonicalData.config.content?.find((c: any) => c.title === 'Experience')?.content || []);
  const optimizedSkills = parseJsonSafe(skillsText, canonicalData.skills.content?.[0]?.content || []);
  const tailoredEducation = parseJsonSafe(educationText, canonicalData.config.content?.find((c: any) => c.title === 'Education')?.content || []);
  const tailoredProofOfSkill = proofOfSkillText.trim() || (canonicalData.config.content?.find((c: any) => c.title === 'Proof of Skill')?.content || "");
  const tailoredCertifications = parseJsonSafe(certificationsText, canonicalData.config.content?.find((c: any) => c.title === 'Certifications')?.content || []);

  // Reconstruct tailored data
  const tailoredData = JSON.parse(JSON.stringify(canonicalData)); // deep copy
  tailoredData.config.about_content = tailoredSummary;
  tailoredData.config.title = jobTitle;
  
  const updateSection = (title: string, newContent: any) => {
    const idx = tailoredData.config.content?.findIndex((c: any) => c.title === title);
    if (idx !== -1 && tailoredData.config.content) {
      tailoredData.config.content[idx].content = newContent;
    }
  };

  updateSection('Experience', tailoredExperience);
  updateSection('Education', tailoredEducation);
  updateSection('Proof of Skill', tailoredProofOfSkill);
  updateSection('Certifications', tailoredCertifications);

  tailoredData.skills.content = [{
    title: "Skills",
    layout: "list-pane",
    content: optimizedSkills
  }];

  return tailoredData;
}

export async function generateCoverLetter(
  tailoredData: ResumeData,
  jobTitle: string,
  jobDescription: string,
): Promise<string> {
  const provider = getAIProvider();

  const optimizedSummary = tailoredData.config.about_content;
  const optimizedExperience = JSON.stringify(
    tailoredData.config.content?.find((c: any) => c.title === 'Experience')?.content || []
  );
  const proofOfSkill = JSON.stringify(
    tailoredData.config.content?.find((c: any) => c.title === 'Proof of Skill')?.content || ""
  );
  const skillsList = JSON.stringify(tailoredData.skills.content);

  const prompt = PROMPT_TEMPLATES.cover_letter.CONTENT
    .replace("[position]", jobTitle)
    .replace("[optimized_summary]", optimizedSummary)
    .replace("[optmized_experience]", optimizedExperience)
    .replace("[proof_of_skill]", proofOfSkill)
    .replace("[job_title]", jobTitle)
    .replace("[job_description]", jobDescription)
    .replace("[skills]", skillsList)
    .replace("[my_name]", tailoredData.config.name);

  return await provider.generateContent({ prompt });
}
