'use client';
import { motion } from 'framer-motion';
import { Download, Users, CheckCircle, Clock, Briefcase, ChevronRight, ChevronLeft, Sparkles, Calendar, UserPlus, Lightbulb, Plus, Terminal, Palette, ArrowUpRight } from 'lucide-react';
import clsx from 'clsx';
import Link from 'next/link';
import { useRef, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchJobs } from '../../store/slices/jobsSlice';
import { fetchApplicants } from '../../store/slices/applicantsSlice';
import { fetchAuditLogs } from '../../store/slices/auditSlice';
import { AppDispatch, RootState } from '../../store/store';
import { api } from '../../lib/api';

export default function Dashboard() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [aiTip, setAiTip] = useState<string>("Analyzing your recruitment funnels...");

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const dispatch = useDispatch<AppDispatch>();
  const { list: jobs } = useSelector((state: RootState) => state.jobs);
  const { list: applicants } = useSelector((state: RootState) => state.applicants);
  const { list: auditLogs, status: auditStatus } = useSelector((state: RootState) => state.audit);
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    dispatch(fetchJobs());
    dispatch(fetchApplicants());
    if (auditStatus === 'idle') {
      dispatch(fetchAuditLogs());
    }

    // Fetch AI Intelligence Tip
    const fetchInsight = async () => {
      try {
        const response = await api.get('/dashboard/insight');
        setAiTip(response.data.data.insight);
      } catch (error) {
        console.error('Failed to fetch AI insight:', error);
      }
    };
    fetchInsight();
  }, [dispatch, auditStatus]);

  const getLogIcon = (actionType: string) => {
    const type = actionType.toLowerCase();
    if (type.includes('screening') || type.includes('analysis')) return { icon: Sparkles, color: 'text-indigo-500' };
    if (type.includes('candidate') || type.includes('applicant')) return { icon: UserPlus, color: 'text-blue-500' };
    if (type.includes('interview') || type.includes('schedule')) return { icon: Calendar, color: 'text-purple-500' };
    return { icon: CheckCircle, color: 'text-green-500' };
  };

  // Aggregate stats
  const totalApplicants = applicants.length;
  const activeJobsCount = jobs.length;
  
  // Calculate avg match score (ignoring nulls)
  const scoredApplicants = applicants.filter(a => a.match_score !== null);
  const avgMatchScore = scoredApplicants.length > 0 
    ? Math.round(scoredApplicants.reduce((sum, a) => sum + (a.match_score || 0), 0) / scoredApplicants.length)
    : 0;

  // Calculate avg time to shortlist
  const analyzedApplicants = applicants.filter(a => a.ai_analysis && a.ai_analysis.length > 0);
  const totalDaysToShortlist = analyzedApplicants.reduce((sum, a) => {
    const start = new Date(a.applied_at);
    const end = new Date(a.ai_analysis![0].created_at);
    return sum + Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }, 0);
  const avgTimeToShortlist = analyzedApplicants.length > 0 
    ? (totalDaysToShortlist / analyzedApplicants.length).toFixed(1) 
    : "0.0";

  // Calculate trends (comparing last 7 days to previous 7 days)
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const last7DaysApps = applicants.filter(a => new Date(a.applied_at) > sevenDaysAgo).length;
  const prev7DaysApps = applicants.filter(a => {
    const d = new Date(a.applied_at);
    return d > fourteenDaysAgo && d <= sevenDaysAgo;
  }).length;

  let appTrend = "";
  if (prev7DaysApps > 0) {
    const diff = ((last7DaysApps - prev7DaysApps) / prev7DaysApps) * 100;
    appTrend = `${diff > 0 ? '+' : ''}${Math.round(diff)}%`;
  } else if (last7DaysApps > 0) {
    appTrend = "+100%";
  }

  const last7DaysScore = applicants.filter(a => a.match_score !== null && new Date(a.applied_at) > sevenDaysAgo);
  const prev7DaysScore = applicants.filter(a => a.match_score !== null && new Date(a.applied_at) > fourteenDaysAgo && new Date(a.applied_at) <= sevenDaysAgo);
  
  let scoreTrend = "";
  if (prev7DaysScore.length > 0 && last7DaysScore.length > 0) {
    const avgLast = last7DaysScore.reduce((s, a) => s + (a.match_score || 0), 0) / last7DaysScore.length;
    const avgPrev = prev7DaysScore.reduce((s, a) => s + (a.match_score || 0), 0) / prev7DaysScore.length;
    const diff = ((avgLast - avgPrev) / avgPrev) * 100;
    scoreTrend = `${diff > 0 ? '+' : ''}${Math.round(diff)}%`;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header section */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-[#0B1B42]">
            Welcome back, {user?.full_name?.split(' ')[0] || 'Admin'}!
          </h1>
          <p className="text-gray-500 mt-2">Intelligence-driven oversight for your active recruitment funnels.</p>
        </div>
        <button className="flex items-center px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-[#0B1B42] hover:bg-gray-50 transition-all shadow-sm">
          <Download className="w-4 h-4 mr-2" />
          Export Stats
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard icon={Users} title="TOTAL APPLICANTS" value={totalApplicants.toString()} trend={appTrend} positive={!appTrend.includes('-')} />
        <StatCard icon={CheckCircle} title="AVG. MATCH SCORE" value={`${avgMatchScore}%`} trend={scoreTrend} positive={!scoreTrend.includes('-')} />
        <StatCard icon={Clock} title="TIME TO SHORTLIST" value={`${avgTimeToShortlist} Days`} />
        <StatCard icon={Briefcase} title="ACTIVE JOBS" value={activeJobsCount.toString()} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Opportunities */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-[#0B1B42]">Active Positions</h2>
            <div className="flex items-center space-x-4">
              <Link href="/jobs" className="text-sm font-bold text-[#0B1B42] hover:underline">View all</Link>
              <div className="flex space-x-1">
                <button 
                  onClick={() => scroll('left')}
                  className="p-2 bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 transition-colors text-gray-600"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => scroll('right')}
                  className="p-2 bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 transition-colors text-gray-600"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          
          <div 
            ref={scrollContainerRef}
            className="flex space-x-6 overflow-x-auto pb-4 custom-scrollbar scroll-smooth no-scrollbar"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {jobs.length === 0 ? (
              <div className="flex-1 min-h-[160px] flex items-center justify-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                <div className="text-center p-6">
                  <p className="text-gray-400 font-medium">No active positions yet</p>
                </div>
              </div>
            ) : (
              jobs.slice(0, 5).map((job) => {
                const jobApplicants = applicants.filter(a => a.job_id === job.id && a.match_score !== null);
                const topScore = jobApplicants.length > 0 
                  ? Math.max(...jobApplicants.map(a => a.match_score || 0)) 
                  : "--";

                return (
                  <div key={job.id} className="min-w-[360px]">
                    <JobCard 
                      title={job.title} 
                      dept={`${job.department} · ${job.location}`} 
                      score={topScore} 
                      apps={job.applicant_count || 0} 
                      priority={job.priority} 
                    />
                  </div>
                );
              })
            )}
          </div>

          {/* AI Insight Widget */}
          <div className="bg-gradient-to-r from-[#0B1B42] to-blue-900 rounded-2xl p-8 text-white shadow-xl shadow-blue-900/20 flex items-center justify-between">
            <div className="flex items-start space-x-5">
              <div className="p-3 bg-white/10 rounded-xl">
                <Sparkles className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold">AI Recruiter Assistant</h3>
                <p className="text-blue-200 text-sm mt-1 max-w-md">Our intelligence engine has tracked <span className="text-white font-bold">{totalApplicants} resumes</span>. Found {scoredApplicants.filter(a => a.match_score && a.match_score >= 90).length} high-confidence matches across all active roles.</p>
              </div>
            </div>
            <Link href="/shortlist" className="px-6 py-3 bg-white text-[#0B1B42] rounded-xl text-sm font-bold hover:bg-gray-50 transition-all whitespace-nowrap">
              Review Matches
            </Link>
          </div>
        </div>

        {/* AI Recent Activity */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-[#0B1B42]">AI Recent Activity</h2>
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm divide-y divide-gray-50">
            {auditLogs.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-xs italic">
                No AI activity recorded yet.
              </div>
            ) : (
              auditLogs.slice(0, 5).map((log) => {
                const { icon: Icon, color } = getLogIcon(log.action_type);
                return (
                  <div key={log.id} className="flex items-start space-x-3 py-4 first:pt-0 last:pb-0">
                    <Icon className={clsx("w-5 h-5 shrink-0 mt-0.5", color)} />
                    <div>
                      <p className="text-sm text-gray-800 leading-snug">{log.description}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div className="mt-6 pt-4 text-center">
              <Link href="/audit" className="text-xs font-bold text-[#0B1B42] uppercase tracking-widest hover:underline">AI Activity Log</Link>
            </div>
          </div>

          {/* Quick Tip */}
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 relative overflow-hidden">
             <div className="flex items-center space-x-2 text-[#0B1B42] font-bold text-[10px] uppercase tracking-widest mb-3">
               <Lightbulb className="w-4 h-4" />
               <span>AI Intelligence Tip</span>
             </div>
             <p className="text-sm text-gray-600 italic font-medium leading-relaxed">
               "{aiTip}"
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, title, value, trend, positive }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2.5 bg-gray-50 rounded-xl text-[#0B1B42]">
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span className={clsx(
            "text-[10px] font-bold px-2 py-1 rounded-lg",
            positive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          )}>
            {trend}
          </span>
        )}
      </div>
      <p className="text-[10px] font-bold text-gray-400 tracking-widest mb-1 uppercase">{title}</p>
      <h3 className="text-3xl font-bold text-[#0B1B42]">{value}</h3>
    </div>
  );
}

function JobCard({ title, dept, score, apps, priority }: any) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:border-blue-500/30 transition-all group cursor-pointer">
      <div className="flex justify-between items-start mb-6">
        <div className="w-10 h-10 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center group-hover:bg-blue-50 transition-colors">
          <Terminal className="w-5 h-5 text-blue-600" />
        </div>
        <span className={clsx(
          "text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wider uppercase",
          priority === 'HIGH' ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"
        )}>
          {priority} Priority
        </span>
      </div>
      <h3 className="font-bold text-[#0B1B42] text-lg leading-tight">{title}</h3>
      <p className="text-xs text-gray-400 mt-1 mb-8">{dept}</p>
      
      <div className="flex justify-between items-end border-t border-gray-50 pt-4">
        <div className="flex -space-x-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="w-7 h-7 rounded-full border-2 border-white bg-gray-200"></div>
          ))}
          <div className="w-7 h-7 rounded-full border-2 border-white bg-blue-600 flex items-center justify-center text-[8px] font-bold text-white">
            +{apps}
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Match Score</p>
          <p className={clsx(
            "text-2xl font-bold",
            score !== "--" && score >= 70 ? "text-green-600" : score !== "--" && score >= 50 ? "text-amber-500" : score !== "--" ? "text-red-500" : "text-gray-400"
          )}>{score}{score !== "--" ? "%" : ""}</p>
        </div>
      </div>
    </div>
  );
}
