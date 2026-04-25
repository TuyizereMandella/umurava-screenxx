'use client';
import { Plus, Briefcase, ChevronRight, Share2, Globe, EyeOff, X, Link2, Lock, Copy, Check, ExternalLink, Sparkles } from 'lucide-react';
import Link from 'next/link';
import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchJobs, Job } from '../../store/slices/jobsSlice';
import { AppDispatch, RootState } from '../../store/store';
import NoData from '@/components/shared/NoData';
import { api } from '@/lib/api';

function ShareModal({ job, onClose }: { job: Job; onClose: () => void }) {
  const [isPublicLink, setIsPublicLink] = useState(!job.requires_access_code);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const dispatch = useDispatch<AppDispatch>();

  // Generate dynamic link based on the current environment (localhost or production)
  const applicationLink = typeof window !== 'undefined' 
    ? `${window.location.origin}/apply/${job.id}` 
    : `https://screenerx.vercel.app/apply/${job.id}`;

  const toggleAccess = async () => {
    const newIsPublic = !isPublicLink;
    setIsPublicLink(newIsPublic);
    try {
      await api.patch(`/jobs/${job.id}`, { requires_access_code: !newIsPublic });
      dispatch(fetchJobs()); // Refresh the jobs list to get the updated status
    } catch (err) {
      console.error('Failed to update job access:', err);
      // Revert on failure
      setIsPublicLink(!newIsPublic);
    }
  };

  const copy = (text: string, type: 'link' | 'code') => {
    navigator.clipboard.writeText(text);
    if (type === 'link') { setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2000); }
    else { setCopiedCode(true); setTimeout(() => setCopiedCode(false), 2000); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-8 border-b border-gray-100 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#0B1B42]">Share Opening</h2>
            <p className="text-xs text-gray-500 mt-1">Recruitment portal for <strong>{job.title}</strong></p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="flex items-center space-x-3">
              <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center transition-colors", isPublicLink ? "bg-green-100" : "bg-gray-200")}>
                {isPublicLink ? <Globe className="w-5 h-5 text-green-600" /> : <Lock className="w-5 h-5 text-gray-500" />}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">{isPublicLink ? 'Public Listing' : 'Private Access'}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{isPublicLink ? 'Visible to everyone' : 'Access code required'}</p>
              </div>
            </div>
            <button
              onClick={toggleAccess}
              className={clsx(
                "relative w-12 h-6 rounded-full transition-colors duration-300",
                isPublicLink ? "bg-green-500" : "bg-gray-300"
              )}
            >
              <div className={clsx(
                "absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300",
                isPublicLink ? "left-7" : "left-1"
              )}></div>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Application Link</label>
              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
                <p className="flex-1 px-4 py-3 text-sm text-gray-700 truncate font-mono">{applicationLink}</p>
                <button onClick={() => copy(applicationLink, 'link')} className="px-4 py-3 text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-1 font-semibold text-sm">
                  {copiedLink ? <><Check className="w-4 h-4" /> Copied</> : <><Copy className="w-4 h-4" /> Copy</>}
                </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Access Code</label>
              <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                <p className="text-2xl font-bold text-[#0B1B42] tracking-widest font-mono">{job.public_code}</p>
                <button onClick={() => copy(job.public_code, 'code')} className="text-blue-600">
                  {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function JobsPage() {
  const [shareJob, setShareJob] = useState<Job | null>(null);
  const dispatch = useDispatch<AppDispatch>();
  const { list: jobs, status } = useSelector((state: RootState) => state.jobs);

  useEffect(() => {
    dispatch(fetchJobs());
  }, [dispatch]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-[#0B1B42]">Active Positions</h1>
          <p className="text-gray-500 mt-2">Manage your current openings and candidate pipelines.</p>
        </div>
        <Link href="/jobs/create" className="flex items-center px-6 py-3 bg-[#0B1B42] text-white rounded-2xl text-sm font-bold hover:bg-blue-900 transition-all shadow-lg shadow-blue-900/20">
          <Plus className="w-4 h-4 mr-2" />
          Create New Job
        </Link>
      </div>

      <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-50">
          {jobs.length === 0 ? (
            <div className="p-8">
              <NoData 
                icon={Briefcase}
                title="No active positions"
                description="You haven't created any job openings yet. Start your recruitment process by creating your first position."
              />
            </div>
          ) : (
            jobs.map(job => (
              <div key={job.id} className="p-8 hover:bg-gray-50 transition-all flex items-center justify-between group">
                <div className="flex items-center space-x-6">
                  <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                    <Briefcase className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#0B1B42] text-xl">{job.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{job.department} · {job.location}</p>
                    <div className="flex items-center space-x-3 mt-4">
                      <span className={clsx(
                        "text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider",
                        job.priority === 'HIGH' ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"
                      )}>{job.priority}</span>
                      <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700 uppercase tracking-wider">{job.applicant_count || 0} Applicants</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                   <div className="text-right hidden sm:block">
                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Match Score</p>
                     <p className="text-2xl font-bold text-green-600">--%</p>
                   </div>
                   <button
                     onClick={() => setShareJob(job)}
                     className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
                   >
                     <Share2 className="w-5 h-5" />
                   </button>
                   <Link href={`/jobs/${job.id}`} className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-blue-600 transition-all shadow-sm">
                     <ChevronRight className="w-6 h-6" />
                   </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {shareJob && <ShareModal job={shareJob} onClose={() => setShareJob(null)} />}
    </div>
  );
}
