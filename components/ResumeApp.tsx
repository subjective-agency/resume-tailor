"use client";

import React, { useState, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { ResumeData } from "@/types/resume";
import { ResumeView } from "./ResumeView";
import { tailorResume, generateCoverLetter } from "@/lib/gemini";
import {
  Loader2,
  FileText,
  Download,
  Copy,
  X,
  Edit3,
  RefreshCw,
} from "lucide-react";

export function ResumeApp({ initialData }: { initialData: ResumeData }) {
  const [canonicalData] = useState<ResumeData>(initialData);
  const [tailoredData, setTailoredData] = useState<ResumeData | null>(null);

  const [modalState, setModalState] = useState<
    "none" | "tailor" | "edit" | "coverLetter"
  >("none");
  const [isProcessing, setIsProcessing] = useState(false);

  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [wantsCoverLetter, setWantsCoverLetter] = useState(false);

  const [coverLetterText, setCoverLetterText] = useState("");

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle:
      `Resume_${tailoredData?.config.name || canonicalData.config.name}_${tailoredData?.config.title || canonicalData.config.title}`.replace(
        /\s+/g,
        "_",
      ),
  });

  const handleTailorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const result = await tailorResume(
        canonicalData,
        jobTitle,
        jobDescription,
      );
      setTailoredData(result);
      setModalState("edit");
    } catch (error) {
      console.error(error);
      alert("Failed to tailor resume.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditSubmit = async () => {
    if (wantsCoverLetter) {
      setIsProcessing(true);
      try {
        const cl = await generateCoverLetter(
          tailoredData!,
          jobTitle,
          jobDescription,
        );
        setCoverLetterText(cl);
        setModalState("coverLetter");
      } catch (error) {
        console.error(error);
        alert("Failed to generate cover letter.");
        setModalState("none");
      } finally {
        setIsProcessing(false);
      }
    } else {
      setModalState("none");
      // Trigger print after a short delay to allow modal to close
      setTimeout(() => {
        handlePrint();
      }, 100);
    }
  };

  const handleCopyCoverLetter = () => {
    navigator.clipboard.writeText(coverLetterText);
    setModalState("none");
  };

  const activeData = tailoredData || canonicalData;

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Resume</h1>
            {tailoredData && (
              <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20 mt-2">
                Tailored for: {jobTitle}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            {tailoredData && (
              <button
                onClick={() => setTailoredData(null)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
              >
                <RefreshCw className="w-4 h-4" />
                Reset
              </button>
            )}
            <button
              onClick={() => setModalState("tailor")}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700"
            >
              <Edit3 className="w-4 h-4" />
              Tailor for Job
            </button>
            <button
              onClick={() => handlePrint()}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-md shadow-sm hover:bg-gray-800"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>
          </div>
        </div>

        {/* The Resume View */}
        <div className="overflow-hidden rounded-lg shadow-xl ring-1 ring-gray-900/5 bg-white">
          <ResumeView data={activeData} ref={printRef} />
        </div>
      </div>

      {/* Tailor Modal */}
      {modalState === "tailor" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-semibold text-gray-900">
                Tailor Resume
              </h2>
              <button
                onClick={() => setModalState("none")}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              onSubmit={handleTailorSubmit}
              className="p-6 overflow-y-auto flex-1"
            >
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Job Title
                  </label>
                  <input
                    type="text"
                    required
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g. Senior Frontend Engineer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Job Description
                  </label>
                  <textarea
                    required
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    placeholder="Paste the job description here..."
                  />
                </div>
                <div className="flex items-center bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                  <input
                    id="cover-letter"
                    type="checkbox"
                    checked={wantsCoverLetter}
                    onChange={(e) => setWantsCoverLetter(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="cover-letter"
                    className="ml-3 block text-sm font-medium text-indigo-900"
                  >
                    Also generate a cover letter
                  </label>
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalState("none")}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                  {isProcessing ? "Tailoring..." : "Tailor Resume"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Tailored Resume Modal */}
      {modalState === "edit" && tailoredData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-semibold text-gray-900">
                Review & Edit Tailored Resume
              </h2>
              <button
                onClick={() => setModalState("none")}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-gray-50 space-y-8">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                Review the AI-tailored resume data below. You can make manual
                adjustments before exporting.
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  About Me
                </label>
                <textarea
                  value={tailoredData.config.about_content || ""}
                  onChange={(e) =>
                    setTailoredData({
                      ...tailoredData,
                      config: {
                        ...tailoredData.config,
                        about_content: e.target.value,
                      },
                    })
                  }
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-700 font-mono text-sm"
                />
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">
                  Experience
                </h3>
                <div className="space-y-6">
                  {tailoredData.config.content
                    ?.find((c: any) => c.title === "Experience")
                    ?.content?.map((job: any, idx: number) => (
                      <div
                        key={idx}
                        className="bg-white p-5 border border-gray-200 rounded-lg shadow-sm relative"
                      >
                        <button
                          onClick={() => {
                            const newConfig = { ...tailoredData.config };
                            const expSection = newConfig.content.find(
                              (c: any) => c.title === "Experience",
                            );
                            if (expSection && expSection.content) {
                              expSection.content.splice(idx, 1);
                              setTailoredData({
                                ...tailoredData,
                                config: newConfig,
                              });
                            }
                          }}
                          className="absolute top-4 right-4 text-red-500 hover:text-red-700 p-1"
                          title="Dismiss this item"
                        >
                          <X className="w-5 h-5" />
                        </button>
                        <div className="font-semibold text-gray-900 mb-4 text-lg pr-8">
                          {job.title}{" "}
                          <span className="text-gray-500 font-normal">
                            - {job.sub_title}
                          </span>
                        </div>

                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description (Markdown)
                          </label>
                          <textarea
                            value={job.description || ""}
                            onChange={(e) => {
                              const newConfig = { ...tailoredData.config };
                              const expSection = newConfig.content.find(
                                (c: any) => c.title === "Experience",
                              );
                              if (expSection && expSection.content) {
                                expSection.content[idx].description =
                                  e.target.value;
                                setTailoredData({
                                  ...tailoredData,
                                  config: newConfig,
                                });
                              }
                            }}
                            rows={6}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm text-gray-700 font-mono"
                          />
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">
                  Education
                </h3>
                <div className="space-y-6">
                  {tailoredData.config.content
                    ?.find((c: any) => c.title === "Education")
                    ?.content?.map((edu: any, idx: number) => (
                      <div
                        key={idx}
                        className="bg-white p-5 border border-gray-200 rounded-lg shadow-sm relative"
                      >
                        <button
                          onClick={() => {
                            const newConfig = { ...tailoredData.config };
                            const eduSection = newConfig.content.find(
                              (c: any) => c.title === "Education",
                            );
                            if (eduSection && eduSection.content) {
                              eduSection.content.splice(idx, 1);
                              setTailoredData({
                                ...tailoredData,
                                config: newConfig,
                              });
                            }
                          }}
                          className="absolute top-4 right-4 text-red-500 hover:text-red-700 p-1"
                          title="Dismiss this item"
                        >
                          <X className="w-5 h-5" />
                        </button>
                        <div className="font-semibold text-gray-900 mb-4 text-lg pr-8">
                          {edu.title}{" "}
                          {edu.sub_title && (
                            <span className="text-gray-500 font-normal">
                              - {edu.sub_title}
                            </span>
                          )}
                        </div>

                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description (Markdown)
                          </label>
                          <textarea
                            value={edu.description || ""}
                            onChange={(e) => {
                              const newConfig = { ...tailoredData.config };
                              const eduSection = newConfig.content.find(
                                (c: any) => c.title === "Education",
                              );
                              if (eduSection && eduSection.content) {
                                eduSection.content[idx].description =
                                  e.target.value;
                                setTailoredData({
                                  ...tailoredData,
                                  config: newConfig,
                                });
                              }
                            }}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm text-gray-700 font-mono"
                          />
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-white">
              <button
                onClick={() => setModalState("none")}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSubmit}
                disabled={isProcessing}
                className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : null}
                {isProcessing
                  ? "Processing..."
                  : wantsCoverLetter
                    ? "Next: Cover Letter"
                    : "Submit & Export"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cover Letter Modal */}
      {modalState === "coverLetter" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-semibold text-gray-900">
                Your Cover Letter
              </h2>
              <button
                onClick={() => setModalState("none")}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 bg-white">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 mb-6">
                Review and edit your cover letter below. When ready, click
                &quot;Copy &amp; Close&quot; to copy it to your clipboard.
              </div>
              <textarea
                value={coverLetterText}
                onChange={(e) => setCoverLetterText(e.target.value)}
                className="w-full h-[400px] p-5 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 leading-relaxed text-gray-800"
              />
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
              <button
                onClick={() => setModalState("none")}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={handleCopyCoverLetter}
                className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                <Copy className="w-4 h-4" />
                Copy & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
