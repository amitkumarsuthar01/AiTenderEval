"use client";

import { useState, useRef } from "react";
import { GoogleGenAI, Type } from "@google/genai";
import { 
  UploadCloud, 
  FileText, 
  Building, 
  CheckCircle, 
  XCircle, 
  Download,
  Briefcase,
  Award,
  Loader2,
  AlertCircle,
  FileCheck2,
  ChevronRight,
  TrendingUp,
  Landmark
} from "lucide-react";
import { cn } from "@/lib/utils";

// Make Type cast to any to be safe against varying ts versions
const GenAIType = Type as any;

const MOCK_TENDER = {
  minimum_turnover: 500000,
  required_experience_years: 5,
  required_certifications: ["ISO 9001", "CMMI Level 3"],
  project_type: "Software Development and Maintenance"
};

const MOCK_BIDDER = {
  company_name: "Tech Solutions Inc.",
  annual_turnover: 750000,
  years_of_experience: 6,
  certifications: ["ISO 9001", "AWS Certified Vanguard"],
  past_project_types: ["Enterprise Software Development", "Cloud Migration"]
};

interface AnalysisResult {
    eligible: boolean;
    score: number;
    breakdown: {
        turnover: boolean;
        experience: boolean;
        certifications: boolean;
        project: boolean;
    };
    reasons: string[];
}

