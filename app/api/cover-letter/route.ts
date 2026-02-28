import { NextResponse } from "next/server";
import { generateCoverLetter } from "@/lib/ai";
import { ResumeData } from "@/types/resume";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tailoredData, jobTitle, jobDescription } = body;

    if (!tailoredData || !jobTitle || !jobDescription) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const text = await generateCoverLetter(tailoredData, jobTitle, jobDescription);

    return NextResponse.json(
      { text },
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Cover Letter API Error:", error);
    
    if (error.message?.includes("No AI provider API key set")) {
      return NextResponse.json(
        { error: "Server configuration error: No AI provider API key set (GEMINI_API_KEY or OPENAI_API_KEY)" },
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
