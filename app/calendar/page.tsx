'use client';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin, Users, Sparkles, User, MoreHorizontal, Plus, X, Video, CheckCircle2, Settings2, Trash2 } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import clsx from 'clsx';
import { useDispatch, useSelector } from 'react-redux';
import { fetchInterviews, updateInterviewThunk, Interview } from '../../store/slices/interviewsSlice';
import { fetchApplicants } from '../../store/slices/applicantsSlice';
import { AppDispatch, RootState } from '../../store/store';
import NoData from '@/components/shared/NoData';
import { api } from '../../lib/api';

function formatTime(timeStr: string) {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':');
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayHours = h % 12 || 12;
  return `${displayHours}:${minutes} ${ampm}`;
}

function formatDateDisplay(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getInitials(name: string) {
  if (!name) return '??';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

export default function CalendarPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { list: rawInterviews, status } = useSelector((state: RootState) => state.interviews);
  const { list: applicants } = useSelector((state: RootState) => state.applicants);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isManageTypesOpen, setIsManageTypesOpen] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [scheduleSuccess, setScheduleSuccess] = useState(false);
  const [isLoadingTypes, setIsLoadingTypes] = useState(false);
  const [interviewTypes, setInterviewTypes] = useState<any[]>([]);
  const [isUpdatingUrl, setIsUpdatingUrl] = useState(false);
  const [editingUrl, setEditingUrl] = useState('');

  // Form states
  const [newType, setNewType] = useState({ name: '', durationMinutes: 30 });
  const [scheduleData, setScheduleData] = useState({
    applicantId: '',
    interviewTypeId: '',
    scheduledDate: '',
    startTime: '',
    endTime: '',
    meetUrl: ''
  });

  useEffect(() => {
    dispatch(fetchInterviews());
    dispatch(fetchApplicants());
    fetchInterviewTypes();
  }, [dispatch]);

  const fetchInterviewTypes = async () => {
    setIsLoadingTypes(true);
    try {
      const res = await api.get('/interviews/types');
      setInterviewTypes(res.data.data.types);
    } catch (error) {
      console.error('Failed to fetch types:', error);
    } finally {
      setIsLoadingTypes(false);
    }
  };

  const handleCreateType = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/interviews/types', newType);
      setNewType({ name: '', durationMinutes: 30 });
      fetchInterviewTypes();
    } catch (error) {
      alert('Failed to create interview type');
    }
  };

  const handleManualSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const type = interviewTypes.find(t => t.id === scheduleData.interviewTypeId);
      const duration = type ? type.duration_minutes : 30;
      
      const [h, m] = scheduleData.startTime.split(':').map(Number);
      const totalMins = m + duration;
      const endH = h + Math.floor(totalMins / 60);
      const endM = totalMins % 60;
      const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00`;

      await api.post('/interviews/schedule', {
        ...scheduleData,
        startTime: `${scheduleData.startTime}:00`,
        endTime
      });

      setScheduleSuccess(true);
      dispatch(fetchInterviews());
      setTimeout(() => {
        setIsScheduleModalOpen(false);
        setScheduleSuccess(false);
        setScheduleData({ applicantId: '', interviewTypeId: '', scheduledDate: '', startTime: '', endTime: '', meetUrl: '' });
      }, 2000);
    } catch (error) {
      alert('Failed to schedule interview');
    }
  };

  const handleUpdateUrl = async () => {
    if (!selectedInterview) return;
    setIsUpdatingUrl(true);
    try {
      await dispatch(updateInterviewThunk({ 
        id: selectedInterview.id, 
        data: { meetUrl: editingUrl } 
      })).unwrap();
      setSelectedInterview({ ...selectedInterview, meet_url: editingUrl });
      alert('Meeting URL updated successfully!');
    } catch (error) {
      alert('Failed to update meeting URL');
    } finally {
      setIsUpdatingUrl(false);
    }
  };

  useEffect(() => {
    if (selectedInterview) {
      setEditingUrl(selectedInterview.meet_url || '');
    }
  }, [selectedInterview]);

  // Calendar Logic
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    if (viewMode === 'month') {
      const firstDay = new Date(year, month, 1).getDay();
      const lastDate = new Date(year, month + 1, 0).getDate();
      const days = [];
      const prevMonthLastDate = new Date(year, month, 0).getDate();
      for (let i = firstDay - 1; i >= 0; i--) {
        days.push({ day: prevMonthLastDate - i, current: false, date: new Date(year, month, -i) });
      }
      for (let i = 1; i <= lastDate; i++) {
        days.push({ day: i, current: true, date: new Date(year, month, i) });
      }
      const remaining = 35 - days.length;
      for (let i = 1; i <= (remaining < 0 ? 0 : remaining); i++) {
        days.push({ day: i, current: false, date: new Date(year, month + 1, i) });
      }
      return days;
    } else {
      // Week View
      const dayOfWeek = currentDate.getDay();
      const diff = currentDate.getDate() - dayOfWeek;
      const startOfWeek = new Date(currentDate.setDate(diff));
      const days = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        days.push({ day: d.getDate(), current: true, date: d });
      }
      return days;
    }
  }, [currentDate, viewMode]);

  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') newDate.setMonth(currentDate.getMonth() - 1);
    else newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') newDate.setMonth(currentDate.getMonth() + 1);
    else newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const interviews = (rawInterviews || []).map(inv => ({
    ...inv,
    candidate: inv.applicants?.name || 'Unknown Candidate',
    role: inv.applicants?.jobs?.title || 'Unknown Role',
    time: `${formatTime(inv.start_time)} - ${formatTime(inv.end_time)}`,
    displayDate: formatDateDisplay(new Date(inv.scheduled_date)),
    isoDate: inv.scheduled_date,
    type: inv.interview_types?.name || 'Interview',
    avatar: getInitials(inv.applicants?.name),
  }));

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-gray-50 min-h-screen pb-12 relative">
      <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-bold text-[#0B1B42]">Interview Calendar</h1>
          <p className="text-xs text-gray-500 mt-0.5">Manage your upcoming screening sessions and sync with AI scheduling.</p>
        </div>
        <div className="flex space-x-3">
          <button onClick={() => setIsManageTypesOpen(true)} className="px-4 py-2 bg-white border border-gray-200 text-[#0B1B42] rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center transition-colors">
            <Settings2 className="w-4 h-4 mr-2" /> Interview Types
          </button>
          <button onClick={() => setIsScheduleModalOpen(true)} className="px-4 py-2 bg-[#0B1B42] text-white rounded-lg text-sm font-medium hover:bg-blue-900 shadow-sm flex items-center transition-colors">
            <Plus className="w-4 h-4 mr-2" /> Manual Schedule
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 mt-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#0B1B42] min-w-[220px]">
                {viewMode === 'month' 
                  ? currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                  : `Week of ${currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
              </h2>
              <div className="flex items-center space-x-2">
                <button onClick={handlePrev} className="p-2 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors">
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
                <button onClick={handleNext} className="p-2 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors">
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
                <div className="h-6 w-px bg-gray-200 mx-2"></div>
                <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
                  <button onClick={() => setViewMode('month')} className={clsx("px-3 py-1 text-xs font-bold rounded transition-all", viewMode === 'month' ? "bg-white text-[#0B1B42] shadow-sm" : "text-gray-500")}>Month</button>
                  <button onClick={() => setViewMode('week')} className={clsx("px-3 py-1 text-xs font-bold rounded transition-all", viewMode === 'week' ? "bg-white text-[#0B1B42] shadow-sm" : "text-gray-500")}>Week</button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50/50">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest border-r border-gray-200 last:border-r-0">{day}</div>
              ))}
            </div>
            <div className={clsx("grid grid-cols-7 bg-gray-200 gap-px", viewMode === 'month' ? "grid-rows-5" : "grid-rows-1")}>
              {calendarDays.map((d, i) => {
                const dateISO = d.date.toISOString().split('T')[0];
                const isToday = dateISO === todayStr;
                const dayInterviews = interviews.filter(inv => inv.isoDate === dateISO);
                return (
                  <div key={i} className={clsx("min-h-[110px] p-2 transition-colors", d.current ? "bg-white hover:bg-gray-50" : "bg-gray-50/50 text-gray-300")}>
                    <div className="flex flex-col h-full">
                      <div className="flex justify-between items-start mb-1">
                        <span className={clsx("text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full", isToday ? "bg-blue-600 text-white shadow-md" : "text-gray-600")}>{d.day}</span>
                        {viewMode === 'week' && <span className="text-[10px] text-gray-400 font-bold uppercase">{d.date.toLocaleDateString('en-US', { month: 'short' })}</span>}
                      </div>
                      <div className="space-y-1 mt-1 overflow-y-auto max-h-[80px] no-scrollbar">
                        {dayInterviews.map(inv => (
                          <button key={inv.id} onClick={() => setSelectedInterview(inv)} className={clsx("w-full text-left px-2 py-1 rounded text-[9px] font-bold border truncate flex items-center space-x-1 transition-transform hover:scale-[1.02]", inv.scheduled_by === 'AI' ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-purple-50 text-purple-700 border-purple-100")}>
                            {inv.scheduled_by === 'AI' && <Sparkles className="w-2 h-2 shrink-0" />}
                            <span className="truncate">{inv.candidate}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-6">Upcoming Agenda</h2>
            <div className="space-y-6">
              {interviews.length === 0 ? (
                <NoData icon={Clock} title="No interviews" description="Your schedule is clear." />
              ) : (
                interviews.slice(0, 8).map((inv, idx) => {
                  const isNewDate = idx === 0 || interviews[idx-1].isoDate !== inv.isoDate;
                  return (
                    <div key={inv.id} className="relative">
                      {isNewDate && (
                        <div className="flex items-center space-x-4 mb-4">
                          <div className="h-px bg-gray-100 flex-1"></div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{inv.displayDate}</span>
                          <div className="h-px bg-gray-100 flex-1"></div>
                        </div>
                      )}
                      <div onClick={() => setSelectedInterview(inv)} className="bg-gray-50/50 border border-gray-100 rounded-xl p-4 hover:border-blue-200 transition-colors cursor-pointer group">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-lg bg-[#0B1B42] text-white flex items-center justify-center font-bold text-xs">{inv.avatar}</div>
                            <div>
                              <h4 className="text-sm font-bold text-[#0B1B42] group-hover:text-blue-600 transition-colors">{inv.candidate}</h4>
                            </div>
                          </div>
                          <MoreHorizontal className="w-4 h-4 text-gray-400" />
                        </div>
                        <div className="flex items-center text-[10px] text-gray-600 mb-3"><Clock className="w-3 h-3 mr-2 text-gray-400" /> {inv.time}</div>
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                           <span className={clsx("px-2 py-0.5 rounded text-[8px] font-bold uppercase flex items-center", inv.scheduled_by === 'AI' ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700")}>
                             {inv.scheduled_by === 'AI' ? <><Sparkles className="w-2 h-2 mr-1" /> AI</> : <><User className="w-2 h-2 mr-1" /> Team</>}
                           </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals remain the same... */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg font-bold text-[#0B1B42]">Schedule Interview</h2>
              <button onClick={() => setIsScheduleModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            {scheduleSuccess ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce"><CheckCircle2 className="w-8 h-8 text-green-500" /></div>
                <h3 className="text-xl font-bold text-[#0B1B42] mb-2">Successfully Scheduled!</h3>
              </div>
            ) : (
              <form onSubmit={handleManualSchedule} className="p-6 space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Candidate</label>
                  <select value={scheduleData.applicantId} onChange={e => setScheduleData({...scheduleData, applicantId: e.target.value})} required className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm">
                    <option value="">Select Candidate...</option>
                    {(applicants || []).map(app => (
                      <option key={app.id} value={app.id}>{app.name} ({app.jobs?.title})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Interview Type</label>
                  <select value={scheduleData.interviewTypeId} onChange={e => setScheduleData({...scheduleData, interviewTypeId: e.target.value})} required className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm">
                    <option value="">Select Type...</option>
                    {(interviewTypes || []).map(type => (
                      <option key={type.id} value={type.id}>{type.name} ({type.duration_minutes}m)</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input type="date" value={scheduleData.scheduledDate} onChange={e => setScheduleData({...scheduleData, scheduledDate: e.target.value})} required className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm" />
                  <input type="time" value={scheduleData.startTime} onChange={e => setScheduleData({...scheduleData, startTime: e.target.value})} required className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Meeting URL (Optional)</label>
                  <input 
                    type="url" 
                    placeholder="https://meet.google.com/..." 
                    value={scheduleData.meetUrl} 
                    onChange={e => setScheduleData({...scheduleData, meetUrl: e.target.value})} 
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm" 
                  />
                </div>
                <button type="submit" className="w-full py-3 bg-[#0B1B42] text-white rounded-xl font-bold shadow-lg">Schedule Event</button>
              </form>
            )}
          </div>
        </div>
      )}

      {isManageTypesOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg font-bold text-[#0B1B42]">Interview Configuration</h2>
              <button onClick={() => setIsManageTypesOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
               <form onSubmit={handleCreateType} className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">Create New Type</h3>
                  <input type="text" placeholder="Type Name" value={newType.name} onChange={e => setNewType({...newType, name: e.target.value})} required className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm" />
                  <input type="number" placeholder="Duration" value={newType.durationMinutes} onChange={e => setNewType({...newType, durationMinutes: parseInt(e.target.value)})} required className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm" />
                  <button type="submit" className="w-full py-2 bg-[#0B1B42] text-white rounded-lg text-sm font-bold">Add Type</button>
               </form>
               <div>
                  <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">Existing Types</h3>
                  <div className="space-y-2 max-h-[250px] overflow-y-auto no-scrollbar">
                     {(interviewTypes || []).map(type => (
                       <div key={type.id} className="p-3 bg-gray-50 border border-gray-100 rounded-xl flex justify-between items-center">
                          <span className="text-sm font-bold text-[#0B1B42]">{type.name} ({type.duration_minutes}m)</span>
                          {type.created_by_ai && <Sparkles className="w-3 h-3 text-blue-600" />}
                       </div>
                     ))}
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {selectedInterview && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl bg-[#0B1B42] text-white flex items-center justify-center font-bold text-lg">{selectedInterview.avatar}</div>
                <div><h2 className="text-lg font-bold text-[#0B1B42]">{selectedInterview.candidate}</h2></div>
              </div>
              <button onClick={() => setSelectedInterview(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Date</p>
                    <p className="text-sm font-bold">{selectedInterview.displayDate}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Time</p>
                    <p className="text-sm font-bold">{formatTime((selectedInterview as any).start_time)}</p>
                  </div>
               </div>
               
               <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Meeting Details</label>
                    <div className="flex items-center space-x-2">
                      <div className="flex-grow relative">
                        <Video className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                          type="url" 
                          placeholder="Add meeting link..." 
                          value={editingUrl}
                          onChange={(e) => setEditingUrl(e.target.value)}
                          className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                      </div>
                      <button 
                        onClick={handleUpdateUrl}
                        disabled={isUpdatingUrl || editingUrl === (selectedInterview.meet_url || '')}
                        className={clsx(
                          "px-4 py-2.5 rounded-xl text-xs font-bold transition-all",
                          editingUrl !== (selectedInterview.meet_url || '') 
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        )}
                      >
                        {isUpdatingUrl ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>

                  {selectedInterview.meet_url && (
                    <div className="bg-blue-50 p-4 rounded-xl flex items-center justify-between">
                       <div className="flex items-center space-x-3">
                         <Video className="w-5 h-5 text-blue-600" />
                         <span className="text-sm text-blue-800 font-bold">Meeting Ready</span>
                       </div>
                       <a href={selectedInterview.meet_url} target="_blank" rel="noopener noreferrer" className="px-3 py-1 bg-white text-blue-600 rounded-lg text-xs font-bold shadow-sm hover:bg-blue-50 transition-colors">Join Now</a>
                    </div>
                  )}
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