export default function Home() {
  const [tenderFile, setTenderFile] = useState<File | null>(null);
  const [bidderFile, setBidderFile] = useState<File | null>(null);
  
  const [tenderData, setTenderData] = useState<any>(null);
  const [bidderData, setBidderData] = useState<any>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [logs, setLogs] = useState<string[]>([]);

  const tenderInputRef = useRef<HTMLInputElement>(null);
  const bidderInputRef = useRef<HTMLInputElement>(null);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, msg]);
  };

  const handleTenderUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setTenderFile(e.target.files[0]);
    }
  };

  const handleBidderUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBidderFile(e.target.files[0]);
    }
  };

  const analyzeEligibility = (tender: any, bidder: any) => {
    let score = 0;
    const reasons: string[] = [];
    
    // Turnover Match (30 pts)
    const turnBid = Number(bidder.annual_turnover) || 0;
    const turnReq = Number(tender.minimum_turnover) || 0;
    const turnoverPass = turnBid >= turnReq;
    if (turnoverPass) {
        score += 30;
        reasons.push(`Turnover requirement met: Bidder turnover ($${turnBid.toLocaleString()}) >= Required ($${turnReq.toLocaleString()})`);
    } else {
         reasons.push(`Turnover requirement failed: Bidder turnover ($${turnBid.toLocaleString()}) < Required ($${turnReq.toLocaleString()})`);
    }
    
    // Experience Match (30 pts)
    const expBid = Number(bidder.years_of_experience) || 0;
    const expReq = Number(tender.required_experience_years) || 0;
    const expPass = expBid >= expReq;
    if (expPass) {
        score += 30;
        reasons.push(`Experience requirement met: ${expBid} yrs >= ${expReq} yrs required`);
    } else {
        reasons.push(`Experience requirement failed: ${expBid} yrs < ${expReq} yrs required`);
    }
    
    // Certifications Match (20 pts)
    let certPass = false;
    const reqCerts = tender.required_certifications || [];
    const bidCerts = bidder.certifications || [];
    if (!Array.isArray(reqCerts) || reqCerts.length === 0) {
        certPass = true;
        reasons.push("No specific certifications required in tender.");
    } else if (Array.isArray(bidCerts)) {
        const matches = reqCerts.filter((rc: string) => 
            bidCerts.some((bc: string) => bc.toLowerCase().includes(rc.toLowerCase()) || rc.toLowerCase().includes(bc.toLowerCase()))
        );
        if (matches.length > 0) {
            certPass = true;
            reasons.push(`Relevant certifications found (${matches.join(", ")}).`);
        } else {
            reasons.push("Required certifications not found in bidder profile.");
        }
    } else {
        reasons.push("Bidder profile missing certifications data.");
    }
    if (certPass) score += 20;

    // Project Type Match (20 pts)
    let projPass = false;
    const reqProj = tender.project_type || "";
    const bidProjs = bidder.past_project_types || [];
    if (!reqProj) {
        projPass = true;
        reasons.push("No specific project domain restrictions.");
    } else if (Array.isArray(bidProjs)) {
        const reqWords = reqProj.toLowerCase().split(/\s+/).filter((w:string)=>w.length>3);
        const match = bidProjs.some((bp: string) => {
            const bpWords = bp.toLowerCase().split(/\s+/).filter((w:string)=>w.length>3);
            return reqWords.some((rw:string) => bpWords.includes(rw));
        });
        if (match || reqWords.length === 0) {
            projPass = true;
            reasons.push("Past project domains align with tender requirements.");
        } else {
             // Fallback partial match
             if (bidProjs.some(bp => bp.toLowerCase().includes(reqProj.toLowerCase().substring(0, 5)))) {
                 projPass = true;
                 reasons.push("Project domains appear partially aligned.");
             } else {
                reasons.push("No significant overlap in previous project domain keywords.");
             }
        }
    } else {
        reasons.push("Bidder profile missing previous projects data.");
    }
    if (projPass) score += 20;

    setAnalysisResult({
        eligible: score >= 70, // Threshold 70%
        score,
        breakdown: {
            turnover: turnoverPass,
            experience: expPass,
            certifications: certPass,
            project: projPass
        },
        reasons
    });
  };

  const handleProcess = async () => {
    setIsProcessing(true);
    setError("");
    setLogs([]);
    setAnalysisResult(null);
    setTenderData(null);
    setBidderData(null);

    try {
      if (!tenderFile || !bidderFile) {
        throw new Error("Both Tender and Bidder documents must be uploaded.");
      }

      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

      // 1. Parse Tender
      addLog("Parsing Tender PDF document...");
      const tFormData = new FormData();
      tFormData.append("file", tenderFile);
      const tRes = await fetch("/api/parse-pdf", { method: "POST", body: tFormData });
      if (!tRes.ok) throw new Error("Failed to parse Tender PDF.");
      const { text: tText } = await tRes.json();

      // 2. Parse Bidder
      addLog("Parsing Bidder PDF document...");
      const bFormData = new FormData();
      bFormData.append("file", bidderFile);
      const bRes = await fetch("/api/parse-pdf", { method: "POST", body: bFormData });
      if (!bRes.ok) throw new Error("Failed to parse Bidder PDF.");
      const { text: bText } = await bRes.json();

      if (!apiKey) {
        addLog("Warning: No Gemini API Key found. Using mock fallback data.");
        throw new Error("Missing API Key. Falling back to structured mock data execution for demonstration.");
      }

      // 3. Extract using Gemini AI
      addLog("Initializing Google GenAI model...");
      const ai = new GoogleGenAI({ apiKey });

      const tenderSchema = {
        type: GenAIType.OBJECT,
        properties: {
          minimum_turnover: { type: GenAIType.NUMBER, description: "numeric value of minimum required turnover. Just the raw number, e.g. 500000" },
          required_experience_years: { type: GenAIType.NUMBER, description: "numeric value of minimum required experience in years" },
          required_certifications: { type: GenAIType.ARRAY, items: { type: GenAIType.STRING }, description: "list of specific required certifications" },
          project_type: { type: GenAIType.STRING, description: "broad domain or category of the project" }
        },
        required: ["minimum_turnover", "required_experience_years", "required_certifications", "project_type"]
      };

      const bidderSchema = {
        type: GenAIType.OBJECT,
        properties: {
          company_name: { type: GenAIType.STRING },
          annual_turnover: { type: GenAIType.NUMBER, description: "Annual turnover numeric value, e.g. 750000" },
          years_of_experience: { type: GenAIType.NUMBER },
          certifications: { type: GenAIType.ARRAY, items: { type: GenAIType.STRING } },
          past_project_types: { type: GenAIType.ARRAY, items: { type: GenAIType.STRING } }
        },
        required: ["company_name", "annual_turnover", "years_of_experience", "certifications", "past_project_types"]
      };

      addLog("Extracting structured criteria from Tender...");
      const tAiRes = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Extract the requested evaluation criteria from this tender document text. If not found exactly, infer 0. Text:\n${tText.substring(0, 20000)}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: tenderSchema,
        }
      });
      const tParsed = JSON.parse(tAiRes.text || "{}");
      setTenderData(tParsed);

      addLog("Extracting company profile from Bidder document...");
      const bAiRes = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Extract the requested company profile information from this bidder document text. Text:\n${bText.substring(0, 20000)}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: bidderSchema,
        }
      });
      const bParsed = JSON.parse(bAiRes.text || "{}");
      setBidderData(bParsed);

      addLog("Running rule-based eligibility engine...");
      analyzeEligibility(tParsed, bParsed);
      addLog("Evaluation complete.");

    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred.");
      // Fallback Demo Behavior
      addLog("Executing fallback protocol...");
      setTimeout(() => {
          setTenderData(MOCK_TENDER);
          setBidderData(MOCK_BIDDER);
          analyzeEligibility(MOCK_TENDER, MOCK_BIDDER);
          setIsProcessing(false);
      }, 1000);
      return; 
    }
    
    setIsProcessing(false);
  };

  const handleDownloadReport = () => {
      alert("Tender Evaluation Report downloaded! (Mock Implementation)");
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col font-sans text-slate-900">
      
      {/* Header Navigation */}
      <header className="bg-white border-b border-slate-200 px-6 sm:px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-inner">
             <Landmark className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 leading-none">GovProcure AI Engine</h1>
            <p className="text-xs text-slate-500 mt-1">Tender Evaluation & Eligibility Analysis System</p>
          </div>
        </div>
        <div className="flex items-center gap-4 hidden sm:flex">
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">
            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span> System Live
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 p-4 sm:p-6 flex flex-col gap-6 max-w-[1400px] mx-auto w-full">
        
        {/* Upload Section */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
           
           {/* Tender Upload */}
           <div 
             className={cn(
                 "bg-white rounded-xl shadow-sm border p-6 flex flex-col items-center justify-center transition-all",
                 tenderFile ? "border-indigo-400 bg-indigo-50/20" : "border-slate-200 border-dashed"
             )}
            >
              <FileCheck2 className={cn("w-10 h-10 mb-3", tenderFile ? "text-indigo-600" : "text-slate-400")} />
              <h3 className="text-sm font-bold text-slate-700 mb-1">Tender Requirements</h3>
              <p className="text-xs text-slate-500 mb-4 text-center">Upload the official Request for Proposal (PDF)</p>
              
              <input 
                 type="file" 
                 accept="application/pdf" 
                 ref={tenderInputRef}
                 onChange={handleTenderUpload}
                 className="hidden" 
              />
              <button 
                onClick={() => tenderInputRef.current?.click()}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
              >
                {tenderFile ? 'Change Document' : 'Browse Files'}
              </button>
              {tenderFile && (
                  <div className="mt-4 flex items-center bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-2 rounded-lg text-xs font-semibold w-full truncate">
                      <CheckCircle className="w-4 h-4 mr-2 shrink-0 text-indigo-500" />
                      <span className="truncate">{tenderFile.name}</span>
                  </div>
              )}
           </div>

           {/* Bidder Upload */}
           <div 
             className={cn(
                 "bg-white rounded-xl shadow-sm border p-6 flex flex-col items-center justify-center transition-all",
                 bidderFile ? "border-indigo-400 bg-indigo-50/20" : "border-slate-200 border-dashed"
             )}
            >
              <Building className={cn("w-10 h-10 mb-3", bidderFile ? "text-indigo-600" : "text-slate-400")} />
              <h3 className="text-sm font-bold text-slate-700 mb-1">Bidder Capability</h3>
              <p className="text-xs text-slate-500 mb-4 text-center">Upload the company's capability statement (PDF)</p>
              
              <input 
                 type="file" 
                 accept="application/pdf" 
                 ref={bidderInputRef}
                 onChange={handleBidderUpload}
                 className="hidden" 
              />
              <button 
                onClick={() => bidderInputRef.current?.click()}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
              >
                {bidderFile ? 'Change Document' : 'Browse Files'}
              </button>
              {bidderFile && (
                  <div className="mt-4 flex items-center bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-2 rounded-lg text-xs font-semibold w-full truncate">
                      <CheckCircle className="w-4 h-4 mr-2 shrink-0 text-indigo-500" />
                      <span className="truncate">{bidderFile.name}</span>
                  </div>
              )}
           </div>

        </section>

        {/* Action Bar */}
        <section className="flex flex-col items-center justify-center py-2 relative">
             <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-200 -z-10" />
             <button
               onClick={handleProcess}
               disabled={isProcessing || !tenderFile || !bidderFile}
               className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 shadow-md transition-all flex items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
             >
                {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Initializing Pipeline...
                    </>
                ) : (
                    <>
                      New Evaluation <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                )}
             </button>
        </section>

        {/* Console Logs / Progress (Only while processing or errors present) */}
        {(isProcessing || error) && (
            <div className="bg-indigo-900 rounded-xl p-5 font-mono text-xs text-indigo-300 overflow-hidden shadow-lg max-h-40 overflow-y-auto w-full border border-indigo-800">
               <h3 className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-2 font-sans">Analysis Activity</h3>
               {error && <div className="text-red-400 mb-2 truncate font-sans">Error: {error}</div>}
               {logs.map((log, i) => (
                   <div key={i} className="flex gap-3 mb-1">
                      <span className="opacity-50">[{new Date().toLocaleTimeString()}]</span>
                      <span className="animate-pulse">{log}</span>
                   </div>
               ))}
               {!isProcessing && error && (
                   <div className="mt-4 pt-2 border-t border-indigo-800/50 text-indigo-400 font-sans">Failover activated. Presenting mock schema payload.</div>
               )}
            </div>
        )}

        {/* Results Dashboard */}
        {analysisResult && tenderData && bidderData && (
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
              
              {/* Left Column: Data Extraction Comparison */}
              <div className="lg:col-span-12 xl:col-span-7 flex flex-col gap-6">
                 
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Tender Panel */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                        <h2 className="text-sm font-bold text-slate-700">Tender Requirements</h2>
                        <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded text-slate-600 font-semibold">Source: AI Extraction</span>
                      </div>
                      <div className="p-5 space-y-4">
                        <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
                          <div className="text-slate-500 font-medium">Min. Turnover</div>
                          <div className="font-semibold text-slate-800 text-right">${tenderData.minimum_turnover?.toLocaleString() || "Not Specified"} / Yr</div>
                          
                          <div className="col-span-2 h-px bg-slate-100"></div>

                          <div className="text-slate-500 font-medium">Req. Experience</div>
                          <div className="font-semibold text-slate-800 text-right">{tenderData.required_experience_years || 0}+ Years</div>
                          
                          <div className="col-span-2 h-px bg-slate-100"></div>

                          <div className="text-slate-500 font-medium col-span-2 mb-1">Mandatory Certs</div>
                          <div className="font-semibold text-slate-800 col-span-2 leading-relaxed">
                            {tenderData.required_certifications?.length > 0 ? tenderData.required_certifications.join(", ") : "None Specified"}
                          </div>

                          <div className="col-span-2 h-px bg-slate-100"></div>

                          <div className="text-slate-500 font-medium col-span-2 mb-1">Project Domain</div>
                          <div className="font-semibold text-slate-800 col-span-2">
                             {tenderData.project_type || "Any Domain"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bidder Panel */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                        <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                           Bidder Capability
                           {analysisResult.eligible && <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
                        </h2>
                        <span className="text-[10px] bg-indigo-100 px-2 py-0.5 rounded text-indigo-600 font-semibold truncate max-w-[120px]">{bidderData.company_name || 'Source'}</span>
                      </div>
                      <div className="p-5 space-y-4">
                        <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm relative">
                          
                          <div className="text-slate-500 font-medium flex items-center gap-1">
                             Turnover
                             {analysisResult.breakdown.turnover ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500"/> : <XCircle className="w-3.5 h-3.5 text-red-500" />}
                          </div>
                          <div className="font-semibold text-slate-800 text-right">${bidderData.annual_turnover?.toLocaleString() || "Not Specified"}</div>
                          
                          <div className="col-span-2 h-px bg-slate-100"></div>

                          <div className="text-slate-500 font-medium flex items-center gap-1">
                             Experience
                             {analysisResult.breakdown.experience ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500"/> : <XCircle className="w-3.5 h-3.5 text-red-500" />}
                          </div>
                          <div className="font-semibold text-slate-800 text-right">{bidderData.years_of_experience || 0} Years</div>
                          
                          <div className="col-span-2 h-px bg-slate-100"></div>

                          <div className="text-slate-500 font-medium col-span-2 mb-1 flex items-center gap-1">
                             Current Certs
                             {analysisResult.breakdown.certifications ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500"/> : <XCircle className="w-3.5 h-3.5 text-amber-500" />}
                          </div>
                          <div className="font-semibold text-slate-800 col-span-2 leading-relaxed">
                             {bidderData.certifications?.length > 0 ? bidderData.certifications.join(", ") : "Missing Profile"}
                          </div>

                          <div className="col-span-2 h-px bg-slate-100"></div>

                          <div className="text-slate-500 font-medium col-span-2 mb-1 flex items-center gap-1">
                             Past Projects
                             {analysisResult.breakdown.project ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500"/> : <AlertCircle className="w-3.5 h-3.5 text-amber-500" />}
                          </div>
                          <div className="font-semibold text-slate-800 col-span-2">
                             {bidderData.past_project_types?.join(", ") || "Not Specified"}
                          </div>
                        </div>
                      </div>
                    </div>
                 </div>

              </div>

              {/* Right Column: Final Scorecard */}
              <div className="lg:col-span-12 xl:col-span-5 flex">
                  
                  {/* Primary Eligibility Card */}
                  <div className={cn(
                      "flex-1 bg-white rounded-xl border-2 shadow-lg flex flex-col p-6",
                      analysisResult.eligible ? "border-emerald-100" : "border-red-100"
                  )}>
                     <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                              "w-14 h-14 rounded-full flex items-center justify-center shadow-sm",
                              analysisResult.eligible ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-red-50 text-red-600 border border-red-100"
                          )}>
                            {analysisResult.eligible ? <CheckCircle className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
                          </div>
                          <div>
                            <h2 className="text-xl font-bold text-slate-800">
                               {analysisResult.eligible ? "Eligibility Confirmed" : "Eligibility Denied"}
                            </h2>
                            <p className="text-xs text-slate-500 mt-1">
                                {analysisResult.eligible ? "Bidder meets qualifying criteria." : "Bidder failed to meet base criteria."}
                            </p>
                          </div>
                        </div>
                        <div className="text-right pl-4 sm:border-l sm:border-slate-100">
                          <div className={cn(
                              "text-4xl font-black",
                              analysisResult.eligible ? "text-emerald-600" : "text-red-600"
                          )}>
                             {analysisResult.score}<span className="text-lg text-slate-400 font-normal">/100</span>
                          </div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Final Score</p>
                        </div>
                     </div>

                     {/* Breakdown Blocks */}
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col">
                          <div className="flex items-center justify-between mb-2">
                             <span className="text-[10px] font-bold text-slate-500 uppercase">Turnover</span>
                             <span className={cn("text-[10px] font-bold", analysisResult.breakdown.turnover ? "text-emerald-600" : "text-red-500")}>
                                 {analysisResult.breakdown.turnover ? "PASS" : "FAIL"}
                             </span>
                          </div>
                          <p className="text-lg font-bold text-slate-700">{analysisResult.breakdown.turnover ? "30/30" : "0/30"}</p>
                          <div className="w-full h-1 bg-slate-200 rounded-full mt-auto">
                              <div className={cn("h-full rounded-full w-full", analysisResult.breakdown.turnover ? "bg-emerald-500" : "bg-red-500 w-0")}></div>
                          </div>
                        </div>

                        <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col">
                          <div className="flex items-center justify-between mb-2">
                             <span className="text-[10px] font-bold text-slate-500 uppercase">Exper.</span>
                             <span className={cn("text-[10px] font-bold", analysisResult.breakdown.experience ? "text-emerald-600" : "text-red-500")}>
                                 {analysisResult.breakdown.experience ? "PASS" : "FAIL"}
                             </span>
                          </div>
                          <p className="text-lg font-bold text-slate-700">{analysisResult.breakdown.experience ? "30/30" : "0/30"}</p>
                          <div className="w-full h-1 bg-slate-200 rounded-full mt-auto">
                              <div className={cn("h-full rounded-full w-full", analysisResult.breakdown.experience ? "bg-emerald-500" : "bg-red-500 w-0")}></div>
                          </div>
                        </div>

                        <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col">
                          <div className="flex items-center justify-between mb-2">
                             <span className="text-[10px] font-bold text-slate-500 uppercase">Certs</span>
                             <span className={cn("text-[10px] font-bold", analysisResult.breakdown.certifications ? "text-emerald-600" : "text-amber-500")}>
                                 {analysisResult.breakdown.certifications ? "PASS" : "PARTIAL"}
                             </span>
                          </div>
                          <p className="text-lg font-bold text-slate-700">{analysisResult.breakdown.certifications ? "20/20" : "0/20"}</p>
                          <div className="w-full h-1 bg-slate-200 rounded-full mt-auto relative">
                              <div className={cn("absolute left-0 top-0 h-full rounded-full", analysisResult.breakdown.certifications ? "w-full bg-emerald-500" : "w-1/2 bg-amber-400")}></div>
                          </div>
                        </div>

                        <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col">
                          <div className="flex items-center justify-between mb-2">
                             <span className="text-[10px] font-bold text-slate-500 uppercase">Domain</span>
                             <span className={cn("text-[10px] font-bold", analysisResult.breakdown.project ? "text-emerald-600" : "text-amber-500")}>
                                  {analysisResult.breakdown.project ? "PASS" : "PARTIAL"}
                             </span>
                          </div>
                          <p className="text-lg font-bold text-slate-700">{analysisResult.breakdown.project ? "20/20" : "10/20"}</p>
                          <div className="w-full h-1 bg-slate-200 rounded-full mt-auto relative">
                              <div className={cn("absolute left-0 top-0 h-full rounded-full", analysisResult.breakdown.project ? "w-full bg-emerald-500" : "w-1/2 bg-amber-400")}></div>
                          </div>
                        </div>
                     </div>

                     {/* Inference Reasons List */}
                     <div className="flex-1 bg-slate-50 rounded-xl p-4 border border-slate-100 text-[11px] overflow-y-auto max-h-40 mb-6">
                        <ul className="space-y-2">
                            {analysisResult.reasons.map((reason, idx) => {
                                const isPositive = reason.includes(" met") || reason.includes("found") || reason.includes("align");
                                return (
                                    <li key={idx} className="flex gap-2 items-start">
                                        <span className="mt-0.5 shrink-0 text-slate-400">•</span>
                                        <span className={cn(isPositive ? "text-slate-600" : "text-amber-700 font-medium")}>{reason}</span>
                                    </li>
                                );
                            })}
                        </ul>
                     </div>

                     <div className="mt-auto flex flex-col sm:flex-row justify-between items-center pt-5 border-t border-slate-100 gap-4">
                        <div className="flex items-center gap-2">
                          <div className={cn("w-2 h-2 rounded-full animate-pulse", analysisResult.eligible ? "bg-emerald-500" : "bg-red-500")}></div>
                          <span className="text-xs text-slate-500 font-medium">Evaluation Complete</span>
                        </div>
                        <div className="flex gap-3 w-full sm:w-auto">
                          <button 
                             onClick={handleDownloadReport}
                             className="w-full sm:w-auto px-5 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-900 transition-colors shadow-sm"
                          >
                            <Download className="w-4 h-4" /> Download Report
                          </button>
                        </div>
                     </div>
                  </div>
              </div>
           </div>
        )}

      </main>

      {/* Footer Status Bar */}
      <footer className="bg-slate-800 text-slate-400 px-6 py-2 text-[10px] flex justify-between mt-auto">
        <div className="flex gap-6 uppercase tracking-widest font-medium hidden sm:flex">
          <span>Session: {new Date().getTime().toString().slice(-6)}</span>
          <span>Model: Gemini API</span>
          <span>Region: asia-southeast</span>
        </div>
        <div className="flex items-center gap-2 mx-auto sm:mx-0">
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
          System Secured & Active
        </div>
      </footer>
    </div>
  );
}
