import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { ResumeData } from "@/types/resume";
import { ResumeAppWrapper } from "@/components/ResumeAppWrapper";

export default async function Page() {
  let resumeData: ResumeData | null = null;
  let errorMessage = "";

  try {
    const configPath = path.join(process.cwd(), "_config.yml");
    const skillsPath = path.join(process.cwd(), "_skills.yml");

    if (!fs.existsSync(configPath) || !fs.existsSync(skillsPath)) {
      errorMessage = "Error: _config.yml or _skills.yml not found.";
    } else {
      const configStr = fs.readFileSync(configPath, "utf8");
      const skillsStr = fs.readFileSync(skillsPath, "utf8");

      const config = JSON.parse(JSON.stringify(yaml.load(configStr)));
      const skills = JSON.parse(JSON.stringify(yaml.load(skillsStr)));

      resumeData = {
        config,
        skills,
      };
    }
  } catch (error: any) {
    errorMessage = error.message;
  }

  if (errorMessage) {
    return (
      <div className="p-10 text-red-600">
        <h1 className="text-2xl font-bold mb-4">Error Loading Data</h1>
        <pre className="whitespace-pre-wrap">{errorMessage}</pre>
      </div>
    );
  }

  if (!resumeData) return null;

  return <ResumeAppWrapper initialData={resumeData} />;
}
