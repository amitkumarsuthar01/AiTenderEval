"use client";

import { useState } from "react";
import UploadCard from "@/app/components/UploadCard";
import ChecklistTable from "./components/ChecklistTable";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast, Toaster } from "sonner";

interface AIReport {
  score: number;

  eligible: boolean;

  riskLevel: string;

  summary: string;

  strengths: string[];

  gaps: string[];

  recommendation: string;

  checklist: {
    turnover: {
      required: string;
      bidder: string;
      status: boolean;
    };

    experience: {
      required: string;
      bidder: string;
      status: boolean;
    };

    certifications: {
      required: string;
      bidder: string;
      status: boolean;
    };

    projectRelevance: {
      required: string;
      bidder: string;
      status: boolean;
    };
  };
}

interface ResultState {
  aiReport: AIReport;
}

function formatCurrency(value: string) {
  return value.replace(/₹/g, "Rs.").replace(/crore/i, "Crore");
}

export default function Home() {
  const [tenderFile, setTenderFile] = useState<File | null>(null);

  const [bidderFile, setBidderFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);

  const [result, setResult] = useState<ResultState | null>(null);

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

  function downloadPDF() {
    if (!result?.aiReport) return;

    const doc = new jsPDF();

    const report = result.aiReport;

    // TITLE
    doc.setFontSize(22);
    doc.text("AI Procurement Evaluation Report", 14, 20);

    // SCORE
    doc.setFontSize(14);

    doc.text(`AI Score: ${report.score}`, 14, 35);

    doc.text(`Risk Level: ${report.riskLevel}`, 14, 45);

    doc.text(
      `Eligibility: ${report.eligible ? "Eligible" : "Not Eligible"}`,
      14,
      55,
    );

    // SUMMARY
    doc.setFontSize(16);

    doc.text("Executive Summary", 14, 75);

    doc.setFontSize(12);

    const summaryLines = doc.splitTextToSize(report.summary, 180);

    doc.text(summaryLines, 14, 85);

    // CHECKLIST TABLE
    autoTable(doc, {
      startY: 120,

      head: [["Criteria", "Tender Requirement", "Bidder Data", "Status"]],

      body: [
        [
          "Turnover",
          formatCurrency(report.checklist.turnover.required),
          formatCurrency(report.checklist.turnover.bidder),
          report.checklist.turnover.status ? "PASS" : "FAIL",
        ],

        [
          "Experience",
          report.checklist.experience.required,
          report.checklist.experience.bidder,
          report.checklist.experience.status ? "PASS" : "FAIL",
        ],

        [
          "Certifications",
          report.checklist.certifications.required,
          report.checklist.certifications.bidder,
          report.checklist.certifications.status ? "PASS" : "FAIL",
        ],

        [
          "Project Relevance",
          report.checklist.projectRelevance.required,
          report.checklist.projectRelevance.bidder,
          report.checklist.projectRelevance.status ? "PASS" : "FAIL",
        ],
      ],
    });

    // STRENGTHS
    const strengthsY = (doc as any).lastAutoTable.finalY + 20;

    doc.setFontSize(16);

    doc.text("Strengths", 14, strengthsY);

    doc.setFontSize(12);

    report.strengths.forEach((item, index) => {
      doc.text(`• ${item}`, 18, strengthsY + 10 + index * 8);
    });

    // GAPS
    const gapsY = strengthsY + 20 + report.strengths.length * 8;

    doc.setFontSize(16);

    doc.text("Compliance Gaps", 14, gapsY);

    doc.setFontSize(12);

    report.gaps.forEach((item, index) => {
      doc.text(`• ${item}`, 18, gapsY + 10 + index * 8);
    });

    // RECOMMENDATION
    const recommendationY = gapsY + 20 + report.gaps.length * 8;

    doc.setFontSize(16);

    doc.text("Final Recommendation", 14, recommendationY);

    doc.setFontSize(12);

    const recommendationLines = doc.splitTextToSize(report.recommendation, 180);

    doc.text(recommendationLines, 14, recommendationY + 10);

    // SAVE PDF
    doc.save("AI_Procurement_Report.pdf");

    toast.success("PDF report downloaded successfully");
  }

  async function handleAnalyze() {
    if (!tenderFile || !bidderFile) {
      toast.error("Please upload both tender and bidder PDFs");

      return;
    }

    setLoading(true);

    try {
      // PARSE PDFs
      const tenderRes = await parsePDF(tenderFile);

      const bidderRes = await parsePDF(bidderFile);

      // AI ANALYSIS
      const aiRes = await fetch("/api/analyze", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          tenderText: tenderRes.text,

          bidderText: bidderRes.text,
        }),
      });

      const aiData = await aiRes.json();

      setResult({
        aiReport: aiData.report,
      });

      toast.success("AI procurement analysis completed");
    } catch (error) {
      console.error(error);

      toast.error("Failed to analyze documents");
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-violet-100 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* HERO */}
        <div className="relative overflow-hidden rounded-[36px] bg-gradient-to-br from-indigo-700 via-violet-700 to-slate-900 p-10 md:p-14 shadow-2xl">
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
        {result?.aiReport && (
          <div className="space-y-8">
            {/* HEADER */}
            <div className="bg-white rounded-[32px] p-8 shadow-xl border border-slate-200">
              <div className="flex items-center justify-between flex-wrap gap-6">
                <div>
                  <h2 className="text-4xl font-black text-slate-900">
                    AI Procurement Report
                  </h2>

                  <p className="text-slate-500 mt-2 text-lg">
                    Intelligent procurement evaluation generated by AI
                  </p>
                </div>

                <div
                  className={`px-6 py-3 rounded-2xl text-lg font-bold ${
                    result.aiReport.eligible
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {result.aiReport.eligible ? "Eligible" : "Not Eligible"}
                </div>
              </div>
            </div>

            {/* SCORE CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-[28px] p-8 shadow-xl border border-slate-200">
                <div className="text-slate-500 font-semibold">AI Score</div>

                <div className="text-6xl font-black mt-3 text-indigo-700">
                  {result.aiReport.score}
                </div>
              </div>

              <div className="bg-white rounded-[28px] p-8 shadow-xl border border-slate-200">
                <div className="text-slate-500 font-semibold">Risk Level</div>

                <div
                  className={`text-4xl font-black mt-3 ${
                    result.aiReport.riskLevel === "Low"
                      ? "text-emerald-600"
                      : result.aiReport.riskLevel === "Medium"
                        ? "text-yellow-600"
                        : "text-red-600"
                  }`}
                >
                  {result.aiReport.riskLevel}
                </div>
              </div>

              <div className="bg-white rounded-[28px] p-8 shadow-xl border border-slate-200">
                <div className="text-slate-500 font-semibold">
                  Recommendation
                </div>

                <div className="text-xl font-bold mt-3 text-slate-800">
                  {result.aiReport.recommendation}
                </div>
              </div>
            </div>

            {/* SUMMARY */}
            <div className="bg-white rounded-[28px] p-8 shadow-xl border border-slate-200">
              <h3 className="text-3xl font-black mb-5">Executive Summary</h3>

              <p className="text-slate-700 leading-8 text-lg">
                {result.aiReport.summary}
              </p>
            </div>

            <ChecklistTable checklist={result.aiReport.checklist} />

            {/* STRENGTHS + GAPS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* STRENGTHS */}
              <div className="bg-white rounded-[28px] p-8 shadow-xl border border-emerald-200">
                <h3 className="text-3xl font-black text-emerald-700 mb-6">
                  Strengths
                </h3>

                <div className="space-y-4">
                  {result.aiReport.strengths.map((item, index) => (
                    <div
                      key={index}
                      className="bg-emerald-50 text-emerald-700 p-4 rounded-2xl"
                    >
                      ✓ {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* GAPS */}
              <div className="bg-white rounded-[28px] p-8 shadow-xl border border-red-200">
                <h3 className="text-3xl font-black text-red-700 mb-6">
                  Compliance Gaps
                </h3>

                <div className="space-y-4">
                  {result.aiReport.gaps.map((item, index) => (
                    <div
                      key={index}
                      className="bg-red-50 text-red-700 p-4 rounded-2xl"
                    >
                      ✗ {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex flex-wrap gap-5 justify-center">
              <button
                onClick={downloadPDF}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-4 rounded-2xl font-bold shadow-lg transition-all duration-300"
              >
                Download PDF Report
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
