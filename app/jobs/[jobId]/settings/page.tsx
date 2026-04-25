'use client';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, ShieldAlert, Sliders, Users, Power } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function JobSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;
  const [job, setJob] = useState<any>(null);
  const [isPublic, setIsPublic] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await api.get(`/jobs/${jobId}`);
        setJob(response.data.data.job);
        setIsPublic(response.data.data.job.is_public);
      } catch (err) {
        console.error('Failed to fetch job settings:', err);
      }
    };
    fetchJob();
  }, [jobId]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.patch(`/jobs/${jobId}`, { is_public: isPublic });
      router.push(`/jobs/${jobId}`);
    } catch (err) {
      console.error('Failed to save settings:', err);
      alert('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center">
          <Link href={`/jobs/${jobId}`} className="mr-4 text-gray-500 hover:text-gray-800 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[#0B1B42]">Job Settings</h1>
            <p className="text-xs text-gray-500 mt-0.5">Manage pipeline rules and team access for this role.</p>
          </div>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center px-6 py-2.5 bg-[#0B1B42] text-white rounded-lg text-sm font-medium hover:bg-blue-900 transition-colors shadow-sm disabled:opacity-70"
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-8 mt-8 space-y-6">
        
        {/* Status Settings */}
        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
          <div className="flex items-center space-x-2 text-[#0B1B42] font-bold text-lg mb-6 border-b border-gray-100 pb-4">
            <Power className="w-5 h-5" />
            <h2>Pipeline Status</h2>
          </div>
          
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-800">Accept New Applications</h3>
              <p className="text-xs text-gray-500 mt-1">If disabled, the public job board link will be closed and candidates cannot apply.</p>
            </div>
            <label className="inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={isPublic} 
                onChange={(e) => setIsPublic(e.target.checked)} 
              />
              <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0B1B42]"></div>
            </label>
          </div>
        </div>

        {/* Custom AI Rules */}
        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
          <div className="flex items-center space-x-2 text-[#0B1B42] font-bold text-lg mb-6 border-b border-gray-100 pb-4">
            <Sliders className="w-5 h-5" />
            <h2>Custom AI Rules (Overrides Global Settings)</h2>
          </div>
          
          <div className="space-y-6">
             <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">Job-Specific Match Threshold</label>
                <p className="text-xs text-gray-500 mb-3">Only for this job: Candidates below this score will not be shortlisted.</p>
                <div className="flex items-center space-x-4">
                  <input type="range" min="50" max="100" defaultValue="85" className="w-full md:w-1/2 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#0B1B42]" />
                  <span className="font-bold text-[#0B1B42]">85%</span>
                </div>
             </div>

             <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">Mandatory Technical Knockouts</label>
                <p className="text-xs text-gray-500 mb-3">If a candidate does not possess these skills, they will be instantly rejected regardless of overall match score.</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium border border-red-100">PyTorch</span>
                  <span className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium border border-red-100">Kubernetes</span>
                </div>
                <button className="text-xs font-bold text-blue-600 hover:underline">+ Add Knockout Skill</button>
             </div>
          </div>
        </div>

        {/* Access Management */}
        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
          <div className="flex items-center space-x-2 text-[#0B1B42] font-bold text-lg mb-6 border-b border-gray-100 pb-4">
            <Users className="w-5 h-5" />
            <h2>Hiring Team Access</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border border-gray-100 rounded-lg bg-gray-50">
               <div className="flex items-center space-x-3">
                 <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">AT</div>
                 <div>
                   <p className="text-sm font-bold text-[#0B1B42]">Alex Thompson (You)</p>
                   <p className="text-xs text-gray-500">Owner</p>
                 </div>
               </div>
            </div>
            
            <div className="flex items-center justify-between p-3 border border-gray-100 rounded-lg bg-white">
               <div className="flex items-center space-x-3">
                 <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">SJ</div>
                 <div>
                   <p className="text-sm font-bold text-[#0B1B42]">Sarah Jenkins</p>
                   <p className="text-xs text-gray-500">Engineering Manager</p>
                 </div>
               </div>
               <button className="text-xs font-bold text-red-500 hover:underline">Remove</button>
            </div>
            
            <button className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors">
              + Invite Team Member
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white border border-red-200 rounded-xl p-8 shadow-sm">
          <div className="flex items-center space-x-2 text-red-600 font-bold text-lg mb-6 border-b border-red-100 pb-4">
            <ShieldAlert className="w-5 h-5" />
            <h2>Danger Zone</h2>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-800">Archive Job</h3>
              <p className="text-xs text-gray-500 mt-1">Hide this job from active lists. Data is retained but the pipeline is frozen.</p>
            </div>
            <button className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors">Archive</button>
          </div>
        </div>

      </div>
    </div>
  );
}
