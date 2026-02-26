"use client";

import dynamic from "next/dynamic";
import { ResumeData } from "@/types/resume";

const ResumeApp = dynamic(
  () => import("@/components/ResumeApp").then((mod) => mod.ResumeApp),
  { ssr: false }
);

export function ResumeAppWrapper({ initialData }: { initialData: ResumeData }) {
  return <ResumeApp initialData={initialData} />;
}
