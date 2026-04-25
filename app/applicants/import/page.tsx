'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, CheckCircle, AlertCircle, Loader2, FileText, ChevronRight, Briefcase, UserPlus, Sparkles } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchJobs } from '../../../store/slices/jobsSlice';
import { AppDispatch, RootState } from '../../../store/store';
import { api } from '../../../lib/api';
import clsx from 'clsx';
import Link from 'next/link';

export default function ImportCandidates() {
  const dispatch = useDispatch<AppDispatch>();
  const { list: jobs, status: jobsStatus } = useSelector((state: RootState) => state.jobs);
  
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [files, setFiles] = useState<File[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [results, setResults] = useState<{ name: string; status: 'success' | 'error'; message: string }[]>([]);

  useEffect(() => {
    dispatch(fetchJobs());
  }, [dispatch]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleImport = async () => {
    if (!selectedJobId || files.length === 0) return;

    setIsImporting(true);
    setResults([]);

    for (const file of files) {
      const formData = new FormData();
      formData.append('jobId', selectedJobId);
      formData.append('resume', file);

      try {
        const response = await api.post('/applicants/import', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        setResults(prev => [...prev, { 
          name: response.data.data.applicant.name || file.name, 
          status: 'success', 
          message: 'Analyzed & Shortlisted' 
        }]);
      } catch (err: any) {
        setResults(prev => [...prev, { 
          name: file.name, 
          status: 'error', 
          message: err.response?.data?.message || 'AI Processing Failed' 
        }]);
      }
    }

    setIsImporting(false);
  };

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#0B1B42] mb-2">Import Candidates</h1>
        <p className="text-gray-500 font-medium">Upload CVs to automatically create candidates and run AI analysis.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Selection Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
            <div className="mb-8">
              <label className="block text-sm font-bold text-[#0B1B42] uppercase tracking-wider mb-3">
                1. Select Target Job
              </label>
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              >
                <option value="">Choose a job role...</option>
                {jobs.map(job => (
                  <option key={job.id} value={job.id}>{job.title} ({job.department})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-[#0B1B42] uppercase tracking-wider mb-3">
                2. Upload CVs/Resumes
              </label>
              <div 
                className={clsx(
                  "border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer",
                  files.length > 0 ? "border-blue-500 bg-blue-50/30" : "border-gray-200 hover:border-blue-400"
                )}
                onClick={() => document.getElementById('cv-upload')?.click()}
              >
                <input
                  id="cv-upload"
                  type="file"
                  multiple
                  accept=".pdf,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                    <Upload className="w-8 h-8" />
                  </div>
                  {files.length > 0 ? (
                    <div>
                      <p className="text-[#0B1B42] font-bold">{files.length} Files Selected</p>
                      <p className="text-sm text-blue-600 font-medium mt-1">Click to change files</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-[#0B1B42] font-bold text-lg">Click or Drop CVs here</p>
                      <p className="text-sm text-gray-500 font-medium mt-1">Supports PDF and DOCX (Max 10MB each)</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={handleImport}
              disabled={!selectedJobId || files.length === 0 || isImporting}
              className={clsx(
                "w-full mt-8 py-4 rounded-xl font-bold text-white transition-all shadow-lg flex items-center justify-center space-x-2",
                !selectedJobId || files.length === 0 || isImporting
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 active:transform active:scale-[0.98]"
              )}
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processing with ScreenerX AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Start AI Batch Import</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Side */}
        <div className="space-y-6">
          <div className="bg-[#0B1B42] text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
             <div className="relative z-10">
               <h3 className="font-bold text-lg mb-2 flex items-center">
                 <Terminal className="w-5 h-5 mr-2 text-blue-400" />
                 AI Processing Status
               </h3>
               <div className="space-y-3 mt-6">
                 {results.length === 0 && !isImporting && (
                   <p className="text-blue-200 text-sm italic">Ready for automated processing...</p>
                 )}
                 {isImporting && results.length === 0 && (
                   <div className="flex items-center space-x-3 text-sm text-blue-300">
                     <Loader2 className="w-4 h-4 animate-spin" />
                     <span>ScreenerX is reading documents...</span>
                   </div>
                 )}
                 <AnimatePresence>
                   {results.map((res, i) => (
                     <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={i} 
                        className={clsx(
                          "flex items-center justify-between p-3 rounded-lg text-sm font-medium",
                          res.status === 'success' ? "bg-white/10 text-green-400" : "bg-red-500/20 text-red-400"
                        )}
                      >
                        <div className="flex items-center space-x-2 overflow-hidden">
                          {res.status === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                          <span className="truncate">{res.name}</span>
                        </div>
                        <span className="text-[10px] uppercase font-bold tracking-widest shrink-0 ml-2">{res.message}</span>
                     </motion.div>
                   ))}
                 </AnimatePresence>
               </div>
             </div>
             <div className="absolute top-0 right-0 p-4 opacity-10">
               <UserPlus className="w-24 h-24 rotate-12" />
             </div>
          </div>

          {results.some(r => r.status === 'success') && !isImporting && (
            <Link href="/applicants" className="flex items-center justify-between p-4 bg-white border border-blue-100 rounded-xl group hover:bg-blue-50 transition-all">
              <div>
                <p className="text-sm font-bold text-[#0B1B42]">Success! Candidates Ready</p>
                <p className="text-[11px] text-gray-500 font-medium">View them in the applicant pool.</p>
              </div>
              <ChevronRight className="w-5 h-5 text-blue-500 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// Icons for the page
const Terminal = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>
);
