import { NextResponse } from "next/server";
import { tailorResume } from "@/lib/ai";
import { ResumeData } from "@/types/resume";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { canonicalData, jobTitle, jobDescription } = body;

    if (!canonicalData || !jobTitle || !jobDescription) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const tailoredData = await tailorResume(canonicalData, jobTitle, jobDescription);

    return NextResponse.json(tailoredData, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Tailor API Error:", error);
    
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
