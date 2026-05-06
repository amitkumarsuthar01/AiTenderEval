"use client";

import { UploadCloud, CheckCircle2, FileText } from "lucide-react";

interface UploadCardProps {
  title: string;
  subtitle: string;
  file: File | null;
  onChange: (file: File) => void;
  inputKey?: number;
}

export default function UploadCard({
  title,
  subtitle,
  file,
  onChange,
  inputKey,
}: UploadCardProps) {
  return (
    <label
      className="
        group
        relative
        overflow-hidden
        rounded-[30px]
        border border-white/40
        bg-white/70
        backdrop-blur-xl
        p-8 md:p-10
        flex flex-col items-center justify-center
        cursor-pointer
        transition-all duration-300
        hover:scale-[1.02]
        hover:shadow-[0_20px_60px_rgba(79,70,229,0.18)]
      "
    >
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />

      {/* Animated Circle */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl group-hover:scale-125 transition-all duration-500" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Icon */}
        <div
          className="
            w-24 h-24 rounded-3xl
            bg-gradient-to-br from-indigo-500 to-violet-600
            flex items-center justify-center
            shadow-xl
            mb-6
            group-hover:rotate-3
            transition-all duration-300
          "
        >
          {file ? (
            <CheckCircle2 className="w-12 h-12 text-white" />
          ) : (
            <UploadCloud className="w-12 h-12 text-white" />
          )}
        </div>

        {/* Heading */}
        <h2 className="text-2xl font-black text-slate-800 text-center">
          {title}
        </h2>

        {/* Subtitle */}
        <p className="text-slate-500 text-center mt-3 max-w-sm leading-relaxed">
          {subtitle}
        </p>

        {/* Hidden Input */}
        <input
          key={inputKey}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              onChange(e.target.files[0]);
            }
          }}
        />

        {/* Upload State */}
        {file ? (
          <div
            className="
              mt-8
              w-full
              bg-emerald-50
              border border-emerald-200
              rounded-2xl
              p-4
              flex items-center gap-4
            "
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <FileText className="w-6 h-6 text-emerald-600" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-emerald-700">
                PDF Uploaded Successfully
              </p>

              <p className="text-sm text-slate-600 truncate">
                {file.name}
              </p>
            </div>

            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
          </div>
        ) : (
          <div
            className="
              mt-8
              bg-gradient-to-r from-indigo-600 to-violet-600
              hover:from-indigo-700 hover:to-violet-700
              text-white
              px-8 py-4
              rounded-2xl
              text-sm font-bold
              shadow-xl
              transition-all duration-300
              group-hover:scale-105
            "
          >
            Upload PDF Document
          </div>
        )}

        {/* Bottom Hint */}
        {!file && (
          <p className="text-xs text-slate-400 mt-5 text-center">
            Supports government tenders, bidder proposals & compliance PDFs
          </p>
        )}
      </div>
    </label>
  );
}