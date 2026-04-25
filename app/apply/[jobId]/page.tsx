'use client';
import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, Globe, Code, ChevronRight, Zap, CheckCircle2, ArrowLeft, MapPin, Briefcase, Star, FileText, X, AlertCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import clsx from 'clsx';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Job } from '@/store/slices/jobsSlice';

const FALLBACK_JOB = {
  company: 'Umurava Intelligence',
  perks: ['Remote First', 'Equity Package', 'Unlimited PTO', 'Health & Dental', 'Learning Budget'],
  requirements: [
    'Proven experience in the relevant field.',
    'Strong problem-solving and communication skills.',
    'Ability to work independently and collaboratively in a fast-paced environment.',
  ],
  aiQuestions: [
    {
      id: 'q1',
      question: 'Describe a complex problem you solved in a previous role. What was your approach?',
      hint: 'Focus on scale, methodology, and key lessons learned.',
      required: true,
    },
    {
      id: 'q2',
      question: 'How do you prioritize competing deadlines in a high-pressure environment?',
      hint: 'Consider specific frameworks or strategies you use.',
      required: true,
    },
  ]
};

type Step = 'info' | 'cv' | 'questions' | 'review';
const STEPS: Step[] = ['info', 'cv', 'questions', 'review'];
const STEP_LABELS = ['Your Info', 'Upload CV', 'AI Questions', 'Review'];

