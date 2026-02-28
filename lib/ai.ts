import { GoogleGenAI, Type } from "@google/genai";
import OpenAI from "openai";
import { ResumeData } from "@/types/resume";

export const PROMPT_TEMPLATES = {
  professional_summary: {
    ID: "professional_summary",
    NAME: "Professional Summary Generator",
    DESCRIPTION: "Generates a compelling professional summary tailored to the job description",
    CONTENT: `You are an expert resume writer. 
    You understand that most achievements can be re-worded to better resonate with requirements of a specific job without being dishonest.
    You are given my canonical professional summary, list of my skills, and title and description of a job I want to apply to.
    Your task is to write a new professional summary tailored to this concrete job.
    You MUST NOT imply nor state directly that I have any experience, skills, or achievements that I don't actually have.

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
    Proof of skill section consists of multiple items.
    You want to tailor the canonical proof of skill to better fit with [position] role by following this flow:
        - For each item, determine if the described project is relevant to the job description.
        - If it is relevant, summarize into 1 paragraph and keep all links.
        - If it is not relevant, do not include the item at all.
    
Input:
- Canonical proof of skill: [canonical_proof_of_skill]
- Job title: [job_title]
- Job description: [job_description]

Output:
Rewrite the proof of skill section based on the rules above.
Return ONLY a valid JSON array of the tailored proof of skill items based on the input schema. Do not include markdown formatting like \`\`\`json.`,
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
    You are given professional summary optimized for the job description, experience that is also optimized for the job description, list of my skills, and title and description of a job I want to apply to.
    Your task is to write a compelling cover letter for position: [position].
    Rule of thumb: cover letter completes the resume, it doesn't repeat it. So if some information is already present in the resume, you can omit it from the cover letter or just briefly mention it without going into details.

Input:
- Optimized summary: [optimized_summary]
- Optimized Experience: [optmized_experience]
- Job title: [job_title]
- Job description: [job_description]
- Skills: [skills]

Output:
Write a 4-paragraph cover letter that:
1. Has a greeting in the 1st paragraph. Addresses the hiring manager by name if it's mentioned in the job description, otherwise addresses "Hiring Team"
2. Has introductory part in the 2nd paragraph, with explanation why I'm interested in the position, and showing some interest in the company
3. Has 3rd paragraph dedicated to my skills and experience that are most relevant to the job, with examples of successes.
4. In the 4th paragraph expresses gratitude for considering my application, followed with a call to action for the interview.
5. IMPORTANT: Each of the paragraphs must be dried out to 3 sentences max.

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

export async function tailorResume(
  canonicalData: ResumeData,
  jobTitle: string,
  jobDescription: string,
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

  // 1. Professional Summary
  const summaryPrompt = PROMPT_TEMPLATES.professional_summary.CONTENT
    .replace("[canonical_summary]", canonicalSummary)
    .replace("[job_title]", jobTitle)
    .replace("[job_description]", jobDescription)
    .replace("[skills]", skillsList);

  // 2. Experience
  const experiencePrompt = PROMPT_TEMPLATES.experience_tailoring.CONTENT
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
    provider.generateContent({ prompt: proofOfSkillPrompt, jsonMode: true }),
    provider.generateContent({ prompt: certificationsPrompt, jsonMode: true })
  ]);

  const tailoredSummary = summaryText.replace("Professional Summary:\n", "").trim() || canonicalSummary;
  
  const parseJson = (text: string, fallback: any) => {
    try {
      const cleaned = text.replace(/^```json\n/, "").replace(/\n```$/, "");
      // OpenAI might return an object with a key if we don't specify the schema strictly
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) return parsed;
      if (typeof parsed === 'object' && parsed !== null) {
        // Try to find an array property if it's wrapped
        const firstArray = Object.values(parsed).find(val => Array.isArray(val));
        if (firstArray) return firstArray;
      }
      return fallback;
    } catch (e) {
      console.error("Failed to parse JSON", e);
      return fallback;
    }
  };

  const tailoredExperience = parseJson(experienceText, canonicalData.config.content?.find((c: any) => c.title === 'Experience')?.content || []);
  const optimizedSkills = parseJson(skillsText, canonicalData.skills.content?.[0]?.content || []);
  const tailoredEducation = parseJson(educationText, canonicalData.config.content?.find((c: any) => c.title === 'Education')?.content || []);
  const tailoredProofOfSkill = parseJson(proofOfSkillText, canonicalData.config.content?.find((c: any) => c.title === 'Proof of Skill')?.content || []);
  const tailoredCertifications = parseJson(certificationsText, canonicalData.config.content?.find((c: any) => c.title === 'Certifications')?.content || []);

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
  const skillsList = JSON.stringify(tailoredData.skills.content);

  const prompt = PROMPT_TEMPLATES.cover_letter.CONTENT
    .replace("[position]", jobTitle)
    .replace("[optimized_summary]", optimizedSummary)
    .replace("[optmized_experience]", optimizedExperience)
    .replace("[job_title]", jobTitle)
    .replace("[job_description]", jobDescription)
    .replace("[skills]", skillsList)
    .replace("[my_name]", tailoredData.config.name);

  return await provider.generateContent({ prompt });
}
