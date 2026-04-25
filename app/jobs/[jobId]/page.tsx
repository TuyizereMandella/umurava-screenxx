'use client';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Users, CheckCircle, Clock, Settings, MapPin, Briefcase, Sparkles, CheckCircle2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/store';

export default function JobDetailsPage() {
  const params = useParams();
  const jobId = params.jobId as string;
  const router = useRouter();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const { list: allApplicants } = useSelector((state: RootState) => state.applicants);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await api.get(`/jobs/${jobId}`);
        setJob(response.data.data.job);
      } catch (error) {
        console.error('Failed to fetch job:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [jobId]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this job? This action cannot be undone.')) return;
    
    setIsDeleting(true);
    try {
      await api.delete(`/jobs/${jobId}`);
      router.push('/jobs');
    } catch (error) {
      console.error('Failed to delete job:', error);
      alert('Failed to delete job. Please try again.');
      setIsDeleting(false);
    }
  };

  if (loading || !job) {
    return (
      <div className="p-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-500">Loading job intelligence...</p>
      </div>
    );
  }

  const jobApplicants = allApplicants.filter(a => a.job_id === jobId);
  const shortlisted = jobApplicants.filter(a => a.match_score && a.match_score >= 85).length;
  const interviewing = jobApplicants.filter(a => a.status === 'INTERVIEWING').length;

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      {/* Top Navigation */}
      <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center">
          <Link href="/jobs" className="mr-4 text-gray-500 hover:text-gray-800 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-bold text-[#0B1B42]">{job.title}</h1>
              <span className={`px-2.5 py-1 text-[10px] font-bold rounded uppercase tracking-wider ${
                job.status === 'OPEN' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
              }`}>
                {job.status}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{job.department} • {job.location}</p>
          </div>
        </div>
        <div className="flex space-x-3 items-center">
          <button 
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            title="Delete Job"
          >
            <Trash2 className="w-5 h-5" />
          </button>
          <div className="w-px h-6 bg-gray-200 mx-1"></div>
          <Link href={`/jobs/${jobId}/settings`} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm flex items-center">
             <Settings className="w-4 h-4 mr-2" /> Settings
          </Link>
          <Link href={`/jobs/${jobId}/edit`} className="px-4 py-2 bg-[#0B1B42] text-white rounded-lg text-sm font-medium hover:bg-blue-900 transition-colors shadow-sm">
            Edit Job
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 mt-8 space-y-8">
        
        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-3 text-blue-600 mb-2">
              <Users className="w-5 h-5" />
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Pipeline</h3>
            </div>
            <p className="text-3xl font-light text-[#0B1B42]">{jobApplicants.length}</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-3 text-green-600 mb-2">
              <CheckCircle className="w-5 h-5" />
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Shortlisted</h3>
            </div>
            <p className="text-3xl font-light text-[#0B1B42]">{shortlisted}</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-3 text-purple-600 mb-2">
              <Clock className="w-5 h-5" />
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Interviewing</h3>
            </div>
            <p className="text-3xl font-light text-[#0B1B42]">{interviewing}</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-3 text-amber-600 mb-2">
              <Briefcase className="w-5 h-5" />
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Time Open</h3>
            </div>
            <p className="text-3xl font-light text-[#0B1B42]">
              {Math.floor((new Date().getTime() - new Date(job.created_at).getTime()) / (1000 * 60 * 60 * 24))} Days
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-[#0B1B42]">Top AI Matches</h2>
              <Link href="/shortlist" className="text-sm font-medium text-blue-600 hover:underline">View Full Shortlist Analysis</Link>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
               <div className="divide-y divide-gray-100">
                 {jobApplicants.sort((a, b) => (b.match_score || 0) - (a.match_score || 0)).slice(0, 5).map((applicant, i) => (
                   <div key={applicant.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                     <div className="flex items-center space-x-4">
                       <div className="w-10 h-10 bg-[#0B1B42] text-white rounded-lg flex items-center justify-center font-bold">{i + 1}</div>
                       <div>
                         <Link href={`/applicants/${applicant.id}`} className="font-bold text-[#0B1B42] hover:text-blue-600">{applicant.name}</Link>
                         <p className="text-xs text-gray-500">{applicant.email}</p>
                       </div>
                     </div>
                     <div className="text-right">
                       <p className={`text-2xl font-light ${applicant.match_score && applicant.match_score >= 80 ? 'text-green-500' : 'text-amber-500'}`}>
                         {applicant.match_score}%
                       </p>
                     </div>
                   </div>
                 ))}
                 {jobApplicants.length === 0 && (
                   <div className="p-12 text-center text-gray-400 italic">No applicants yet.</div>
                 )}
               </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white border border-blue-100 rounded-xl p-6 shadow-sm">
              <div className="flex items-center space-x-2 text-[#0B1B42] font-bold text-lg mb-4">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <span>AI Baseline Profile</span>
              </div>
              
              {job.ai_baseline ? (
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Technical Depth</h4>
                    <p className="text-sm text-[#0B1B42] leading-relaxed">{job.ai_baseline.technical_depth}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Industry Fit</h4>
                    <p className="text-sm text-[#0B1B42] leading-relaxed">{job.ai_baseline.industry_fit}</p>
                  </div>
                  <div className="pt-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Precision Score</span>
                      <span className="text-sm font-bold text-green-600">{job.ai_baseline.precision}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${job.ai_baseline.precision}%` }}></div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No AI baseline generated for this job.</p>
              )}
            </div>

            <div className="bg-[#0B1B42] rounded-xl p-6 text-white shadow-sm">
               <h3 className="text-sm font-bold uppercase tracking-widest mb-4 opacity-70">Market Intelligence</h3>
               <div className="space-y-4">
                  <div>
                    <p className="text-xs text-blue-300 uppercase tracking-wider">Avg. Salary</p>
                    <p className="text-lg font-bold">{job.ai_baseline?.market_intelligence?.avg_salary || '$--'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-300 uppercase tracking-wider">Availability</p>
                    <span className="inline-block px-2 py-0.5 bg-red-500/20 text-red-300 text-[10px] font-bold rounded uppercase mt-1">
                      {job.ai_baseline?.market_intelligence?.availability || '--'}
                    </span>
                  </div>
               </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
