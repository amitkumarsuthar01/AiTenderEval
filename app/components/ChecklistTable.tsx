"use client";

import {
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Briefcase,
  BadgeCheck,
  Landmark,
} from "lucide-react";

interface ChecklistTableProps {
  tender: any;
  bidder: any;
  breakdown: {
    turnover: boolean;
    experience: boolean;
    certifications: boolean;
    project: boolean;
  };
}

export default function ChecklistTable({
  tender,
  bidder,
  breakdown,
}: ChecklistTableProps) {
const rows = [
  {
    title: "Annual Turnover",
    icon: Landmark,
    required: `₹${tender.minimum_turnover || 0}`,
    bidder: `₹${bidder.annual_turnover || 0}`,
    status: breakdown.turnover,
  },

  {
    title: "Industry Experience",
    icon: Briefcase,
    required: `${tender.required_experience_years || 0} Years`,
    bidder: `${bidder.years_of_experience || 0} Years`,
    status: breakdown.experience,
  },

  {
    title: "Required Certifications",
    icon: BadgeCheck,

    required:
      tender.required_certifications?.join(", ") ||
      "No certifications required",

    bidder:
      bidder.certifications?.join(", ") ||
      "No certifications found",

    status: breakdown.certifications,
  },

  {
    title: "Project Compatibility",
    icon: ShieldCheck,

    required:
      tender.project_type || "Not specified",

    bidder:
      bidder.past_project_types?.join(", ") ||
      "No project types found",

    status: breakdown.project,
  },
];

  return (
    <div
      className="
        bg-white/80
        backdrop-blur-xl
        rounded-[32px]
        border border-white/40
        overflow-hidden
        shadow-[0_20px_60px_rgba(0,0,0,0.08)]
      "
    >
      {/* Header */}
      <div className="px-8 py-7 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-violet-50">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-bold mb-4">
              AI Compliance Verification
            </div>

            <h2 className="text-3xl font-black text-slate-900">
              Eligibility Checklist
            </h2>

            <p className="text-slate-500 mt-2">
              Smart tender qualification and bidder compliance analysis
            </p>
          </div>

          <div className="bg-white rounded-3xl px-6 py-5 shadow-lg border border-slate-100">
            <p className="text-sm text-slate-500 font-medium">
              Evaluation Criteria
            </p>

            <h3 className="text-4xl font-black text-indigo-700 mt-1">
              4
            </h3>
          </div>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="text-left px-8 py-5 text-slate-600 font-bold text-sm uppercase tracking-wide">
                Criteria
              </th>

              <th className="text-left px-8 py-5 text-slate-600 font-bold text-sm uppercase tracking-wide">
                Tender Requirement
              </th>

              <th className="text-left px-8 py-5 text-slate-600 font-bold text-sm uppercase tracking-wide">
                Bidder Data
              </th>

              <th className="text-left px-8 py-5 text-slate-600 font-bold text-sm uppercase tracking-wide">
                AI Status
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row, index) => {
              const Icon = row.icon;

              return (
                <tr
                  key={index}
                  className="border-b border-slate-100 hover:bg-slate-50/70 transition-all"
                >
                  {/* Criteria */}
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center">
                        <Icon className="w-7 h-7 text-indigo-700" />
                      </div>

                      <div>
                        <h3 className="font-black text-slate-900 text-lg">
                          {row.title}
                        </h3>

                        <p className="text-slate-500 text-sm mt-1">
                          AI procurement validation
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Required */}
                  <td className="px-8 py-6">
                    <div className="bg-slate-100 rounded-2xl px-5 py-4 text-slate-700 font-semibold">
                      {row.required}
                    </div>
                  </td>

                  {/* Bidder */}
                  <td className="px-8 py-6">
                    <div className="bg-indigo-50 rounded-2xl px-5 py-4 text-slate-800 font-semibold">
                      {row.bidder}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-8 py-6">
                    {row.status ? (
                      <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-5 py-3 rounded-2xl font-bold shadow-sm">
                        <CheckCircle2 className="w-5 h-5" />
                        PASS
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-2 bg-red-100 text-red-700 px-5 py-3 rounded-2xl font-bold shadow-sm">
                        <XCircle className="w-5 h-5" />
                        FAIL
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden p-5 space-y-5">
        {rows.map((row, index) => {
          const Icon = row.icon;

          return (
            <div
              key={index}
              className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center">
                  <Icon className="w-7 h-7 text-indigo-700" />
                </div>

                <div>
                  <h3 className="text-xl font-black text-slate-900">
                    {row.title}
                  </h3>

                  <p className="text-slate-500 text-sm mt-1">
                    Procurement compliance validation
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400 font-bold mb-2">
                    Tender Requirement
                  </p>

                  <div className="bg-slate-100 rounded-2xl px-4 py-3 font-semibold text-slate-700">
                    {row.required}
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400 font-bold mb-2">
                    Bidder Information
                  </p>

                  <div className="bg-indigo-50 rounded-2xl px-4 py-3 font-semibold text-slate-800">
                    {row.bidder}
                  </div>
                </div>

                <div>
                  {row.status ? (
                    <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-5 py-3 rounded-2xl font-bold">
                      <CheckCircle2 className="w-5 h-5" />
                      PASS
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 bg-red-100 text-red-700 px-5 py-3 rounded-2xl font-bold">
                      <XCircle className="w-5 h-5" />
                      FAIL
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}