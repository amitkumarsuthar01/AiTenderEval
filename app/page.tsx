"use client";

import { useState } from "react";
import UploadCard from "@/app/components/UploadCard";
import ResultCard from "@/app/components/ResultCard";
import ChecklistTable from "@/app/components/ChecklistTable";

import { extractEntities } from "@/lib/extractEntities";
import { analyzeEligibility } from "@/lib/eligibility";

import jsPDF from "jspdf";

export default function Home() {
  const [tenderFile, setTenderFile] = useState<File | null>(null);

  const [bidderFile, setBidderFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);

  const [result, setResult] = useState<any>(null);

  const [resetKey, setResetKey] = useState(0);

  async function parsePDF(file: File) {
    const formData = new FormData();

    formData.append("file", file);

    const res = await fetch("/api/parse-pdf", {
      method: "POST",
      body: formData,
    });

    return res.json();
  }

  async function handleAnalyze() {
    if (!tenderFile || !bidderFile) return;

    setLoading(true);

    try {
      const tenderRes = await parsePDF(tenderFile);

      const bidderRes = await parsePDF(bidderFile);

      const tender = extractEntities(tenderRes.text);

      const bidder = extractEntities(bidderRes.text);

      const analysis = analyzeEligibility(tender, bidder);

      const breakdown = {
        turnover:
          (bidder.annual_turnover || 0) >= (tender.minimum_turnover || 0),

        experience:
          (bidder.years_of_experience || 0) >=
          (tender.required_experience_years || 0),

        certifications:
          tender.required_certifications?.every((cert: string) =>
            bidder.certifications?.includes(cert),
          ) || false,

        project:
          bidder.past_project_types?.includes(tender.project_type) || false,
      };

      setResult({
        tender,
        bidder,
        analysis,
        breakdown,
      });
    } catch (error) {
      console.error(error);

      alert("Error analyzing documents");
    }

    setLoading(false);
  }

  function downloadReport() {
    if (!result) return;

    const doc = new jsPDF();

    doc.setTextColor(79, 70, 229);

    doc.setFontSize(24);

    doc.text("AI Procurement Evaluation Report", 20, 25);

    doc.setTextColor(0, 0, 0);

    doc.setFontSize(14);

    doc.text(`Final Score: ${result.analysis.score}/100`, 20, 50);

    doc.text(
      `Eligibility Status: ${
        result.analysis.eligible ? "Eligible" : "Not Eligible"
      }`,
      20,
      62,
    );

    doc.text(`Keyword Match Score: ${result.analysis.keywordScore}%`, 20, 74);

    doc.text(`Numeric Match Score: ${result.analysis.numericScore}%`, 20, 86);

    doc.setFontSize(16);

    doc.text("Verified Requirements", 20, 110);

    result.analysis.matchedKeywords.forEach(
      (keyword: string, index: number) => {
        doc.text(`• ${keyword}`, 30, 122 + index * 8);
      },
    );

    const startY = 140 + result.analysis.matchedKeywords.length * 8;

    doc.text("Compliance Gaps Detected", 20, startY);

    result.analysis.unmatchedKeywords.forEach(
      (keyword: string, index: number) => {
        doc.text(`• ${keyword}`, 30, startY + 12 + index * 8);
      },
    );

    doc.save("AI_Procurement_Report.pdf");
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-violet-100 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* HERO */}
        <div className="relative overflow-hidden rounded-[36px] bg-gradient-to-br from-indigo-700 via-violet-700 to-slate-900 p-10 md:p-14 shadow-2xl">
          <div className="absolute inset-0 opacity-10 bg-[url('/grid.svg')]" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 backdrop-blur-md px-4 py-2 rounded-full text-white text-sm font-medium mb-6">
              AI Powered Procurement Intelligence
            </div>

            <h1 className="text-5xl md:text-6xl font-black text-white leading-tight max-w-5xl">
              AI Procurement Intelligence Platform
            </h1>

            <p className="text-indigo-100 text-lg md:text-xl mt-6 max-w-3xl leading-relaxed">
              Analyze tender documents, evaluate bidder eligibility, identify
              compliance gaps, and generate AI-powered procurement insights
              instantly.
            </p>

            <div className="flex flex-wrap gap-4 mt-8">
              <div className="bg-white/10 border border-white/20 backdrop-blur-md px-5 py-3 rounded-2xl text-white">
                Smart Matching Engine
              </div>

              <div className="bg-white/10 border border-white/20 backdrop-blur-md px-5 py-3 rounded-2xl text-white">
                AI Compliance Analysis
              </div>

              <div className="bg-white/10 border border-white/20 backdrop-blur-md px-5 py-3 rounded-2xl text-white">
                Eligibility Scoring
              </div>
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              label: "Documents Processed",
              value: "12K+",
            },
            {
              label: "Accuracy Rate",
              value: "98.2%",
            },
            {
              label: "AI Compliance Checks",
              value: "350+",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-[28px] p-8 shadow-xl"
            >
              <div className="text-4xl font-black text-indigo-700">
                {item.value}
              </div>

              <div className="text-slate-600 mt-2 font-medium">
                {item.label}
              </div>
            </div>
          ))}
        </div>

        {/* UPLOAD */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <UploadCard
            title="Tender Document"
            subtitle="Upload government procurement PDF"
            inputKey={resetKey}
            file={tenderFile}
            onChange={setTenderFile}
          />

          <UploadCard
            title="Bidder Proposal"
            subtitle="Upload company capability PDF"
            inputKey={resetKey + 1}
            file={bidderFile}
            onChange={setBidderFile}
          />
        </div>

        {/* BUTTON */}
        <div className="flex justify-center">
          <button
            onClick={handleAnalyze}
            disabled={!tenderFile || !bidderFile || loading}
            className="
              relative overflow-hidden
              bg-gradient-to-r from-indigo-600 to-violet-600
              hover:from-indigo-700 hover:to-violet-700
              text-white px-10 py-5 rounded-2xl
              font-bold text-lg shadow-2xl
              transition-all duration-300
              hover:scale-105
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            {loading ? "Analyzing Procurement Data..." : "Run AI Evaluation"}
          </button>
        </div>

        {/* RESULTS */}
        {result && (
          <div className="space-y-8">
            {/* RESULT CARD */}
            <div className="bg-white/80 backdrop-blur-xl rounded-[28px] border border-white/40 p-8 shadow-xl">
              <ResultCard analysis={result.analysis} />
            </div>

            {/* CHECKLIST */}
            <ChecklistTable
              tender={result.tender}
              bidder={result.bidder}
              breakdown={result.breakdown}
            />

            {/* KEYWORDS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white/80 backdrop-blur-xl rounded-[28px] border border-white/40 p-6 shadow-xl">
                <h2 className="text-2xl font-black mb-6 text-slate-800">
                  Tender Keywords
                </h2>

                <div className="flex flex-wrap gap-3">
                  {result.tender.keywords.map((keyword: string) => (
                    <span
                      key={keyword}
                      className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xl rounded-[28px] border border-white/40 p-6 shadow-xl">
                <h2 className="text-2xl font-black mb-6 text-slate-800">
                  Bidder Keywords
                </h2>

                <div className="flex flex-wrap gap-3">
                  {result.bidder.keywords.map((keyword: string) => (
                    <span
                      key={keyword}
                      className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* MATCHING */}
            <div className="bg-white/80 backdrop-blur-xl rounded-[28px] border border-white/40 p-8 shadow-xl">
              <h2 className="text-3xl font-black text-slate-800 mb-8">
                AI Compliance & Requirement Matching
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div>
                  <h3 className="text-xl font-black text-emerald-600 mb-5">
                    Verified Requirements
                  </h3>

                  <div className="flex flex-wrap gap-3">
                    {result.analysis.matchedKeywords.map((keyword: string) => (
                      <span
                        key={keyword}
                        className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-bold"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-black text-red-600 mb-5">
                    Compliance Gaps Detected
                  </h3>

                  <div className="flex flex-wrap gap-3">
                    {result.analysis.unmatchedKeywords.map(
                      (keyword: string) => (
                        <span
                          key={keyword}
                          className="px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-bold"
                        >
                          {keyword}
                        </span>
                      ),
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* NUMBERS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white/80 backdrop-blur-xl rounded-[28px] border border-white/40 p-6 shadow-xl">
                <h2 className="text-2xl font-black mb-5">Tender Numbers</h2>

                <div className="flex flex-wrap gap-3">
                  {result.tender.numbers.map((num: number, i: number) => (
                    <span
                      key={i}
                      className="px-4 py-2 bg-slate-100 rounded-xl font-semibold"
                    >
                      {num}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xl rounded-[28px] border border-white/40 p-6 shadow-xl">
                <h2 className="text-2xl font-black mb-5">Bidder Numbers</h2>

                <div className="flex flex-wrap gap-3">
                  {result.bidder.numbers.map((num: number, i: number) => (
                    <span
                      key={i}
                      className="px-4 py-2 bg-slate-100 rounded-xl font-semibold"
                    >
                      {num}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex flex-wrap gap-5 justify-center">
              <button
                onClick={downloadReport}
                className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white px-10 py-4 rounded-2xl font-bold shadow-2xl transition-all duration-300 hover:scale-105"
              >
                Download AI Report
              </button>

              <button
                onClick={() => {
                  setResult(null);

                  setTenderFile(null);

                  setBidderFile(null);

                  setResetKey((prev) => prev + 2);
                }}
                className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 px-10 py-4 rounded-2xl font-bold shadow-lg transition-all duration-300"
              >
                Analyze Another Tender
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
