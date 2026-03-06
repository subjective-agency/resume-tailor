import { NextResponse } from "next/server";
import { classifyCompany, analyzeGaps } from "@/lib/ai";

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

    const companyType = await classifyCompany(jobTitle, jobDescription);
    const gapAnalysis = await analyzeGaps(canonicalData, jobTitle, jobDescription, companyType);

    return NextResponse.json(gapAnalysis, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Gap Analysis API Error:", error);
    
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
