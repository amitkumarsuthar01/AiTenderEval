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

export default function ChecklistTable({
  checklist,
}: ChecklistTableProps) {
  const rows = [
    {
      title: "Annual Turnover",
      icon: Landmark,

      required:
        checklist.turnover.required,

      bidder:
        checklist.turnover.bidder,

      status:
        checklist.turnover.status,
    },

    {
      title: "Industry Experience",
      icon: Briefcase,

      required:
        checklist.experience.required,

      bidder:
        checklist.experience.bidder,

      status:
        checklist.experience.status,
    },

    {
      title:
        "Required Certifications",

      icon: BadgeCheck,

      required:
        checklist.certifications
          .required,

      bidder:
        checklist.certifications
          .bidder,

      status:
        checklist.certifications
          .status,
    },

    {
      title:
        "Project Compatibility",

      icon: ShieldCheck,

      required:
        checklist.projectRelevance
          .required,

      bidder:
        checklist.projectRelevance
          .bidder,

      status:
        checklist.projectRelevance
          .status,
    },
  ];

  return (
    <div className="bg-white rounded-[32px] shadow-xl border border-slate-200 overflow-hidden">

      {/* HEADER */}
      <div className="px-8 py-7 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-violet-50">

        <h2 className="text-3xl font-black text-slate-900">
          AI Compliance Checklist
        </h2>

        <p className="text-slate-500 mt-2">
          Tender requirement vs bidder compliance analysis
        </p>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">

        <table className="w-full">

          <thead className="bg-slate-50 border-b border-slate-100">

            <tr>
              <th className="text-left px-8 py-5 text-slate-600 font-bold">
                Criteria
              </th>

              <th className="text-left px-8 py-5 text-slate-600 font-bold">
                Tender Requirement
              </th>

              <th className="text-left px-8 py-5 text-slate-600 font-bold">
                Bidder Data
              </th>

              <th className="text-left px-8 py-5 text-slate-600 font-bold">
                Status
              </th>
            </tr>
          </thead>

          <tbody>

            {rows.map((row, index) => {
              const Icon = row.icon;

              return (
                <tr
                  key={index}
                  className="border-b border-slate-100"
                >
                  {/* TITLE */}
                  <td className="px-8 py-6">

                    <div className="flex items-center gap-4">

                      <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center">

                        <Icon className="w-7 h-7 text-indigo-700" />
                      </div>

                      <div>
                        <h3 className="font-black text-slate-900 text-lg">
                          {row.title}
                        </h3>
                      </div>
                    </div>
                  </td>

                  {/* REQUIRED */}
                  <td className="px-8 py-6">

                    <div className="bg-slate-100 rounded-2xl px-5 py-4 text-slate-700 font-semibold">
                      {row.required}
                    </div>
                  </td>

                  {/* BIDDER */}
                  <td className="px-8 py-6">

                    <div className="bg-indigo-50 rounded-2xl px-5 py-4 text-slate-800 font-semibold">
                      {row.bidder}
                    </div>
                  </td>

                  {/* STATUS */}
                  <td className="px-8 py-6">

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
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}