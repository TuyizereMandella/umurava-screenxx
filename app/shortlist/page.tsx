'use client';
import { Download, Sparkles, CheckCircle2, AlertTriangle, Users, CheckSquare, TrendingUp, Cpu, Globe, X, Search, Trash2, Filter } from 'lucide-react';
import clsx from 'clsx';
import Link from 'next/link';
import NoData from '@/components/shared/NoData';
import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchShortlistedApplicants, updateApplicantStatus } from '../../store/slices/applicantsSlice';
import { fetchDepartments } from '../../store/slices/departmentsSlice';
import { AppDispatch, RootState } from '../../store/store';

export default function Shortlist() {
  const dispatch = useDispatch<AppDispatch>();
  const { list: applicants, status } = useSelector((state: RootState) => state.applicants);
  const { list: departments } = useSelector((state: RootState) => state.departments);
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    dispatch(fetchShortlistedApplicants());
    dispatch(fetchDepartments());
  }, [dispatch]);

  const handleRemoveFromShortlist = async (id: string) => {
    if (!confirm('Are you sure you want to remove this candidate from the shortlist? They will return to the general applicants list.')) return;
    try {
      await dispatch(updateApplicantStatus({ id, status: 'NEW' })).unwrap();
    } catch (err) {
      console.error('Failed to remove candidate:', err);
      alert('Failed to remove candidate. Please try again.');
    }
  };

  const filteredCandidates = useMemo(() => {
    return applicants.filter(app => {
      const isShortlisted = app.status === 'SHORTLISTED';
      const matchesTab = activeTab === 'All' || app.jobs?.department === activeTab;
      const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           app.jobs?.title?.toLowerCase().includes(searchQuery.toLowerCase());
      return isShortlisted && matchesTab && matchesSearch;
    }).sort((a, b) => (b.match_score || 0) - (a.match_score || 0));
  }, [applicants, activeTab, searchQuery]);

  if (status === 'loading' && applicants.length === 0) {
    return (
      <div className="bg-gray-50 min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const topCandidate = filteredCandidates[0];
  const otherCandidates = filteredCandidates.slice(1);

  return (
    <div className="bg-gray-50 min-h-screen p-8 max-w-7xl mx-auto space-y-8 relative">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-[10px] font-bold rounded mb-3 tracking-wider uppercase">AI Verified Selection</span>
          <h1 className="text-3xl font-bold text-[#0B1B42]">Shortlist Center</h1>
          <p className="text-gray-500 mt-2">Managing {applicants.length} elite candidates across {departments.length} departments.</p>
        </div>
        <div className="flex space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by name or role..." 
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 shadow-sm transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Department Tabs */}
      <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide border-b border-gray-200">
        <button 
          onClick={() => setActiveTab('All')}
          className={clsx(
            "px-6 py-3 text-sm font-bold transition-all whitespace-nowrap border-b-2",
            activeTab === 'All' ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
          )}
        >
          All ({applicants.length})
        </button>
        {departments.map(dept => (
          <button 
            key={dept.id}
            onClick={() => setActiveTab(dept.name)}
            className={clsx(
              "px-6 py-3 text-sm font-bold transition-all whitespace-nowrap border-b-2",
              activeTab === dept.name ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            {dept.name} ({applicants.filter(a => a.jobs?.department === dept.name).length})
          </button>
        ))}
      </div>

      {filteredCandidates.length === 0 ? (
        <div className="pt-20">
          <NoData 
            icon={Filter}
            title="No candidates found"
            description={searchQuery ? "No candidates match your current search criteria." : "There are no shortlisted candidates in this department yet."}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Candidates */}
          <div className="lg:col-span-2 space-y-6">
            {/* Top Match Spotlight */}
            {topCandidate && activeTab === 'All' && !searchQuery && (
              <div className="bg-[#0B1B42] text-white rounded-2xl p-8 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Sparkles className="w-40 h-40" />
                </div>
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-blue-500/20 backdrop-blur-md border border-blue-400/30 text-white rounded-2xl flex items-center justify-center text-3xl font-bold shadow-2xl">
                        1
                      </div>
                      <div>
                        <Link href={`/applicants/${topCandidate.id}`} className="text-2xl font-bold hover:text-blue-300 transition-colors">{topCandidate.name}</Link>
                        <p className="text-blue-200 mt-1">{topCandidate.jobs?.title}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-5xl font-light text-blue-400">{topCandidate.match_score || 0}%</span>
                      <p className="text-[10px] font-bold text-blue-300 tracking-wider uppercase">Match Score</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-blue-800/50 pt-8">
                    <div>
                      <div className="flex items-center space-x-2 font-bold mb-4">
                        <Cpu className="w-5 h-5 text-blue-400" />
                        <span>Core Technical DNA</span>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-6">
                        {topCandidate.ai_analysis?.[0]?.technical_dna?.slice(0, 4).map((dna: string, i: number) => (
                          <span key={i} className="px-3 py-1 bg-white/10 text-blue-100 rounded-full text-xs font-medium border border-white/10">{dna}</span>
                        ))}
                      </div>
                      <div className="space-y-4">
                         <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                            <span className="text-sm font-medium text-blue-200">Algorithmic Fit</span>
                            <span className="font-bold">{topCandidate.ai_analysis?.[0]?.algorithmic_fit_score || 0}%</span>
                         </div>
                         <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                            <span className="text-sm font-medium text-blue-200">Architecture Skills</span>
                            <span className="font-bold">{topCandidate.ai_analysis?.[0]?.architecture_score || 0}%</span>
                         </div>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div className="bg-blue-600/20 border border-blue-400/20 p-4 rounded-xl">
                        <p className="text-sm italic text-blue-100">"{topCandidate.ai_analysis?.[0]?.recommendation_summary}"</p>
                      </div>
                      <div className="flex space-x-3">
                         <Link href={`/applicants/${topCandidate.id}`} className="flex-grow py-3 bg-white text-[#0B1B42] rounded-xl text-center text-sm font-bold hover:bg-blue-50 transition-all shadow-lg">Deep Evaluation</Link>
                         <button 
                           onClick={() => handleRemoveFromShortlist(topCandidate.id)}
                           className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/20 transition-all"
                         >
                           <Trash2 className="w-5 h-5" />
                         </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Candidate List Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {(activeTab !== 'All' || searchQuery ? filteredCandidates : otherCandidates).map((candidate, idx) => (
                <div key={candidate.id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col group relative">
                  <button 
                    onClick={() => handleRemoveFromShortlist(candidate.id)}
                    className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="flex justify-between items-start mb-6 pr-8">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-50 text-gray-400 border border-gray-100 rounded-xl flex items-center justify-center font-bold text-sm">
                        {(activeTab !== 'All' || searchQuery) ? idx + 1 : idx + 2}
                      </div>
                      <div>
                        <h3 className="font-bold text-[#0B1B42] truncate max-w-[140px]">{candidate.name}</h3>
                        <p className="text-xs text-gray-400 font-medium truncate max-w-[140px]">{candidate.jobs?.title}</p>
                      </div>
                    </div>
                    <span className="text-2xl font-light text-green-500">{candidate.match_score || 0}%</span>
                  </div>
                  
                  <div className="mb-6 flex-grow bg-gray-50/50 p-3 rounded-xl border border-gray-100/50">
                    <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
                      {candidate.ai_analysis?.[0]?.recommendation_summary || 'Top matches found for core requirements.'}
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-6 mt-auto">
                    {candidate.ai_analysis?.[0]?.technical_dna?.slice(0, 3).map((dna: string, i: number) => (
                      <span key={i} className="px-2.5 py-1 bg-white text-gray-600 rounded-lg border border-gray-200 text-[10px] font-bold">{dna}</span>
                    ))}
                  </div>
                  
                  <Link href={`/applicants/${candidate.id}`} className="block text-center w-full py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-[#0B1B42] hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm">View Analysis</Link>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Analytics */}
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-[#0B1B42] mb-6">Talent Statistics</h2>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Current List</p>
                      <p className="text-lg font-bold text-[#0B1B42]">{filteredCandidates.length}</p>
                    </div>
                  </div>
                  <TrendingUp className="w-6 h-6 text-green-500 opacity-20" />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                      <CheckSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Avg. Score</p>
                      <p className="text-lg font-bold text-[#0B1B42]">
                        {filteredCandidates.length > 0 
                          ? Math.round(filteredCandidates.reduce((acc, curr) => acc + (curr.match_score || 0), 0) / filteredCandidates.length)
                          : 0}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-gray-100">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Department Density</h3>
                <div className="space-y-4">
                  {departments.slice(0, 4).map(dept => {
                    const count = applicants.filter(a => a.jobs?.department === dept.name).length;
                    const percent = applicants.length > 0 ? (count / applicants.length) * 100 : 0;
                    return (
                      <div key={dept.id}>
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span className="text-gray-700">{dept.name}</span>
                          <span className="text-[#0B1B42]">{count}</span>
                        </div>
                        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-blue-600 h-full transition-all duration-500" style={{width: `${percent}%`}}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-6 text-white shadow-xl">
              <Sparkles className="w-8 h-8 mb-4 text-blue-200" />
              <h2 className="text-lg font-bold mb-2">Smart Sourcing Tip</h2>
              <p className="text-sm text-blue-100 leading-relaxed">
                Your shortlisted candidates in <strong className="text-white">Engineering</strong> are 20% higher than the market average for match accuracy. Consider moving fast on the top 2.
              </p>
              <button className="mt-6 w-full py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-sm font-bold hover:bg-white/20 transition-all">
                Generate Strategy Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
