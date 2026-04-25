'use client';
import { ArrowLeft, Sparkles, CheckCircle2, ChevronDown, X, MessageSquareHeart, Trash2 } from 'lucide-react';
import Link from 'next/link';
import clsx from 'clsx';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { api } from '../../../lib/api';
import { fetchJobs } from '../../../store/slices/jobsSlice';
import { fetchDepartments, createDepartment, deleteDepartment } from '../../../store/slices/departmentsSlice';
import { AppDispatch, RootState } from '../../../store/store';
import { useEffect } from 'react';

export default function CreateJob() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const [techSkills, setTechSkills] = useState(['Python', 'PyTorch', 'LLMs']);
  const [skillInput, setSkillInput] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [aiBaseline, setAiBaseline] = useState<any>(null);
  const [jobData, setJobData] = useState<{
    title: string;
    department: string;
    location: string;
    priority: string;
    deadline: string;
    description: string;
    is_public: boolean;
    shortlist_threshold: number;
    knockout_skills: string[];
  }>({
    title: '',
    department: '',
    location: 'Remote',
    priority: 'REGULAR',
    deadline: '',
    description: '',
    is_public: true,
    shortlist_threshold: 70,
    knockout_skills: []
  });
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');

  const { list: departmentsList, status: deptStatus } = useSelector((state: RootState) => state.departments);

  useEffect(() => {
    dispatch(fetchDepartments());
  }, [dispatch]);

  useEffect(() => {
    if (departmentsList.length > 0 && !jobData.department) {
      setJobData(prev => ({ ...prev, department: departmentsList[0].name }));
    }
  }, [departmentsList, jobData.department]);

  const handleCreateDepartment = async () => {
    if (!newDeptName.trim()) return;
    try {
      setIsLoading(true);
      const newDept = await dispatch(createDepartment(newDeptName.trim())).unwrap();
      setJobData(prev => ({ ...prev, department: newDept.name }));
      setNewDeptName('');
    } catch (error) {
      console.error('Failed to create department:', error);
      alert('Failed to create department. It may already exist.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDepartment = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the "${name}" department?`)) return;
    try {
      setIsLoading(true);
      await dispatch(deleteDepartment(id)).unwrap();
      if (jobData.department === name) {
        setJobData(prev => ({ ...prev, department: departmentsList[0]?.name || '' }));
      }
    } catch (error) {
      console.error('Failed to delete department:', error);
      alert('Failed to delete department. It may be in use.');
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = async () => {
    if (currentStep === 2 && jobData.title) {
      // Moving to Step 3: Generate Baseline
      try {
        setIsLoading(true);
        const response = await api.post('/jobs/generate-baseline', { title: jobData.title });
        setAiBaseline(response.data.data.baseline);
      } catch (error) {
        console.error('Failed to generate AI baseline:', error);
      } finally {
        setIsLoading(false);
      }
    }
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handlePublish = async () => {
    try {
      setIsLoading(true);
      await api.post('/jobs', { ...jobData, is_public: true, ai_baseline: aiBaseline });
      dispatch(fetchJobs());
      router.push('/jobs');
    } catch (error) {
      console.error('Failed to create job:', error);
      alert('Failed to create job');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      if (!jobData.title) {
        alert('Please enter a job title before saving as draft.');
        return;
      }
      setIsLoading(true);
      await api.post('/jobs', { ...jobData, is_public: false, ai_baseline: aiBaseline });
      dispatch(fetchJobs());
      router.push('/jobs');
    } catch (error) {
      console.error('Failed to save draft:', error);
      alert('Failed to save draft');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault();
      if (!techSkills.includes(skillInput.trim())) {
        setTechSkills([...techSkills, skillInput.trim()]);
      }
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setTechSkills(techSkills.filter(s => s !== skill));
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      {/* Top Navigation */}
      <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center sticky top-0 z-10">
        <Link href="/dashboard" className="mr-4 text-gray-500 hover:text-gray-800 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-[#0B1B42]">Create New Job</h1>
      </div>

      <div className="max-w-6xl mx-auto px-8 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column (Main Form) */}
        <div className="lg:col-span-2 space-y-6">

          {/* Stepper */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex items-center justify-between relative">
            <div className="absolute top-1/2 left-10 right-10 h-[2px] bg-gray-100 -z-0 -translate-y-1/2"></div>
            <Step number={1} label="Details" active={currentStep >= 1} />
            <Step number={2} label="Requirements" active={currentStep >= 2} />
            <Step number={3} label="Matching AI" active={currentStep >= 3} />
            <Step number={4} label="Preview" active={currentStep >= 4} />
          </div>

          {/* Form Sections */}
          <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm space-y-8">

            {currentStep === 1 && (
              <div>
                <h2 className="text-lg font-bold text-[#0B1B42]">Basic Information</h2>
                <p className="text-sm text-gray-500 mb-6 mt-1">Define the core identity of the role</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 tracking-wider mb-2 uppercase">Job Title</label>
                    <input
                      type="text"
                      value={jobData.title}
                      onChange={(e) => setJobData({ ...jobData, title: e.target.value })}
                      placeholder="e.g. Senior Machine Learning Engineer"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 tracking-wider mb-2 uppercase">Department</label>
                    <div className="flex space-x-2">
                      <div className="relative flex-1">
                        <select
                          value={jobData.department}
                          onChange={(e) => setJobData({ ...jobData, department: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm appearance-none focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        >
                          {departmentsList.map(dept => (
                            <option key={dept.id} value={dept.name}>{dept.name}</option>
                          ))}
                          {departmentsList.length === 0 && <option value="">Loading...</option>}
                        </select>
                        <ChevronDown className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                      <button
                        onClick={() => setIsDeptModalOpen(true)}
                        className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-semibold text-sm transition-colors border border-blue-100 whitespace-nowrap"
                      >
                        + New
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 tracking-wider mb-2 uppercase">Priority</label>
                    <div className="relative">
                      <select
                        value={jobData.priority}
                        onChange={(e) => setJobData({ ...jobData, priority: e.target.value as 'REGULAR' | 'HIGH' })}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm appearance-none focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      >
                        <option value="REGULAR">Regular</option>
                        <option value="HIGH">High Priority</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 tracking-wider mb-2 uppercase">Application Deadline (Optional)</label>
                    <input
                      type="date"
                      value={jobData.deadline}
                      onChange={(e) => setJobData({ ...jobData, deadline: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 tracking-wider mb-2 uppercase">Role Description</label>
                  <textarea
                    rows={4}
                    value={jobData.description}
                    onChange={(e) => setJobData({ ...jobData, description: e.target.value })}
                    placeholder="Briefly describe the mission of this role..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  ></textarea>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div>
                <h2 className="text-lg font-bold text-[#0B1B42] mb-6">Job Requirements</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 tracking-wider mb-2 uppercase">Years of Experience</label>
                    <div className="flex items-center space-x-3">
                      <input type="number" defaultValue="5" className="w-20 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                      <span className="text-sm text-gray-500">years minimum</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 tracking-wider mb-2 uppercase">Work Location</label>
                    <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-200">
                      <button onClick={() => setJobData({ ...jobData, location: 'Remote' })} className={clsx("flex-1 py-1.5 text-sm font-medium rounded shadow-sm transition-colors", jobData.location === 'Remote' ? "bg-[#0B1B42] text-white" : "text-gray-600 hover:text-gray-900")}>Remote</button>
                      <button onClick={() => setJobData({ ...jobData, location: 'Hybrid' })} className={clsx("flex-1 py-1.5 text-sm font-medium rounded shadow-sm transition-colors", jobData.location === 'Hybrid' ? "bg-[#0B1B42] text-white" : "text-gray-600 hover:text-gray-900")}>Hybrid</button>
                      <button onClick={() => setJobData({ ...jobData, location: 'On-site' })} className={clsx("flex-1 py-1.5 text-sm font-medium rounded shadow-sm transition-colors", jobData.location === 'On-site' ? "bg-[#0B1B42] text-white" : "text-gray-600 hover:text-gray-900")}>On-site</button>
                    </div>
                  </div>
                </div>

                <div className="mb-6">


                  <div className="bg-red-50/50 border border-red-100 rounded-xl p-4 mb-4">
                    <label className="block text-xs font-bold text-red-600 tracking-wider mb-2 uppercase flex items-center">
                      Mandatory Technical Knockouts
                      <span className="ml-2 px-1.5 py-0.5 bg-red-50 text-red-500 text-[10px] rounded border border-red-100">STRICT</span>
                    </label>
                    <p className="text-[11px] text-gray-500 mb-3 font-medium">If a candidate does not possess these skills, they will be instantly rejected regardless of overall match score.</p>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {jobData.knockout_skills.map(skill => (
                        <span key={skill} className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-white text-red-700 border border-red-200 shadow-sm">
                          {skill}
                          <button onClick={() => setJobData({ ...jobData, knockout_skills: jobData.knockout_skills.filter(s => s !== skill) })} type="button" className="ml-2 text-red-300 hover:text-red-500"><X className="w-3 h-3" /></button>
                        </span>
                      ))}
                      {jobData.knockout_skills.length === 0 && (
                        <span className="text-xs text-gray-400 italic">None (Default)</span>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      <input
                        type="text"
                        id="knockout-input"
                        placeholder="Add mandatory skill..."
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-red-500 outline-none"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const target = e.target as HTMLInputElement;
                            const val = target.value.trim();
                            if (val && !jobData.knockout_skills.includes(val)) {
                              setJobData({ ...jobData, knockout_skills: [...jobData.knockout_skills, val] });
                              target.value = '';
                            }
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const el = document.getElementById('knockout-input') as HTMLInputElement;
                          const val = el.value.trim();
                          if (val && !jobData.knockout_skills.includes(val)) {
                            setJobData({ ...jobData, knockout_skills: [...jobData.knockout_skills, val] });
                            el.value = '';
                          }
                        }}
                        className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold text-xs transition-colors shadow-sm"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                  <label className="block text-xs font-bold text-gray-700 tracking-wider mb-2 uppercase">Technical Skills</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {techSkills.map(skill => (
                      <span key={skill} className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-blue-50 text-blue-700 border border-blue-100">
                        {skill}
                        <button onClick={() => handleRemoveSkill(skill)} type="button" className="ml-2 text-blue-400 hover:text-blue-600"><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>

                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={handleAddSkill}
                    placeholder="Add a skill and press Enter..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4 animate-pulse">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-[#0B1B42] mb-2">ScreenerX AI Analysis Active</h2>
                <p className="text-gray-500 text-sm max-w-md">We've generated the ideal candidate baseline for your <strong>{jobData.title}</strong> role. Review the intelligence insights on the right before publishing.</p>

                <div className="mt-8 p-4 bg-green-50 rounded-xl border border-green-100 flex items-center space-x-3 mb-8">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-bold text-green-800 uppercase tracking-wide">AI Baseline Synchronized</span>
                </div>

                <div className="w-full max-w-md bg-white border border-blue-100 rounded-2xl p-6 shadow-sm text-left">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-bold text-[#0B1B42] uppercase tracking-wider">Shortlist Match Threshold</h4>
                    <span className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm font-bold">{jobData.shortlist_threshold}%</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-6 font-medium">Candidates scoring below this threshold will not be automatically shortlisted by the AI Recruiter.</p>

                  <input
                    type="range"
                    min="50"
                    max="95"
                    step="5"
                    value={jobData.shortlist_threshold}
                    onChange={(e) => setJobData({ ...jobData, shortlist_threshold: parseInt(e.target.value) })}
                    className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between mt-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <span>Lenient (50%)</span>
                    <span>Strict (95%)</span>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div>
                <h2 className="text-lg font-bold text-[#0B1B42] mb-6">Review & Publish</h2>
                <div className="p-6 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-[#0B1B42]">{jobData.title}</h3>
                      <p className="text-sm text-gray-500">{jobData.department} · {jobData.location}</p>
                    </div>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider">{jobData.priority} Priority</span>
                  </div>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-700 leading-relaxed">This position will be published publicly. ScreenerX AI will automatically screen all incoming resumes against the baseline generated in Step 3.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-100">
              {currentStep > 1 ? (
                <button onClick={prevStep} className="px-6 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors">Back</button>
              ) : <div></div>}
              <div className="flex space-x-4">
                <button onClick={handleSaveDraft} disabled={isLoading} className="px-6 py-2.5 text-sm font-medium text-[#0B1B42] hover:bg-gray-50 rounded-lg transition-colors">Save Draft</button>
                {currentStep < 4 ? (
                  <button onClick={nextStep} disabled={isLoading} className="px-6 py-2.5 text-sm font-medium bg-[#0B1B42] text-white rounded-lg hover:bg-blue-900 transition-colors shadow-sm disabled:opacity-70">
                    {isLoading ? 'Generating AI Profile...' : (currentStep === 1 ? 'Continue to Requirements' : 'Continue to AI Setup')}
                  </button>
                ) : (
                  <button
                    onClick={handlePublish}
                    disabled={isLoading}
                    className="px-6 py-2.5 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm disabled:opacity-70"
                  >
                    {isLoading ? 'Publishing...' : 'Publish Job'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (AI Insights) */}
        <div className="space-y-6">
          <div className="bg-white border border-blue-100 rounded-xl p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Sparkles className="w-24 h-24" />
            </div>

            <div className="flex items-center space-x-2 text-[#0B1B42] font-bold text-lg mb-4">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <span>Ideal Candidate Profile</span>
            </div>

            <p className="text-sm text-gray-600 mb-6">ScreenerX AI uses this profile as a baseline. Based on your current inputs, we recommend searching for:</p>

            {aiBaseline ? (
              <>
                <div className="space-y-4 mb-8">
                  <div className="flex items-start space-x-3 bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-[#0B1B42]">Technical Depth</h4>
                      <p className="text-xs text-gray-500 mt-1">{aiBaseline.technical_depth}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-[#0B1B42]">Industry Fit</h4>
                      <p className="text-xs text-gray-500 mt-1">{aiBaseline.industry_fit}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-bold text-gray-700 tracking-wider uppercase">Profile Precision</span>
                    <span className="text-lg font-bold text-green-500">{aiBaseline.precision}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${aiBaseline.precision}%` }}></div>
                  </div>
                  <p className="text-xs text-gray-500 italic pt-1">Profile adjusted based on your requirements.</p>
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-gray-400 text-xs italic">
                Complete the "Details" and "Requirements" steps to generate the AI baseline profile.
              </div>
            )}
          </div>

          {/* Market Intelligence Widget */}
          <div className="bg-[#0B1B42] rounded-xl overflow-hidden shadow-sm text-white relative">
            <div className="h-28 bg-gradient-to-r from-blue-900 to-[#0B1B42] relative flex items-center justify-center overflow-hidden">
              {/* Mockup of a chart */}
              <div className="absolute bottom-0 w-full h-1/2 flex items-end opacity-20 px-4 space-x-1">
                {[40, 70, 45, 90, 60, 80, 50, 100, 75, 50, 30].map((h, i) => (
                  <div key={i} className="flex-1 bg-blue-300 rounded-t-sm" style={{ height: `${h}%` }}></div>
                ))}
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B1B42] to-transparent"></div>
              <h3 className="relative z-10 text-lg font-bold mt-4">Market Intelligence</h3>
            </div>
            <div className="p-6 bg-white text-gray-800 rounded-b-xl border border-t-0 border-gray-200">
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Avg. Salary Range</span>
                  <span className="text-sm font-bold text-[#0B1B42]">{aiBaseline?.market_intelligence?.avg_salary || '$--'}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Candidate Availability</span>
                  <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded uppercase">{aiBaseline?.market_intelligence?.availability || '--'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Time to Hire</span>
                  <span className="text-sm font-bold text-[#0B1B42]">{aiBaseline?.market_intelligence?.time_to_hire || '--'}</span>
                </div>
              </div>
              <button className="w-full py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">View Full Report</button>
            </div>
          </div>

          {/* Need Help Prompt */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-start space-x-4 cursor-pointer hover:border-blue-300 transition-colors">
            <div className="bg-blue-50 p-3 rounded-full text-blue-600 shrink-0">
              <MessageSquareHeart className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#0B1B42]">Need help with requirements?</h4>
              <p className="text-xs text-gray-500 mt-1">Talk to an AI Recruiting Expert</p>
            </div>
          </div>

        </div>
      </div>

      {/* Department Management Modal */}
      {isDeptModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-[#0B1B42]">Manage Departments</h3>
              <button onClick={() => setIsDeptModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 tracking-wider mb-2 uppercase">Add New Department</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newDeptName}
                    onChange={(e) => setNewDeptName(e.target.value)}
                    placeholder="e.g. Data Science"
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateDepartment()}
                  />
                  <button
                    onClick={handleCreateDepartment}
                    disabled={!newDeptName.trim() || isLoading}
                    className="px-4 py-2 bg-[#0B1B42] text-white rounded-lg text-sm font-bold hover:bg-blue-900 transition-colors disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 tracking-wider mb-3 uppercase">Existing Departments</label>
                <div className="max-h-60 overflow-y-auto space-y-2 pr-2 scrollbar-hide">
                  {departmentsList.map(dept => (
                    <div key={dept.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100 group">
                      <span className="text-sm font-medium text-gray-700">{dept.name}</span>
                      <button
                        onClick={() => handleDeleteDepartment(dept.id, dept.name)}
                        disabled={isLoading}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {departmentsList.length === 0 && (
                    <p className="text-sm text-gray-500 italic">No departments created yet.</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setIsDeptModalOpen(false)}
                  className="px-6 py-2.5 bg-blue-50 text-blue-600 rounded-xl text-sm font-bold hover:bg-blue-100 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Step({ number, label, active }: { number: number, label: string, active: boolean }) {
  return (
    <div className="flex flex-col items-center relative z-10">
      <div className={clsx(
        "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mb-2 transition-colors",
        active ? "bg-[#0B1B42] text-white shadow-md" : "bg-gray-100 text-gray-400"
      )}>
        {number}
      </div>
      <span className={clsx(
        "text-xs font-bold tracking-wider uppercase",
        active ? "text-[#0B1B42]" : "text-gray-400"
      )}>{label}</span>
    </div>
  );
}
