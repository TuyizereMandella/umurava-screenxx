'use client';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles, CheckCircle2, ChevronDown, X, Save } from 'lucide-react';
import Link from 'next/link';
import clsx from 'clsx';
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { api } from '../../../../lib/api';
import { fetchDepartments, createDepartment } from '../../../../store/slices/departmentsSlice';
import { AppDispatch, RootState } from '../../../../store/store';

export default function EditJobPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;
  
  const [techSkills, setTechSkills] = useState(['Python', 'PyTorch', 'LLMs']);
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [aiBaseline, setAiBaseline] = useState<any>(null);
  const [jobData, setJobData] = useState({
    title: '',
    department: '',
    location: '',
    description: '',
    priority: 'REGULAR',
    deadline: ''
  });
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');

  const dispatch = useDispatch<AppDispatch>();
  const { list: departmentsList } = useSelector((state: RootState) => state.departments);

  useEffect(() => {
    dispatch(fetchDepartments());
  }, [dispatch]);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await api.get(`/jobs/${jobId}`);
        const job = response.data.data.job;
        setJobData({
          title: job.title,
          department: job.department || '',
          location: job.location || 'Remote',
          description: job.description || '',
          priority: job.priority || 'REGULAR',
          deadline: job.deadline ? new Date(job.deadline).toISOString().split('T')[0] : ''
        });
        setAiBaseline(job.ai_baseline);
      } catch (error) {
        console.error('Failed to fetch job:', error);
      }
    };
    fetchJob();
  }, [jobId]);

  const handleSave = async () => {
    try {
      setIsLoading(true);
      await api.patch(`/jobs/${jobId}`, jobData);
      router.push(`/jobs/${jobId}`);
    } catch (error) {
      console.error('Failed to update job:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleCreateDepartment = async () => {
    if (!newDeptName.trim()) return;
    try {
      setIsLoading(true);
      const newDept = await dispatch(createDepartment(newDeptName.trim())).unwrap();
      setJobData(prev => ({ ...prev, department: newDept.name }));
      setIsDeptModalOpen(false);
      setNewDeptName('');
    } catch (error) {
      console.error('Failed to create department:', error);
      alert('Failed to create department. It may already exist.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      {/* Top Navigation */}
      <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center">
          <Link href={`/jobs/${jobId}`} className="mr-4 text-gray-500 hover:text-gray-800 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-[#0B1B42]">Edit Job: {jobData.title}</h1>
        </div>
        <button 
          onClick={handleSave}
          disabled={isLoading}
          className="flex items-center px-4 py-2 bg-[#0B1B42] text-white rounded-lg text-sm font-medium hover:bg-blue-900 transition-colors shadow-sm disabled:opacity-70"
        >
          <Save className="w-4 h-4 mr-2" /> {isLoading ? 'Saving...' : 'Save Changes'}
        </button>
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
                 <p className="text-sm text-gray-500 mb-6 mt-1">Update the core identity of the role</p>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                   <div>
                     <label className="block text-xs font-bold text-gray-700 tracking-wider mb-2 uppercase">Job Title</label>
                     <input 
                       type="text" 
                       value={jobData.title}
                       onChange={(e) => setJobData({...jobData, title: e.target.value})}
                       className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                     />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-gray-700 tracking-wider mb-2 uppercase">Department</label>
                     <div className="flex space-x-2">
                       <div className="relative flex-1">
                         <select 
                           value={jobData.department}
                           onChange={(e) => setJobData({...jobData, department: e.target.value})}
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

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 mt-6">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 tracking-wider mb-2 uppercase">Priority</label>
                        <div className="relative">
                          <select 
                            value={jobData.priority}
                            onChange={(e) => setJobData({...jobData, priority: e.target.value as 'REGULAR' | 'HIGH'})}
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
                          onChange={(e) => setJobData({...jobData, deadline: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        />
                      </div>
                   </div>
                 </div>
                 
                 <div>
                   <label className="block text-xs font-bold text-gray-700 tracking-wider mb-2 uppercase">Role Description</label>
                   <textarea 
                     rows={4} 
                     value={jobData.description}
                     onChange={(e) => setJobData({...jobData, description: e.target.value})}
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
                       <button onClick={() => setJobData({...jobData, location: 'Remote'})} className={clsx("flex-1 py-1.5 text-sm font-medium rounded shadow-sm", jobData.location === 'Remote' ? "bg-[#0B1B42] text-white" : "text-gray-600 hover:text-gray-900")}>Remote</button>
                       <button onClick={() => setJobData({...jobData, location: 'Hybrid'})} className={clsx("flex-1 py-1.5 text-sm font-medium rounded shadow-sm", jobData.location === 'Hybrid' ? "bg-[#0B1B42] text-white" : "text-gray-600 hover:text-gray-900")}>Hybrid</button>
                       <button onClick={() => setJobData({...jobData, location: 'On-site'})} className={clsx("flex-1 py-1.5 text-sm font-medium rounded shadow-sm", jobData.location === 'On-site' ? "bg-[#0B1B42] text-white" : "text-gray-600 hover:text-gray-900")}>On-site</button>
                     </div>
                   </div>
                 </div>

                 <div className="mb-6">
                   <label className="block text-xs font-bold text-gray-700 tracking-wider mb-2 uppercase">Technical Skills</label>
                   <div className="flex flex-wrap gap-2 mb-3">
                     {techSkills.map(skill => (
                       <span key={skill} className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-blue-50 text-blue-700 border border-blue-100">
                         {skill}
                         <button className="ml-2 text-blue-400 hover:text-blue-600"><X className="w-3 h-3" /></button>
                       </span>
                     ))}
                   </div>
                   <input type="text" placeholder="Add a skill and press Enter..." className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                 </div>
               </div>
             )}

             {currentStep > 2 && (
               <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <h2 className="text-xl font-bold text-[#0B1B42] mb-2">AI Baseline Synchronized</h2>
                  <p className="text-gray-500 text-sm max-w-md">The candidate profile baseline has been updated. This will affect how future applicants are scored.</p>
               </div>
             )}

             {/* Footer Actions */}
             <div className="flex justify-between items-center pt-6 border-t border-gray-100">
                {currentStep > 1 ? (
                  <button onClick={prevStep} className="px-6 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors">Back</button>
                ) : <div></div>}
                <div className="flex space-x-4">
                  {currentStep < 4 ? (
                    <button onClick={nextStep} className="px-6 py-2.5 text-sm font-medium bg-[#0B1B42] text-white rounded-lg hover:bg-blue-900 transition-colors shadow-sm">
                      {currentStep === 1 ? 'Continue to Requirements' : 'Review AI Changes'}
                    </button>
                  ) : (
                    <button onClick={handleSave} className="px-6 py-2.5 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm">
                      Confirm Updates
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
                </div>
               </>
             ) : (
                <div className="py-12 text-center text-gray-400 text-xs italic">
                  AI Baseline not yet generated for this role.
                </div>
             )}
          </div>

          <div className="bg-[#0B1B42] rounded-xl overflow-hidden shadow-sm text-white p-6">
             <h3 className="text-lg font-bold mb-4">Market Intelligence</h3>
             <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-white/10">
                  <span className="text-sm text-blue-200">Avg. Salary</span>
                  <span className="text-sm font-bold">{aiBaseline?.market_intelligence?.avg_salary || '$--'}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-white/10">
                  <span className="text-sm text-blue-200">Availability</span>
                  <span className="text-xs font-bold bg-red-500/20 text-red-300 px-2 py-0.5 rounded uppercase">{aiBaseline?.market_intelligence?.availability || '--'}</span>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Department Creation Modal */}
      {isDeptModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-[#0B1B42]">Add Department</h3>
              <button onClick={() => setIsDeptModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 tracking-wider mb-2 uppercase">Department Name</label>
                <input 
                  type="text" 
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  placeholder="e.g. Data Science" 
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                  autoFocus
                />
              </div>
              
              <div className="flex justify-end space-x-3 mt-8">
                <button 
                  onClick={() => setIsDeptModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreateDepartment}
                  disabled={!newDeptName.trim() || isLoading}
                  className="px-5 py-2.5 text-sm font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : 'Save Department'}
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
