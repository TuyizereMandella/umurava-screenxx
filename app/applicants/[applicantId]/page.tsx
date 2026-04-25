'use client';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Mail, Phone, MapPin, Download, CheckCircle2, AlertTriangle, Briefcase, GraduationCap, Link as LinkIcon, Calendar, X, Clock, Video, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import clsx from 'clsx';
import { api } from '@/lib/api';
import { Applicant, deleteApplicant } from '@/store/slices/applicantsSlice';
import { AppDispatch } from '@/store/store';
import { Sparkles } from 'lucide-react';

export default function CandidateProfilePage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const applicantId = params.applicantId as string;
  const [applicant, setApplicant] = useState<Applicant | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleSuccess, setScheduleSuccess] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [interviewTypes, setInterviewTypes] = useState<any[]>([]);
  const [scheduleData, setScheduleData] = useState({
    interviewTypeId: '',
    date: '',
    time: '',
    meetUrl: '',
    message: ''
  });

  const fetchApplicant = async () => {
    try {
      const response = await api.get(`/applicants/${applicantId}`);
      setApplicant(response.data.data.applicant);
    } catch (err) {
      console.error('Failed to fetch applicant details:', err);
    }
  };

  useEffect(() => {
    const fetchInterviewTypes = async () => {
      try {
        const response = await api.get('/interviews/types');
        setInterviewTypes(response.data.data.types);
        if (response.data.data.types.length > 0) {
          setScheduleData(prev => ({ ...prev, interviewTypeId: response.data.data.types[0].id }));
        }
      } catch (err) {
        console.error('Failed to fetch interview types:', err);
      }
    };
    if (applicantId) {
      fetchApplicant();
      fetchInterviewTypes();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicantId]);

  const handleTriggerAnalysis = async () => {
    try {
      setIsAnalyzing(true);
      await api.post(`/applicants/${applicantId}/analyze`);
      await fetchApplicant();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to analyze candidate.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDeleteApplicant = async () => {
    if (!confirm('Are you sure you want to delete this applicant? This action cannot be undone.')) return;
    
    try {
      await dispatch(deleteApplicant(applicantId)).unwrap();
      router.push('/applicants');
    } catch (err: any) {
      console.error('Failed to delete applicant', err);
      alert('Failed to delete applicant. Please try again.');
    }
  };

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Calculate endTime from the selected interview type's duration
      const selectedType = interviewTypes.find(t => t.id === scheduleData.interviewTypeId);
      const durationMinutes = selectedType?.duration_minutes || 60;
      const [hours, minutes] = scheduleData.time.split(':').map(Number);
      const endDate = new Date();
      endDate.setHours(hours, minutes + durationMinutes, 0);
      const endTime = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}:00`;

      await api.post('/interviews', {
        applicantId,
        interviewTypeId: scheduleData.interviewTypeId,
        scheduledDate: scheduleData.date,
        startTime: `${scheduleData.time}:00`,
        endTime,
        meetUrl: scheduleData.meetUrl
      });
      setScheduleSuccess(true);
      setTimeout(() => {
        setIsScheduleModalOpen(false);
        setScheduleSuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to schedule interview:', err);
      alert('Failed to schedule interview');
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-12 relative">
      {/* Top Navigation & Actions */}
      <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center">
          <Link href="/applicants" className="mr-4 text-gray-500 hover:text-gray-800 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center space-x-4">
             <div className="w-10 h-10 bg-[#0B1B42] text-white rounded-full flex items-center justify-center font-bold text-lg">
               {applicant?.name.charAt(0) || 'A'}
             </div>
             <div>
               <h1 className="text-xl font-bold text-[#0B1B42]">{applicant?.name || 'Loading...'}</h1>
               <p className="text-xs text-gray-500 mt-0.5">{applicant?.jobs?.title || 'Applicant'}</p>
             </div>
          </div>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={handleDeleteApplicant}
            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
            title="Delete Applicant"
          >
            <Trash2 className="w-5 h-5" />
          </button>
          <div className="w-px h-8 bg-gray-200 self-center mx-1"></div>
          <button 
            onClick={handleTriggerAnalysis}
            disabled={isAnalyzing || (applicant?.ai_analysis?.length ?? 0) > 0}
            className={clsx(
              "px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center disabled:opacity-50",
              (applicant?.ai_analysis?.length ?? 0) > 0 ? "bg-green-600 hover:bg-green-700 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            )}
          >
            {(applicant?.ai_analysis?.length ?? 0) > 0 ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Analysis Completed
              </>
            ) : (
              <>
                <Sparkles className={clsx("w-4 h-4 mr-2", isAnalyzing && "animate-spin")} />
                {isAnalyzing ? 'Analyzing...' : 'Run AI Analysis'}
              </>
            )}
          </button>
          <button 
            onClick={() => setIsScheduleModalOpen(true)}
            className="px-4 py-2 bg-[#0B1B42] text-white rounded-lg text-sm font-medium hover:bg-blue-900 transition-colors shadow-sm flex items-center"
          >
            <Calendar className="w-4 h-4 mr-2" /> Schedule Interview
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: AI Assessment */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">ScreenerX AI Match</h2>
                <span className="text-3xl font-light text-green-500">{applicant?.match_score || '--'}%</span>
             </div>

             <div className="space-y-6">
               <div>
                 <span className="flex items-center text-[10px] font-bold text-green-600 tracking-wider uppercase mb-3">
                   <CheckCircle2 className="w-4 h-4 mr-1" /> Core Strengths
                 </span>
                 <ul className="space-y-3">
                   {applicant?.ai_analysis?.[0]?.strengths?.length ? (
                     applicant.ai_analysis[0].strengths.map((strength: string, i: number) => (
                       <li key={i} className="text-sm text-gray-700 bg-green-50/50 p-2 rounded border border-green-100">
                         {strength}
                       </li>
                     ))
                   ) : (
                     <li className="text-xs text-gray-400 italic">No strengths identified yet.</li>
                   )}
                 </ul>
               </div>

               <div>
                 <span className="flex items-center text-[10px] font-bold text-amber-600 tracking-wider uppercase mb-3">
                   <AlertTriangle className="w-4 h-4 mr-1" /> Potential Gaps
                 </span>
                 <ul className="space-y-3">
                   {applicant?.ai_analysis?.[0]?.gaps?.length ? (
                     applicant.ai_analysis[0].gaps.map((gap: string, i: number) => (
                       <li key={i} className="text-sm text-gray-700 bg-amber-50/50 p-2 rounded border border-amber-100">
                         {gap}
                       </li>
                     ))
                   ) : (
                     <li className="text-xs text-gray-400 italic">No gaps identified yet.</li>
                   )}
                 </ul>
               </div>

               <div className="pt-4 border-t border-gray-100">
                 <p className="text-xs text-indigo-800 italic bg-indigo-50 p-3 rounded-lg border border-indigo-100 leading-relaxed">
                   "{applicant?.ai_analysis?.[0]?.recommendation_summary || 'Trigger AI Analysis to get a recommendation summary for this candidate.'}"
                 </p>
               </div>
             </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
             <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Contact & Links</h2>
             <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-700">
                  <Mail className="w-4 h-4 text-gray-400 mr-3" /> {applicant?.email}
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <Phone className="w-4 h-4 text-gray-400 mr-3" /> {applicant?.phone || 'Not provided'}
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <MapPin className="w-4 h-4 text-gray-400 mr-3" /> {applicant?.location || 'Not provided'}
                </div>
                {applicant?.linkedin_url && (
                  <div className="flex items-center text-sm text-blue-600 hover:underline cursor-pointer pt-2">
                    <LinkIcon className="w-4 h-4 mr-3" /> 
                    <a href={applicant.linkedin_url} target="_blank" rel="noopener noreferrer">
                      {applicant.linkedin_url.replace('https://www.', '')}
                    </a>
                  </div>
                )}
             </div>
          </div>

          {/* Screening Answers */}
          {applicant?.answers && Object.keys(applicant.answers).length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Screening Answers</h2>
              <div className="space-y-4">
                {Object.entries(applicant.answers).map(([key, value]) => (
                  <div key={key} className="border-l-2 border-blue-200 pl-3">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Question {key.replace('q','')}</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{value as string}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Parsed Resume */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
            <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-4">
               <h2 className="text-xl font-bold text-[#0B1B42]">Parsed Resume Data</h2>
               {applicant?.resume_url ? (
                 <a href={applicant.resume_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 flex items-center hover:underline">
                   <Download className="w-4 h-4 mr-1" /> View Original PDF
                 </a>
               ) : (
                 <span className="text-sm font-medium text-gray-400 flex items-center">
                   No resume uploaded
                 </span>
               )}
            </div>

            <div className="space-y-8">
               {/* Experience */}
               <div>
                 <div className="flex items-center space-x-2 text-[#0B1B42] font-bold mb-4">
                   <Briefcase className="w-5 h-5 text-blue-600" />
                   <span>Experience</span>
                 </div>
                 
                 {applicant?.ai_analysis && applicant.ai_analysis.length > 0 ? ( 
                   <div className="space-y-6 pl-2 border-l-2 border-blue-100 ml-2">
                      <div className="relative pl-6">
                        <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[7px] top-1.5 ring-4 ring-white"></div>
                        <h3 className="font-bold text-[#0B1B42]">Structured Data Pending</h3>
                        <p className="text-sm text-gray-500 font-medium">Currently using Gemini Flash for generic analysis.</p>
                        <p className="text-sm text-gray-700 mt-2 leading-relaxed">
                          Full resume parsing capability will extract structured work experience here.
                        </p>
                      </div>
                   </div>
                 ) : (
                   <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-8 text-center ml-2">
                     <p className="text-sm text-gray-400">Run AI Analysis to extract insights.</p>
                   </div>
                 )}
               </div>

               {/* Education */}
               <div>
                 <div className="flex items-center space-x-2 text-[#0B1B42] font-bold mb-4">
                   <GraduationCap className="w-5 h-5 text-blue-600" />
                   <span>Education</span>
                 </div>
                 
                 {applicant?.ai_analysis && applicant.ai_analysis.length > 0 ? (
                   <div className="space-y-4 pl-2 border-l-2 border-blue-100 ml-2">
                      <div className="relative pl-6">
                        <div className="absolute w-3 h-3 bg-gray-300 rounded-full -left-[7px] top-1.5 ring-4 ring-white"></div>
                        <h3 className="font-bold text-[#0B1B42]">Degree Info Pending</h3>
                        <p className="text-sm text-gray-700 mt-1">Full extraction capability required.</p>
                      </div>
                   </div>
                 ) : (
                   <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-8 text-center ml-2">
                     <p className="text-sm text-gray-400">No education data found.</p>
                   </div>
                 )}
               </div>
            </div>
          </div>
        </div>

      </div>

      {/* Schedule Interview Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-y-auto max-h-[90vh] animate-in fade-in zoom-in-95 duration-200 custom-scrollbar">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-[#0B1B42]">Schedule Interview</h2>
              <button 
                onClick={() => setIsScheduleModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {scheduleSuccess ? (
              <div className="p-12 flex flex-col items-center justify-center text-center">
                 <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-4">
                   <CheckCircle2 className="w-8 h-8" />
                 </div>
                 <h3 className="text-xl font-bold text-[#0B1B42] mb-2">Invitation Sent!</h3>
                 <p className="text-sm text-gray-500">Dr. Aris Thorne has been notified and sent a calendar invite link.</p>
              </div>
            ) : (
              <form onSubmit={handleSchedule} className="p-6 space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 tracking-wider mb-2 uppercase">Interview Type</label>
                  <select 
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    value={scheduleData.interviewTypeId}
                    onChange={(e) => setScheduleData({...scheduleData, interviewTypeId: e.target.value})}
                    required
                  >
                    <option value="">Select a type...</option>
                    {interviewTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.name} ({type.duration_minutes}m)</option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 tracking-wider mb-2 uppercase">Date</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar className="h-4 w-4 text-gray-400" />
                      </div>
                      <input 
                        type="date" 
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                        value={scheduleData.date}
                        onChange={(e) => setScheduleData({...scheduleData, date: e.target.value})}
                        required 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 tracking-wider mb-2 uppercase">Time</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Clock className="h-4 w-4 text-gray-400" />
                      </div>
                      <input 
                        type="time" 
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                        value={scheduleData.time}
                        onChange={(e) => setScheduleData({...scheduleData, time: e.target.value})}
                        required 
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 tracking-wider mb-2 uppercase">Meeting URL</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Video className="h-4 w-4 text-gray-400" />
                    </div>
                    <input 
                      type="url" 
                      placeholder="https://meet.google.com/xxx-xxxx-xxx" 
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                      value={scheduleData.meetUrl}
                      onChange={(e) => setScheduleData({...scheduleData, meetUrl: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 tracking-wider mb-2 uppercase">Message to Candidate</label>
                  <textarea 
                    rows={3} 
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    value={scheduleData.message}
                    onChange={(e) => setScheduleData({...scheduleData, message: e.target.value})}
                  ></textarea>
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-end space-x-3">
                  <button 
                    type="button" 
                    onClick={() => setIsScheduleModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-[#0B1B42] text-white rounded-lg text-sm font-medium hover:bg-blue-900 transition-colors shadow-sm"
                  >
                    Send Invite
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