export default function ApplyPage() {
  const { jobId } = useParams();
  const [job, setJob] = useState<any | null>(null);
  const [step, setStep] = useState<Step>('info');
  const [submitted, setSubmitted] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await api.get(`/jobs/public/${jobId}`);
        setJob(response.data.data.job);
      } catch (err) {
        console.error('Failed to fetch job details:', err);
      }
    };
    if (jobId) fetchJob();
  }, [jobId]);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    linkedin: '',
    github: '',
    answers: { q1: '', q2: '' } as Record<string, string>,
  });

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await api.post('/applicants/ingest', {
        jobId,
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        resumeUrl: uploadedFile ? `https://mock-storage.com/${uploadedFile.name}` : ''
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Submission failed:', err);
      alert('Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentStepIndex = STEPS.indexOf(step);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) setUploadedFile(file);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full mx-auto flex items-center justify-center shadow-2xl shadow-green-500/20 mb-8">
            <CheckCircle2 className="w-10 h-10 text-white" strokeWidth={1.5} />
          </div>
          <h1 className="text-3xl font-bold text-[#111827] mb-3">Application submitted!</h1>
          <p className="text-[#6B7280] text-lg mb-2">
            You're in the pipeline, <span className="font-semibold text-[#111827]">{formData.firstName || 'Candidate'}</span>.
          </p>
          <p className="text-[#9CA3AF] text-sm mb-10 leading-relaxed">
            Our AI is reviewing your profile. The <strong className="text-[#111827]">{job?.organizations?.name || FALLBACK_JOB.company}</strong> team will get back to you within 48–72 hours.
          </p>
          <div className="bg-white border border-[#E4E8EF] rounded-2xl p-6 text-left mb-8 shadow-sm">
            <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-widest mb-4">What happens next</p>
            {['AI screening of your CV & answers', 'Match score computed against role criteria', 'HR review and interview scheduling'].map((s, i) => (
              <div key={i} className="flex items-center gap-3 mb-3 last:mb-0">
                <div className="w-6 h-6 rounded-full bg-[#EFF6FF] text-[#2563EB] text-[10px] font-bold flex items-center justify-center shrink-0 border border-blue-100">{i + 1}</div>
                <p className="text-sm text-[#374151]">{s}</p>
              </div>
            ))}
          </div>
          <p className="text-[#9CA3AF] text-xs">Confirmation sent to <span className="text-[#2563EB]">{formData.email || 'your email'}</span></p>
        </motion.div>
      </div>
    );
  }

  const isPastDeadline = job?.deadline && new Date(job.deadline).getTime() < new Date().getTime();
  const isClosedManually = job?.is_public === false;
  const isExpired = isPastDeadline || isClosedManually;

  if (isExpired) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex flex-col items-center justify-center p-6">
        <div className="bg-white max-w-md w-full rounded-2xl p-8 shadow-sm border border-[#E4E8EF] text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto flex items-center justify-center mb-6">
            <Clock className="w-8 h-8 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-[#111827] mb-2">Applications Closed</h1>
          <p className="text-[#6B7280] mb-8 leading-relaxed">
            We are no longer accepting applications for the <strong className="text-[#111827]">{job?.title}</strong> position at <strong className="text-[#111827]">{job?.organizations?.name || FALLBACK_JOB.company}</strong>. 
            {isClosedManually ? ' The hiring team has paused new applications.' : ' The deadline has passed.'}
          </p>
          <Link href="/" className="inline-block px-6 py-3 bg-[#111827] text-white text-sm font-medium rounded-xl hover:bg-[#1F2937] transition-colors">
            View other openings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* Header */}
      <div className="bg-white border-b border-[#E4E8EF] px-6 py-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 shrink-0">
              <img src="/screenerx-logo.png" alt="ScreenerX Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-bold text-[#111827] text-base">ScreenerX</span>
            <span className="text-[#9CA3AF] text-sm hidden sm:block">· Candidate Portal</span>
          </div>
          <Link href="/" className="flex items-center gap-1.5 text-sm font-medium text-[#6B7280] hover:text-[#111827] transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to roles
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-5 gap-10">
        {/* Left: Job Info */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white border border-[#E4E8EF] rounded-2xl p-6 shadow-sm">
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center font-bold text-white text-base shadow-lg mb-5`}>
              {job?.organizations?.name ? job.organizations.name.charAt(0) : 'U'}
            </div>
            <h1 className="text-xl font-bold text-[#111827] mb-1">{job?.title || 'Loading...'}</h1>
            <p className="text-[#2563EB] font-semibold text-sm mb-5">{job?.organizations?.name || FALLBACK_JOB.company}</p>

            <div className="space-y-2.5 mb-5">
              {[
                { icon: MapPin, label: job?.location || 'Remote' },
                { icon: Briefcase, label: `Full-Time · ${job?.department || 'Engineering'}` },
                { icon: Star, label: job?.ai_baseline?.market_intelligence?.avg_salary || 'Competitive Salary' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-sm text-[#6B7280]">
                  <Icon className="w-4 h-4 text-[#9CA3AF] shrink-0" />
                  <span>{label}</span>
                </div>
              ))}
            </div>

            <p className="text-sm text-[#6B7280] leading-relaxed border-t border-[#E4E8EF] pt-5">
              {job?.description || 'No description provided.'}
            </p>
          </div>

          <div className="bg-white border border-[#E4E8EF] rounded-2xl p-6 shadow-sm">
            <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-widest mb-4">Benefits & Perks</p>
            <div className="flex flex-wrap gap-2">
              {FALLBACK_JOB.perks.map(perk => (
                <span key={perk} className="px-3 py-1.5 bg-[#EFF6FF] border border-blue-100 text-[#2563EB] text-xs font-medium rounded-full">
                  {perk}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-white border border-[#E4E8EF] rounded-2xl p-6 shadow-sm">
            <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-widest mb-4">Requirements</p>
            <ul className="space-y-2.5">
              {(job?.ai_baseline?.requirements || FALLBACK_JOB.requirements).map((req: string, i: number) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-[#6B7280]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#2563EB] mt-2 shrink-0" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right: Application Form */}
        <div className="lg:col-span-3">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <p className="font-bold text-[#111827] text-lg">Your Application</p>
              <p className="text-[#9CA3AF] text-sm">Step {currentStepIndex + 1} of {STEPS.length}</p>
            </div>
            <div className="flex gap-1.5 mb-2">
              {STEPS.map((s, i) => (
                <div key={s} className={clsx(
                  "h-1.5 flex-1 rounded-full transition-all duration-500",
                  i <= currentStepIndex ? "bg-[#2563EB]" : "bg-[#E4E8EF]"
                )} />
              ))}
            </div>
            <div className="flex justify-between">
              {STEP_LABELS.map((label, i) => (
                <p key={label} className={clsx(
                  "text-[10px] font-bold uppercase tracking-wider transition-colors",
                  i === currentStepIndex ? "text-[#2563EB]" : "text-[#D1D5DB]"
                )}>{label}</p>
              ))}
            </div>
          </div>

          <div className="bg-white border border-[#E4E8EF] rounded-2xl p-8 shadow-sm">

            {/* Step 1 */}
            {step === 'info' && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-[#111827] mb-1">Personal Information</h2>
                  <p className="text-[#6B7280] text-sm">Tell us a bit about yourself.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest mb-2">First Name *</label>
                    <input type="text" className="sx-input" placeholder="Alex" value={formData.firstName} onChange={e => setFormData(f => ({ ...f, firstName: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest mb-2">Last Name *</label>
                    <input type="text" className="sx-input" placeholder="Thorne" value={formData.lastName} onChange={e => setFormData(f => ({ ...f, lastName: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest mb-2">Email Address *</label>
                  <input type="email" className="sx-input" placeholder="alex@example.com" value={formData.email} onChange={e => setFormData(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest mb-2">Phone Number</label>
                  <input type="tel" className="sx-input" placeholder="+1 555 000 0000" value={formData.phone} onChange={e => setFormData(f => ({ ...f, phone: e.target.value }))} />
                </div>
                <div className="border-t border-[#E4E8EF] pt-5">
                  <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest mb-4">Social & Portfolio <span className="normal-case font-normal">(optional)</span></p>
                  <div className="space-y-3">
                    {[
                      { icon: Globe, key: 'linkedin', placeholder: 'linkedin.com/in/yourprofile' },
                      { icon: Code, key: 'github', placeholder: 'github.com/yourusername' },
                    ].map(item => (
                      <div key={item.key} className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <item.icon className="w-4 h-4 text-[#9CA3AF]" />
                        </div>
                        <input
                          type="url"
                          placeholder={item.placeholder}
                          className="sx-input pl-11"
                          value={formData[item.key as keyof typeof formData] as string}
                          onChange={e => setFormData(f => ({ ...f, [item.key]: e.target.value }))}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2 */}
            {step === 'cv' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-[#111827] mb-1">Upload Your CV</h2>
                  <p className="text-[#6B7280] text-sm">Our AI will parse and analyze your resume automatically.</p>
                </div>

                {uploadedFile ? (
                  <div className="border-2 border-green-400 bg-green-50/50 rounded-2xl p-8 text-center">
                    <div className="w-14 h-14 bg-green-100 rounded-xl mx-auto flex items-center justify-center mb-4 border border-green-200">
                      <FileText className="w-7 h-7 text-green-600" />
                    </div>
                    <p className="text-[#111827] font-bold text-lg mb-1">{uploadedFile.name}</p>
                    <p className="text-green-600 text-sm mb-4">{(uploadedFile.size / 1024).toFixed(0)} KB · Ready</p>
                    <button onClick={() => setUploadedFile(null)} className="flex items-center gap-1.5 text-xs text-[#9CA3AF] hover:text-red-500 mx-auto transition-colors">
                      <X className="w-3 h-3" />
                      Remove
                    </button>
                  </div>
                ) : (
                  <div
                    onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={clsx(
                      "border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all group",
                      dragActive ? "border-[#2563EB] bg-[#EFF6FF]" : "border-[#E4E8EF] hover:border-[#2563EB] hover:bg-[#F5F7FA]"
                    )}
                  >
                    <input ref={fileInputRef} type="file" accept=".pdf,.docx" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) setUploadedFile(f); }} />
                    <div className={clsx(
                      "w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-4 transition-all",
                      dragActive ? "bg-[#2563EB] text-white" : "bg-[#F5F7FA] text-[#9CA3AF] group-hover:bg-[#EFF6FF] group-hover:text-[#2563EB]"
                    )}>
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="font-bold text-[#111827] mb-1">{dragActive ? 'Drop it here!' : 'Drop your CV here'}</p>
                    <p className="text-[#9CA3AF] text-sm mb-4">or click to browse</p>
                    <span className="inline-flex items-center px-4 py-2 bg-white border border-[#E4E8EF] rounded-full text-[#6B7280] text-xs font-semibold shadow-sm">PDF or DOCX · Max 10MB</span>
                  </div>
                )}

                <div className="bg-[#EFF6FF] border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                  <Zap className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5 fill-current" />
                  <p className="text-sm text-[#374151]"><strong className="text-[#2563EB]">AI-Powered Parsing</strong> — ScreenerX will extract your skills and experience to compute a real-time match score for this role.</p>
                </div>
              </div>
            )}

            {/* Step 3 */}
            {step === 'questions' && (
              <div className="space-y-8">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-[#EFF6FF] border border-blue-100 rounded-lg flex items-center justify-center">
                      <Zap className="w-3 h-3 text-[#2563EB] fill-current" />
                    </div>
                    <span className="text-xs font-bold text-[#2563EB] uppercase tracking-wider">AI-Generated</span>
                  </div>
                  <h2 className="text-xl font-bold text-[#111827] mb-1">Role-Specific Questions</h2>
                  <p className="text-[#6B7280] text-sm">These questions were crafted by AI specifically for this role. Take your time.</p>
                </div>

                {(job?.ai_baseline?.ai_questions || FALLBACK_JOB.aiQuestions).map((q: any, i: number) => (
                  <div key={q.id} className="space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="w-7 h-7 rounded-full bg-[#111827] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-[#111827] font-semibold leading-relaxed">{q.question}</p>
                    </div>
                    <div className="pl-10">
                      <p className="text-[#9CA3AF] text-xs mb-2 italic">💡 {q.hint}</p>
                      <textarea
                        rows={5}
                        value={formData.answers[q.id] || ''}
                        onChange={e => setFormData(f => ({ ...f, answers: { ...f.answers, [q.id]: e.target.value } }))}
                        placeholder="Share your experience and thinking process..."
                        className="sx-input resize-none"
                      />
                      <div className="flex justify-between mt-1">
                        <span className={clsx("text-[10px]", (formData.answers[q.id] || '').length < 50 ? "text-red-400" : "text-[#9CA3AF]")}>
                          {(formData.answers[q.id] || '').length < 50 ? `${50 - (formData.answers[q.id] || '').length} more chars needed` : '✓ Good length'}
                        </span>
                        <span className="text-[10px] text-[#D1D5DB]">{(formData.answers[q.id] || '').length} chars</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Step 4 */}
            {step === 'review' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-[#111827] mb-1">Review & Submit</h2>
                  <p className="text-[#6B7280] text-sm">Double-check your application before sending it in.</p>
                </div>

                <div className="space-y-0 divide-y divide-[#E4E8EF]">
                  {[
                    { label: 'Name', value: `${formData.firstName} ${formData.lastName}` },
                    { label: 'Email', value: formData.email },
                    { label: 'LinkedIn', value: formData.linkedin || '—' },
                    { label: 'CV', value: uploadedFile?.name || 'Not uploaded' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between py-3">
                      <span className="text-[#9CA3AF] text-sm">{label}</span>
                      <span className="text-[#111827] text-sm font-medium max-w-[60%] text-right truncate">{value}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-[#F5F7FA] border border-[#E4E8EF] rounded-xl p-5">
                  <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-widest mb-3">AI Answers Preview</p>
                  {(job?.ai_baseline?.ai_questions || FALLBACK_JOB.aiQuestions).map((q: any, i: number) => (
                    <div key={q.id} className="mb-4 last:mb-0">
                      <p className="text-xs text-[#9CA3AF] mb-1">Q{i + 1}: {q.question.slice(0, 60)}…</p>
                      <p className="text-sm text-[#374151] leading-relaxed line-clamp-2">{formData.answers[q.id] || <span className="italic text-red-400">Not answered</span>}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 leading-relaxed">
                    By submitting, you agree that your information will be processed by ScreenerX AI and shared with <strong className="text-[#111827]">{job?.organizations?.name || FALLBACK_JOB.company}</strong> for recruitment purposes.
                  </p>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t border-[#E4E8EF]">
              {currentStepIndex > 0 ? (
                <button onClick={() => setStep(STEPS[currentStepIndex - 1])} className="flex items-center gap-2 px-5 py-2.5 border border-[#E4E8EF] text-[#6B7280] rounded-xl text-sm font-semibold hover:bg-[#F5F7FA] transition-all">
                  ← Back
                </button>
              ) : <div />}

              {step !== 'review' ? (
                <button onClick={() => setStep(STEPS[currentStepIndex + 1])} className="sx-btn-primary">
                  Continue
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button 
                  onClick={handleSubmit} 
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-8 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl text-sm font-bold hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg shadow-green-500/20 disabled:opacity-70"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
