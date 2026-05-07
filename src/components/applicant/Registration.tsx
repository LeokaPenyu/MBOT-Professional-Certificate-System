import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { UserCircle, Upload, CheckCircle2, Award, Clock, Briefcase, ShieldCheck } from 'lucide-react';
import { MBOT_FIELDS } from '../../constants';
import { Qualification, ApplicantStatus, Applicant, UserRole, Staff, Gender } from '../../types';
import { getApplicants, saveApplicants, setCurrentUser, getStaff, saveStaff } from '../../lib/storage';
import { cn } from '../../lib/utils';

export default function Registration() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roleType = searchParams.get('type') || 'applicant';
  const isSecretariat = roleType === 'secretariat';

  const [formData, setFormData] = useState({
    fullName: '',
    icPassport: '',
    email: '',
    password: '',
    phone: '',
    gender: Gender.MALE,
    dateOfBirth: '',
    address: '',
    qualification: Qualification.BACHELOR,
    field: MBOT_FIELDS[0],
    yearsOfExperience: 0,
    declaration: false,
    ethicsAffirmation: false,
    staffId: '',
    department: 'Registration & Certification'
  });

  const [nricFront, setNricFront] = useState<string | null>(null);
  const [nricBack, setNricBack] = useState<string | null>(null);

  const simulateNRICUpload = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (side === 'front') setNricFront(reader.result as string);
      else setNricBack(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadError, setUploadError] = useState('');
  const [cvMetadata, setCvMetadata] = useState<{ name: string; size: number } | null>(null);

  const simulateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadStatus('uploading');
    setUploadError('');

    // Simulate network delay
    setTimeout(() => {
      // Simulate validation failure for files > 10MB
      if (file.size > 10 * 1024 * 1024) {
        setUploadStatus('error');
        setUploadError('Document exceeds 10MB limit.');
        return;
      }

      setUploadStatus('success');
      setCvMetadata({ name: file.name, size: file.size });
      
      // Auto-revert success message after 3 seconds
      setTimeout(() => setUploadStatus('idle'), 3000);
    }, 1500);
  };

  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [regPath, setRegPath] = useState<'GT' | 'QT' | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);
    
    // Simulate some processing time
    setTimeout(() => {
      const normalizedEmail = formData.email.trim().toLowerCase();

      if (isSecretariat) {
        const staff = getStaff();
        const newStaff: Staff = {
          id: Math.random().toString(36).substr(2, 9),
          fullName: formData.fullName,
          staffId: formData.staffId,
          email: normalizedEmail,
          password: formData.password,
          department: formData.department,
          role: UserRole.SECRETARIAT
        };
        saveStaff([...staff, newStaff]);

        setIsSuccess(true);
        setIsSubmitting(false);
        setTimeout(() => {
          navigate('/login?type=secretariat');
        }, 3000);
        return;
      }

      if (!normalizedEmail.endsWith('@gmail.com')) {
        setErrorMsg("Access Policy: Applicant registration is strictly restricted to @gmail.com domains for this beta version.");
        setIsSubmitting(false);
        return;
      }

      if (!formData.declaration) {
        setErrorMsg("Please affirm the professional declaration to proceed.");
        setIsSubmitting(false);
        return;
      }

      const applicants = getApplicants();
      const newId = Math.random().toString(36).substr(2, 9);
      const year = new Date().getFullYear();
      const randomNum = Math.floor(10000 + Math.random() * 90000);
      
      const isTechnician = regPath === 'QT';
      const initialStatus = isTechnician ? ApplicantStatus.QUALIFIED_TECH : ApplicantStatus.GRADUATE;
      const regNumber = isTechnician ? `QT/${year}/${randomNum}` : `GT/${year}/${randomNum}`;

      const newApplicant: Applicant = {
        id: newId,
        fullName: formData.fullName,
        icPassport: formData.icPassport,
        email: normalizedEmail,
        password: formData.password,
        phone: formData.phone,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
        address: formData.address,
        ethicsDeclaration: formData.ethicsAffirmation,
        nricFront: nricFront || undefined,
        nricBack: nricBack || undefined,
        qualification: formData.qualification,
        field: formData.field,
        yearsOfExperience: Number(formData.yearsOfExperience),
        status: initialStatus,
        registrationDate: new Date().toISOString(),
        cpdRecords: [],
        assessments: [],
        feesPaid: { application: true },
        cvMetadata: cvMetadata || undefined,
        notifications: [
          {
            id: Math.random().toString(36).substr(2, 9),
            title: 'Welcome to MBOT',
            message: 'Your account has been successfully initialized in the professional registry.',
            date: new Date().toISOString(),
            read: false
          }
        ],
        workflowLog: [
          {
            stage: 'Account Created',
            date: new Date().toISOString(),
            actor: 'System Auto-Onboard',
            comments: `Initial registration as ${isTechnician ? 'Qualified Technician' : 'Graduate Technologist'}`
          }
        ]
      };

      if (isTechnician) {
        newApplicant.qtNumber = regNumber;
      } else {
        newApplicant.gtNumber = regNumber;
      }

      saveApplicants([...applicants, newApplicant]);
      setCurrentUser(newId);
      
      setIsSuccess(true);
      setIsSubmitting(false);
      
      setTimeout(() => {
        navigate('/');
        window.location.reload();
      }, 3000);
    }, 1000);
  };

  if (!isSecretariat && !regPath && !isSuccess) {
    return (
      <div className="max-w-4xl mx-auto py-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="bg-white rounded-[3rem] shadow-2xl p-12 border border-slate-100">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-black font-display text-slate-900 uppercase tracking-tight mb-4">Select Registration Path</h1>
            <p className="text-slate-500 font-medium">Initialize your professional record across the MBOT ecosystem.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <button 
              onClick={() => {
                setRegPath('QT');
                setFormData({...formData, qualification: Qualification.DIPLOMA});
              }}
              className="group p-10 bg-slate-50 border-2 border-transparent hover:border-blue-500 hover:bg-white rounded-[2.5rem] transition-all text-left shadow-sm hover:shadow-xl"
            >
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-8 shadow-lg group-hover:scale-110 transition-transform">
                <Briefcase size={32} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 font-display uppercase tracking-tight mb-4">Qualified Technician</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-6">Minimum requirement: <strong>SKM Level 3 MQF</strong> or <strong>Diploma Level 4 MQF</strong> recognized by the Board. Lifetime fee: <strong>RM30</strong>.</p>
              <ul className="space-y-3">
                {['Lifetime Registration', 'No Yearly Renewal', 'Path to Certified Tech (Tc.)'].map((text, i) => (
                  <li key={i} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <CheckCircle2 size={14} className="text-blue-500" /> {text}
                  </li>
                ))}
              </ul>
            </button>

            <button 
              onClick={() => {
                setRegPath('GT');
                setFormData({...formData, qualification: Qualification.BACHELOR});
              }}
              className="group p-10 bg-slate-50 border-2 border-transparent hover:border-indigo-500 hover:bg-white rounded-[2.5rem] transition-all text-left shadow-sm hover:shadow-xl"
            >
              <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mb-8 shadow-lg group-hover:scale-110 transition-transform">
                <Award size={32} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 font-display uppercase tracking-tight mb-4">Graduate Technologist</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-6">Minimum requirement: <strong>Bachelor Degree Level 6 MQF</strong> recognized by the Board. Lifetime fee: <strong>RM50</strong>.</p>
              <ul className="space-y-3">
                {['Digital Registry Record', 'No Yearly Renewal', 'Path to Professional Tech (Ts.)'].map((text, i) => (
                  <li key={i} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <CheckCircle2 size={14} className="text-indigo-500" /> {text}
                  </li>
                ))}
              </ul>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className={cn(
          "p-12 text-white relative h-64 flex flex-col justify-end",
          isSecretariat ? "bg-slate-900" : "bg-blue-600"
        )}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl -mr-32 -mt-32"></div>
          <div className="relative z-10">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-lg",
              isSecretariat ? "bg-indigo-600 text-white" : "bg-white text-blue-600"
            )}>
              {isSecretariat ? <ShieldCheck size={24} /> : <Award size={24} />}
            </div>
            <h1 className="text-4xl font-bold font-display tracking-tight">
              {isSecretariat ? 'Staff Onboarding' : 'Access Portal'}
            </h1>
            <p className="text-slate-400 mt-2 uppercase tracking-[0.3em] text-[10px] font-black">Malaysian Board of Technologists</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-12 space-y-10">
          {isSuccess ? (
            <div className="py-20 text-center space-y-6 animate-in fade-in zoom-in duration-500">
              <div className="mx-auto w-24 h-24 bg-green-100 rounded-[2.5rem] flex items-center justify-center shadow-lg shadow-green-500/10 rotate-3 transition-transform hover:rotate-0">
                <CheckCircle2 className="text-green-600 w-12 h-12" />
              </div>
              <div className="space-y-3">
                <h2 className="text-3xl font-black text-slate-900 font-display tracking-tight">Operation Successful</h2>
                <p className="text-slate-500 max-w-sm mx-auto font-medium">
                  {isSecretariat 
                    ? 'Staff onboarding sequence completed. Your credentials are being initialized in the core registry.' 
                    : 'Registration finalized. Your profile is now active in the national database.'}
                </p>
              </div>
              <div className="pt-8 flex flex-col items-center gap-4">
                <div className="flex justify-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                </div>
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] animate-pulse">Redirecting to Terminal</p>
              </div>
            </div>
          ) : (
            <>
              {errorMsg && (
                <div className="flex items-center gap-4 p-6 bg-red-50 text-red-600 rounded-3xl border border-red-100 animate-in fade-in slide-in-from-top-4 mb-8">
                  <div className="w-10 h-10 bg-red-100 rounded-2xl flex items-center justify-center shrink-0">
                    <ShieldCheck size={20} />
                  </div>
                  <p className="text-xs font-black uppercase tracking-widest">{errorMsg}</p>
                </div>
              )}
              <div>
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8 border-b border-slate-100 pb-2">
                  Identity {isSecretariat ? 'Records' : 'Basis'}
                </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-4">Full Legal Name</label>
                <input 
                  required
                  type="text" 
                  value={formData.fullName}
                  onChange={e => setFormData({...formData, fullName: e.target.value})}
                  className="w-full px-6 py-3.5 bg-slate-50 border-none rounded-full focus:ring-2 focus:ring-blue-500/20 outline-none text-sm transition-all placeholder:text-slate-300"
                  placeholder="As per Identity Document"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-4">{isSecretariat ? 'Staff ID' : 'IC / Passport'}</label>
                <input 
                  required
                  type="text" 
                  value={isSecretariat ? formData.staffId : formData.icPassport}
                  onChange={e => setFormData({...formData, [isSecretariat ? 'staffId' : 'icPassport']: e.target.value})}
                  className="w-full px-6 py-3.5 bg-slate-50 border-none rounded-full focus:ring-2 focus:ring-blue-500/20 outline-none text-sm transition-all placeholder:text-slate-300"
                  placeholder={isSecretariat ? "MBOT-XXXX-2024" : "9XXXXX-XX-XXXX"}
                />
              </div>

              {!isSecretariat && (
                <>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-4">Gender</label>
                    <select 
                      value={formData.gender}
                      onChange={e => setFormData({...formData, gender: e.target.value as Gender})}
                      className="w-full px-6 py-3.5 bg-slate-50 border-none rounded-full focus:ring-2 focus:ring-blue-500/20 outline-none text-sm appearance-none font-medium"
                    >
                      <option value={Gender.MALE}>Male</option>
                      <option value={Gender.FEMALE}>Female</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-4">Date of Birth</label>
                    <input 
                      required
                      type="date" 
                      value={formData.dateOfBirth}
                      onChange={e => setFormData({...formData, dateOfBirth: e.target.value})}
                      className="w-full px-6 py-3.5 bg-slate-50 border-none rounded-full focus:ring-2 focus:ring-blue-500/20 outline-none text-sm font-medium"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-4">Permanent Address</label>
                    <textarea 
                      required
                      rows={2}
                      value={formData.address}
                      onChange={e => setFormData({...formData, address: e.target.value})}
                      className="w-full px-8 py-5 bg-slate-50 border-none rounded-[1.5rem] focus:ring-2 focus:ring-blue-500/20 outline-none text-sm transition-all placeholder:text-slate-300 font-medium"
                      placeholder="Complete mailing address"
                    />
                  </div>
                </>
              )}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-4">
                  {isSecretariat ? 'Official Email address' : 'Digital Mail'}
                </label>
                <input 
                  required
                  type="email" 
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full px-6 py-3.5 bg-slate-50 border-none rounded-full focus:ring-2 focus:ring-blue-500/20 outline-none text-sm transition-all placeholder:text-slate-300"
                  placeholder={isSecretariat ? "name@mbot.gov.my" : "email@mbot.org.my"}
                />
                {isSecretariat && (
                  <p className="text-[9px] text-slate-400 ml-4 italic">Note: Only the @mbot.gov.my domain is authorized for staff accounts.</p>
                )}
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-4">Secure Access Key (Password)</label>
                <input 
                  required
                  type="password" 
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  className="w-full px-6 py-3.5 bg-slate-50 border-none rounded-full focus:ring-2 focus:ring-blue-500/20 outline-none text-sm transition-all placeholder:text-slate-300"
                  placeholder="Min 8 characters recommended"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-4">Mobile Contact</label>
                <input 
                  required
                  type="tel" 
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-6 py-3.5 bg-slate-50 border-none rounded-full focus:ring-2 focus:ring-blue-500/20 outline-none text-sm transition-all placeholder:text-slate-300"
                  placeholder="+601X-XXXXXXX"
                />
              </div>
            </div>
          </div>

          {!isSecretariat ? (
            <>
              <div>
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8 border-b border-slate-100 pb-2">Professional Qualifications</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                   <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-4">Academic Tier</label>
                    <div className="relative">
                      <select 
                        value={formData.qualification}
                        onChange={e => setFormData({...formData, qualification: e.target.value as Qualification})}
                        className="w-full px-6 py-3.5 bg-slate-50 border-none rounded-full focus:ring-2 focus:ring-blue-500/20 outline-none text-sm appearance-none"
                      >
                        {Object.values(Qualification).map(q => <option key={q} value={q}>{q}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-4">Technological Domain</label>
                    <select 
                      value={formData.field}
                      onChange={e => setFormData({...formData, field: e.target.value})}
                      className="w-full px-6 py-3.5 bg-slate-50 border-none rounded-full focus:ring-2 focus:ring-blue-500/20 outline-none text-sm appearance-none"
                    >
                      {MBOT_FIELDS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-4">Years of Practice</label>
                    <input 
                      required
                      type="number" 
                      min="0"
                      value={formData.yearsOfExperience}
                      onChange={e => setFormData({...formData, yearsOfExperience: Number(e.target.value)})}
                      className="w-full px-6 py-3.5 bg-slate-50 border-none rounded-full focus:ring-2 focus:ring-blue-500/20 outline-none text-sm transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-4">Evidence of Proficiency (CV/Resume)</label>
                <div className="relative">
                  <input 
                    type="file" 
                    id="cv-upload" 
                    className="hidden" 
                    onChange={simulateUpload}
                    accept=".pdf,.docx"
                  />
                  <label 
                    htmlFor="cv-upload"
                    className={cn(
                      "border-2 border-dashed rounded-[2rem] p-12 text-center transition-all cursor-pointer group flex flex-col items-center justify-center",
                      uploadStatus === 'idle' && "border-slate-100 bg-slate-50/50 hover:bg-white hover:border-blue-200",
                      uploadStatus === 'uploading' && "border-blue-200 bg-blue-50 animate-pulse",
                      uploadStatus === 'success' && "border-green-200 bg-green-50",
                      uploadStatus === 'error' && "border-red-200 bg-red-50"
                    )}
                  >
                    {uploadStatus === 'idle' && (
                      <>
                        <Upload className="mx-auto w-12 h-12 text-slate-300 group-hover:text-blue-600 mb-4 transition-transform group-hover:-translate-y-1" />
                        <p className="text-sm text-slate-600 font-bold">Transmit Secure Document</p>
                        <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-widest">Authorized formats: PDF, DOCX • Limit: 10MB</p>
                      </>
                    )}
                    {uploadStatus === 'uploading' && (
                      <>
                        <Clock className="w-12 h-12 text-blue-500 mb-4 animate-spin" />
                        <p className="text-sm text-blue-600 font-bold">Uploading Artifact...</p>
                      </>
                    )}
                    {uploadStatus === 'success' && (
                      <>
                        <CheckCircle2 className="w-12 h-12 text-green-500 mb-4 border-white" />
                        <p className="text-sm text-green-600 font-bold">CV Transmitted Successfully</p>
                        <p className="text-[10px] text-green-500 mt-1">{cvMetadata?.name}</p>
                      </>
                    )}
                    {uploadStatus === 'error' && (
                      <>
                        <Award className="w-12 h-12 text-red-500 mb-4 rotate-180" />
                        <p className="text-sm text-red-600 font-bold">Transmission Failed</p>
                        <p className="text-[10px] text-red-500 mt-1 uppercase tracking-widest">{uploadError}</p>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {!isSecretariat && (
                <div className="space-y-6">
                  <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8 border-b border-slate-100 pb-2">Identification Artifacts</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-4">NRIC Front View</label>
                      <div 
                        onClick={() => document.getElementById('nric-front')?.click()}
                        className={cn(
                          "aspect-[1.58/1] w-full border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden",
                          nricFront ? "border-blue-500" : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                        )}
                      >
                        {nricFront ? (
                          <img src={nricFront} className="w-full h-full object-cover" alt="NRIC Front" />
                        ) : (
                          <>
                            <UserCircle className="text-slate-300 mb-2" size={32} />
                            <p className="text-[9px] font-black uppercase text-slate-400">Upload Front</p>
                          </>
                        )}
                        <input id="nric-front" type="file" accept="image/*" className="hidden" onChange={(e) => simulateNRICUpload(e, 'front')} />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-4">NRIC Rear View</label>
                      <div 
                        onClick={() => document.getElementById('nric-back')?.click()}
                        className={cn(
                          "aspect-[1.58/1] w-full border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden",
                          nricBack ? "border-blue-500" : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                        )}
                      >
                        {nricBack ? (
                          <img src={nricBack} className="w-full h-full object-cover" alt="NRIC Back" />
                        ) : (
                          <>
                            <UserCircle className="text-slate-300 mb-2" size={32} />
                            <p className="text-[9px] font-black uppercase text-slate-400">Upload Back</p>
                          </>
                        )}
                        <input id="nric-back" type="file" accept="image/*" className="hidden" onChange={(e) => simulateNRICUpload(e, 'back')} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <input 
                    required
                    type="checkbox" 
                    id="declaration"
                    checked={formData.declaration}
                    onChange={e => setFormData({...formData, declaration: e.target.checked})}
                    className="mt-1 w-5 h-5 text-blue-600 rounded-full border-slate-300 focus:ring-blue-500" 
                  />
                  <label htmlFor="declaration" className="text-xs text-slate-500 leading-relaxed font-medium">
                    {regPath === 'QT' ? (
                      "I affirm that all provided information is accurate and authentic. I acknowledge that misrepresentation constitutes a violation of Act 768. I consent to the RM30 lifetime registration fee (Qualified Technician) for the Malaysia Board of Technologists."
                    ) : (
                      "I affirm that all provided information is accurate and authentic. I acknowledge that misrepresentation constitutes a violation of Act 768. I consent to the RM50 lifetime registration fee (Graduate Technologist) for the Malaysia Board of Technologists."
                    )}
                  </label>
                </div>

                <div className="flex items-start gap-4 bg-blue-50 p-6 rounded-3xl border border-blue-100">
                  <input 
                    required
                    type="checkbox" 
                    id="ethicsAffirmation"
                    checked={formData.ethicsAffirmation}
                    onChange={e => setFormData({...formData, ethicsAffirmation: e.target.checked})}
                    className="mt-1 w-5 h-5 text-blue-600 rounded-full border-slate-300 focus:ring-blue-500" 
                  />
                  <label htmlFor="ethicsAffirmation" className="text-xs text-blue-700 leading-relaxed font-bold">
                    [Professional Ethics] I solemnly declare that I shall abide by the Code of Professional Ethics and Conduct as stipulated by the Board and shall endeavor to uphold the integrity of the profession at all times.
                  </label>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-8">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8 border-b border-slate-100 pb-2">Departmental Assignment</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-4">Assigned Department</label>
                  <select 
                    value={formData.department}
                    onChange={e => setFormData({...formData, department: e.target.value})}
                    className="w-full px-6 py-3.5 bg-slate-50 border-none rounded-full focus:ring-2 focus:ring-blue-500/20 outline-none text-sm appearance-none font-bold"
                  >
                    <option value="Registration & Certification">Registration & Certification</option>
                    <option value="CPD & Training">CPD & Training</option>
                    <option value="Policy & Enforcement">Policy & Enforcement</option>
                    <option value="Management & Admin">Management & Admin</option>
                  </select>
                </div>
              </div>
              
              <div className="flex items-start gap-4 bg-slate-900/5 p-6 rounded-3xl border border-slate-100">
                <ShieldCheck className="text-slate-400 shrink-0 mt-1" size={18} />
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  By onboarding this account, you confirm your status as an authorized MBOT secretariat personnel. All actions within the administrative portal are logged and subject to government audit under relevant cybersecurity and privacy laws.
                </p>
              </div>
            </div>
          )}

          <button 
            type="submit"
            disabled={isSubmitting}
            className={cn(
              "w-full py-6 text-white font-black rounded-full shadow-2xl transition-all active:scale-[0.98] uppercase tracking-[0.4em] text-[10px] flex items-center justify-center gap-3",
              isSecretariat ? "bg-slate-900 shadow-slate-900/20 hover:bg-slate-800" : "bg-blue-600 shadow-blue-500/20 hover:bg-blue-700",
              isSubmitting && "opacity-50 cursor-not-allowed"
            )}
          >
            {isSubmitting ? (
              <>
                <Clock className="animate-spin" size={14} /> Processing...
              </>
            ) : (
              isSecretariat ? 'Onboard Staff Account' : 'Finalize Registration'
            )}
          </button>
          </>
          )}
        </form>
      </div>
    </div>
  );
}
