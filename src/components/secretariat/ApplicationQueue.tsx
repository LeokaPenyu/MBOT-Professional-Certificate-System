import { useState, useEffect } from 'react';
import { Clock, CheckCircle2, AlertCircle, Calendar, User, Eye, ArrowRight, X, RotateCcw, ShieldAlert, CheckCircle, MapPin, Mail, Phone, ShieldCheck, MessageSquare, Image, ShieldX, Check, FileText } from 'lucide-react';
import { getApplicants, saveApplicants } from '../../lib/storage';
import { Applicant, ApplicantStatus } from '../../types';
import { cn } from '../../lib/utils';

export default function ApplicationQueue() {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [remarks, setRemarks] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'artifacts' | 'history'>('details');
  const [isInspecting, setIsInspecting] = useState(false);

  const notify = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(null), 3000);
  };

  useEffect(() => {
    setApplicants(getApplicants());

    const handleGlobalSearch = (e: any) => {
      setSearchTerm(e.detail);
    };

    window.addEventListener('mbot-global-search', handleGlobalSearch);
    return () => window.removeEventListener('mbot-global-search', handleGlobalSearch);
  }, []);

  const pendingApplications = applicants.filter(a => {
    const isPending = [
      ApplicantStatus.PROFESSIONAL_PENDING,
      ApplicantStatus.ASSESSMENT_PASSED,
      ApplicantStatus.CERTIFICATE_READY
    ].includes(a.status);
    
    const matchesSearch = a.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          a.field.toLowerCase().includes(searchTerm.toLowerCase());
                          
    return isPending && matchesSearch;
  });

  const handleAction = (id: string, nextStatus: ApplicantStatus) => {
    const updated = applicants.map(a => {
      if (a.id === id) {
        let finalStatus = nextStatus;
        let additionalFields: Partial<Applicant> = {};

        // If issuing final cert, determine correct end status
        if (nextStatus === ApplicantStatus.PROFESSIONAL) {
          const isTechnician = a.qtNumber !== undefined || a.status === ApplicantStatus.QUALIFIED_TECH;
          finalStatus = isTechnician ? ApplicantStatus.CERTIFIED_TECH : ApplicantStatus.PROFESSIONAL;
          
          const year = new Date().getFullYear();
          const randomNum = Math.floor(1000 + Math.random() * 9000);
          
          if (isTechnician) {
            additionalFields = { cTechNumber: `CT/${year}/${randomNum}` };
          } else {
            additionalFields = { pTechNumber: `PT/${year}/${randomNum}` };
          }
        }

        const logEntry = {
          stage: nextStatus,
          date: new Date().toISOString(),
          actor: 'Registry Officer (SO)',
          comments: remarks || `Application moved to ${nextStatus}.`
        };

        return { 
          ...a, 
          status: finalStatus, 
          ...additionalFields,
          workflowLog: [...(a.workflowLog || []), logEntry]
        };
      }
      return a;
    });
    setApplicants(updated);
    saveApplicants(updated);
    setRemarks('');
    setSelectedApplicant(null);
    notify(`WORKFLOW COMMITTED: Identity shifted to ${nextStatus}`);
  };

  const handleHold = (id: string) => {
    notify("REGULATORY ACTION: Application flag raised for manual review.");
  };

  const handleBulkBatch = () => {
    if (pendingApplications.length === 0) {
      notify("No applications in queue to process.");
      return;
    }

    const updated = applicants.map(a => {
      // Find if this applicant is in the current filtered/pending view
      const isPendingInView = pendingApplications.some(pa => pa.id === a.id);
      if (!isPendingInView) return a;

      let nextStatus: ApplicantStatus;
      if (a.status === ApplicantStatus.PROFESSIONAL_PENDING) nextStatus = ApplicantStatus.ASSESSMENT_PASSED;
      else if (a.status === ApplicantStatus.ASSESSMENT_PASSED) nextStatus = ApplicantStatus.CERTIFICATE_READY;
      else if (a.status === ApplicantStatus.CERTIFICATE_READY) nextStatus = ApplicantStatus.PROFESSIONAL;
      else return a;

      let finalStatus: ApplicantStatus = nextStatus;
      let additionalFields: Partial<Applicant> = {};

      if (nextStatus === ApplicantStatus.PROFESSIONAL) {
        const isTechnician = a.qtNumber !== undefined || a.status === ApplicantStatus.QUALIFIED_TECH;
        finalStatus = isTechnician ? ApplicantStatus.CERTIFIED_TECH : ApplicantStatus.PROFESSIONAL;
        
        const year = new Date().getFullYear();
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        
        if (isTechnician) {
          additionalFields = { cTechNumber: `CT/${year}/${randomNum}` };
        } else {
          additionalFields = { pTechNumber: `PT/${year}/${randomNum}` };
        }
      }

      const logEntry = {
        stage: nextStatus,
        date: new Date().toISOString(),
        actor: 'Registry Officer (SO) [BATCH]',
        comments: `Automated batch processing for active queue.`
      };

      return { 
        ...a, 
        status: finalStatus, 
        ...additionalFields,
        workflowLog: [...(a.workflowLog || []), logEntry]
      };
    });

    setApplicants(updated);
    saveApplicants(updated);
    notify(`BATCH COMPLETE: ${pendingApplications.length} identities processed through the workflow.`);
  };

  return (
    <div className="space-y-6">
      <div>
         <h1 className="text-2xl font-bold text-slate-900 font-display uppercase tracking-tight">Verification Queue</h1>
         <p className="text-slate-500 text-sm">Monitor and move Professional Certificate applications through the active workflow.</p>
      </div>

      {statusMsg && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top duration-500">
           <div className="bg-slate-900 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4">
              <CheckCircle size={18} className="text-green-400" />
              <span className="text-xs font-semibold uppercase tracking-wider">{statusMsg}</span>
           </div>
        </div>
      )}

      <div className="grid gap-4">
         {pendingApplications.length === 0 ? (
            <div className="bg-white rounded-3xl p-24 text-center border border-slate-200 border-dashed">
               <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-100">
                 <CheckCircle2 size={32} />
               </div>
               <p className="text-slate-400 font-semibold text-sm">Queue is clean! No pending applications.</p>
            </div>
         ) : (
            pendingApplications.map(applicant => (
              <div key={applicant.id} className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all flex flex-col lg:flex-row items-start lg:items-center gap-8 group">
                 <div className="flex items-center gap-6 min-w-[280px]">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-900 transition-transform group-hover:scale-110">
                       <User size={20} className="text-blue-600" />
                    </div>
                    <div className="space-y-1">
                       <h3 className="font-bold text-slate-900 tracking-tight">{applicant.fullName}</h3>
                       <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">{applicant.field}</p>
                    </div>
                 </div>

                 <div className="flex-1 flex flex-wrap gap-4">
                    <div className="px-4 py-2 bg-slate-50 rounded-xl flex items-center gap-2 border border-slate-100">
                       <Calendar size={14} className="text-slate-400" />
                       <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Applied: {new Date(applicant.registrationDate).toLocaleDateString('en-MY')}</span>
                    </div>
                    <div className={cn(
                      "px-4 py-2 rounded-xl flex items-center gap-2 border",
                      applicant.status === ApplicantStatus.PROFESSIONAL_PENDING ? "bg-orange-50 text-orange-600 border-orange-100" :
                      applicant.status === ApplicantStatus.ASSESSMENT_PASSED ? "bg-blue-50 text-blue-600 border-blue-100" :
                      "bg-green-50 text-green-600 border-green-100"
                    )}>
                       <div className={cn("w-1.5 h-1.5 rounded-full", 
                         applicant.status === ApplicantStatus.PROFESSIONAL_PENDING ? "bg-orange-500" :
                         applicant.status === ApplicantStatus.ASSESSMENT_PASSED ? "bg-blue-500" : "bg-green-500"
                       )} />
                       <span className="text-[10px] font-bold uppercase tracking-wider">{applicant.status}</span>
                    </div>
                 </div>

                 <div className="flex items-center gap-3 w-full lg:w-auto">
                    <button 
                      onClick={() => handleHold(applicant.id)}
                      className="w-11 h-11 bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 rounded-xl transition-all flex items-center justify-center shadow-sm"
                      title="Place Application on Hold"
                    >
                       <ShieldAlert size={18} />
                    </button>

                    <button 
                      onClick={() => setSelectedApplicant(applicant)}
                      className="w-11 h-11 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-400 rounded-xl transition-all flex items-center justify-center shadow-sm"
                      title="Inspect Profile"
                    >
                       <Eye size={18} />
                    </button>
                    
                    {applicant.status === ApplicantStatus.PROFESSIONAL_PENDING && (
                      <button 
                        onClick={() => handleAction(applicant.id, ApplicantStatus.ASSESSMENT_PASSED)}
                        className="flex-1 lg:flex-none px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shadow-lg shadow-slate-900/10"
                      >
                         Confirm Pass <ArrowRight size={14} />
                      </button>
                    )}

                    {applicant.status === ApplicantStatus.ASSESSMENT_PASSED && (
                      <button 
                        onClick={() => handleAction(applicant.id, ApplicantStatus.CERTIFICATE_READY)}
                        className="flex-1 lg:flex-none px-6 py-3 bg-blue-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-blue-700 transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-600/20"
                      >
                         Approve Payment <ArrowRight size={14} />
                      </button>
                    )}

                    {applicant.status === ApplicantStatus.CERTIFICATE_READY && (
                      <button 
                        onClick={() => handleAction(applicant.id, ApplicantStatus.PROFESSIONAL)}
                        className="flex-1 lg:flex-none px-6 py-3 bg-green-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-green-700 transition-all flex items-center justify-center gap-3 shadow-lg shadow-green-600/20"
                      >
                         Issue Final Cert <CheckCircle2 size={14} />
                      </button>
                    )}
                 </div>
              </div>
            ))
         )}
      </div>

      <div className="mt-16 bg-slate-900 rounded-3xl p-10 text-white flex flex-col md:flex-row items-center gap-10 overflow-hidden relative border border-white/5 shadow-xl">
         <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-transparent"></div>
         <div className="flex-1 space-y-3 text-center md:text-left relative z-10">
            <h3 className="text-2xl font-bold font-display tracking-tight">Bulk Batch Processing</h3>
            <p className="text-sm text-slate-400 font-medium leading-relaxed max-w-lg">Initiate verification for applicants who have met all regulatory compliance standards across verified fields.</p>
         </div>
         <button className="shrink-0 bg-white text-slate-900 px-10 py-5 rounded-2xl text-xs font-bold uppercase tracking-wider shadow-2xl hover:bg-slate-100 transition-all active:scale-95 relative z-10" onClick={handleBulkBatch}>
            Launch Batch Verify
         </button>
      </div>

      {/* Detail Modal */}
      {selectedApplicant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col relative">
              <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                 <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-2xl italic">
                       {selectedApplicant.fullName.charAt(0)}
                    </div>
                    <div>
                       <h2 className="text-2xl font-black text-slate-900 font-display uppercase tracking-tight">{selectedApplicant.fullName}</h2>
                       <p className="text-slate-400 text-[10px] mt-1 font-black uppercase tracking-[0.2em] flex items-center gap-2">
                         <ShieldCheck size={12} className="text-blue-600" />
                         MBOT Audit Logic • ID: {selectedApplicant.id}
                       </p>
                    </div>
                 </div>
                 <button onClick={() => setSelectedApplicant(null)} className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-900 shadow-sm border border-slate-100 transition-all hover:rotate-90">
                    <X size={20} />
                 </button>
              </div>

              {/* Modal Tabs */}
              <div className="flex px-10 pt-6 gap-8 border-b border-slate-50">
                {['details', 'artifacts', 'history'].map((tab) => (
                  <button 
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={cn(
                      "pb-4 text-[10px] font-black uppercase tracking-widest transition-all relative",
                      activeTab === tab ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    {tab}
                    {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-full" />}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                 {activeTab === 'details' && (
                   <div className="animate-in slide-in-from-left-4 fade-in duration-300">
                      <div className="grid grid-cols-2 gap-10 mb-10">
                         <div className="space-y-6">
                           <div>
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Gender / Date of Birth</label>
                              <p className="text-xs font-bold text-slate-900 bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-3">
                                <User size={14} className="text-blue-500" />
                                {selectedApplicant.gender || 'Not Specified'} • {selectedApplicant.dateOfBirth || 'Not Specified'}
                              </p>
                           </div>
                           <div>
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Digital Mail</label>
                              <p className="text-xs font-bold text-slate-900 bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-3">
                                <Mail size={14} className="text-blue-500" />
                                {selectedApplicant.email}
                              </p>
                           </div>
                           <div>
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Primary Contact</label>
                              <p className="text-xs font-bold text-slate-900 bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-3">
                                <Phone size={14} className="text-blue-500" />
                                {selectedApplicant.phone || '012-XXXXXXX'}
                              </p>
                           </div>
                         </div>
                         <div className="space-y-6">
                           <div>
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Registered Domain</label>
                              <p className="text-xs font-bold text-slate-900 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                {selectedApplicant.field}
                              </p>
                           </div>
                           <div>
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Permanent Address</label>
                              <div className="text-[11px] font-medium text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 h-[116px] overflow-y-auto leading-relaxed">
                                <MapPin size={12} className="inline mr-2 text-blue-500" />
                                {selectedApplicant.address || 'No address provided in digital registry.'}
                              </div>
                           </div>
                         </div>
                      </div>
                      <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 flex items-start gap-4">
                         <ShieldCheck className="text-blue-600 mt-1 shrink-0" size={20} />
                         <div>
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Ethics Acceptance</p>
                            <p className="text-[11px] text-blue-800 font-medium leading-relaxed italic">
                              "The applicant has formally declared adherence to the Professional Code of Ethics as mandated under Act 768."
                            </p>
                         </div>
                      </div>
                   </div>
                 )}

                 {activeTab === 'artifacts' && (
                   <div className="animate-in slide-in-from-left-4 fade-in duration-300 grid grid-cols-2 gap-8">
                      <div className="space-y-4">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">NRIC Identification (Front)</p>
                         {selectedApplicant.nricFront ? (
                           <div className="aspect-[1.6/1] bg-slate-100 rounded-2xl overflow-hidden border border-slate-200">
                              <img src={selectedApplicant.nricFront} className="w-full h-full object-cover" />
                           </div>
                         ) : (
                           <div className="aspect-[1.6/1] bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300">
                              <Image size={40} className="mb-2" />
                              <p className="text-[8px] font-black uppercase">No Front Image</p>
                           </div>
                         )}
                      </div>
                      <div className="space-y-4">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">NRIC Identification (Back)</p>
                         {selectedApplicant.nricBack ? (
                           <div className="aspect-[1.6/1] bg-slate-100 rounded-2xl overflow-hidden border border-slate-200">
                              <img src={selectedApplicant.nricBack} className="w-full h-full object-cover" />
                           </div>
                         ) : (
                           <div className="aspect-[1.6/1] bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300">
                              <Image size={40} className="mb-2" />
                              <p className="text-[8px] font-black uppercase">No Back Image</p>
                           </div>
                         )}
                      </div>
                      <div className="col-span-2 p-6 bg-slate-900 rounded-3xl text-white flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                               <FileText size={20} className="text-blue-400" />
                            </div>
                            <div>
                               <p className="text-xs font-bold leading-tight">Professional Evidence (CV)</p>
                               <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5">Verified Artifact • PDF</p>
                            </div>
                         </div>
                         <button 
                           onClick={() => {
                             notify("ACCESSING SECURE AUDIT VAULT...");
                             setTimeout(() => setIsInspecting(true), 500);
                           }}
                           className="px-6 py-3 bg-blue-600 hover:bg-blue-700 transition-all rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-blue-600/20 active:scale-95"
                         >
                            <Eye size={14} className="animate-pulse" /> Inspect Evidence
                         </button>
                      </div>
                   </div>
                 )}

                 {isInspecting && (
                   <div className="absolute inset-0 z-[60] bg-slate-900 flex flex-col animate-in fade-in zoom-in duration-300">
                      <div className="p-6 border-b border-white/10 flex justify-between items-center">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                               <ShieldCheck size={20} />
                            </div>
                            <div>
                               <p className="text-[10px] font-black text-white uppercase tracking-widest">MBOT Document Audit Hub</p>
                               <p className="text-[9px] text-slate-500 font-bold">Secure Session • PDF Encryption 256-bit</p>
                            </div>
                         </div>
                         <button 
                           onClick={() => setIsInspecting(false)}
                           className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                         >
                            <X size={20} />
                         </button>
                      </div>
                      <div className="flex-1 p-12 overflow-y-auto bg-slate-950 flex flex-col items-center">
                         {/* Mock PDF Content */}
                         <div className="w-full max-w-2xl bg-white shadow-2xl rounded-sm p-16 space-y-8 min-h-[1000px]">
                            <div className="flex justify-between items-start border-b-4 border-slate-900 pb-8">
                               <div className="text-2xl font-black uppercase tracking-tighter text-slate-900">Curriculum Vitae</div>
                               <div className="text-right">
                                  <p className="text-[10px] font-black uppercase text-slate-400">Registry Reference</p>
                                  <p className="text-sm font-bold text-slate-900">{selectedApplicant.id}</p>
                               </div>
                            </div>

                            <div className="space-y-4">
                               <h4 className="text-xs font-black uppercase tracking-widest text-blue-600">Professional Summary</h4>
                               <p className="text-[11px] leading-relaxed text-slate-600 font-medium">
                                 Dedicated professional in the field of {selectedApplicant.field} with {selectedApplicant.yearsOfExperience} years of industrial experience. 
                                 Expertise in technical infrastructure management and regulatory compliance. seeking upgrade to Professional Certificate status.
                               </p>
                            </div>

                            <div className="space-y-4">
                               <h4 className="text-xs font-black uppercase tracking-widest text-blue-600">Educational Background</h4>
                               <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                  <p className="text-[11px] font-bold text-slate-900">{selectedApplicant.qualification} in {selectedApplicant.field}</p>
                                  <p className="text-[9px] font-black text-slate-400 uppercase mt-1">Verified via Malaysian Qualifications Agency (MQA)</p>
                               </div>
                            </div>

                            <div className="space-y-4">
                               <h4 className="text-xs font-black uppercase tracking-widest text-blue-600">Key Projects & Competencies</h4>
                               <ul className="grid grid-cols-2 gap-3">
                                  {['System Architecture', 'Technical Audit', 'Infrastructure Deployment', 'Project Management'].map((skill, i) => (
                                    <li key={i} className="flex items-center gap-3 text-[10px] font-bold text-slate-700">
                                       <CheckCircle2 size={12} className="text-green-500" />
                                       {skill}
                                    </li>
                                  ))}
                               </ul>
                            </div>

                            <div className="pt-20 border-t border-slate-100 flex justify-between items-end grayscale opacity-50">
                               <div className="space-y-1">
                                  <div className="w-32 h-px bg-slate-400 mb-4" />
                                  <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 italic">Digitally Signed by</p>
                                  <p className="text-[10px] font-bold text-slate-900 uppercase">{selectedApplicant.fullName}</p>
                               </div>
                               <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center text-slate-300">
                                  <ShieldCheck size={32} />
                               </div>
                            </div>
                         </div>
                      </div>
                      <div className="p-6 bg-slate-900 border-t border-white/5 flex justify-center gap-4">
                         <button onClick={() => setIsInspecting(false)} className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Close Viewer</button>
                         <button className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Download Audit Copy</button>
                      </div>
                   </div>
                 )}

                 {activeTab === 'history' && (
                   <div className="animate-in slide-in-from-left-4 fade-in duration-300 space-y-6">
                      {selectedApplicant.workflowLog?.slice().reverse().map((log, idx) => (
                        <div key={idx} className="flex gap-6 group">
                           <div className="flex flex-col items-center gap-2">
                              <div className={cn("w-3 h-3 rounded-full mt-1 border-2 border-white ring-4 transition-all", idx === 0 ? "bg-blue-600 ring-blue-50" : "bg-slate-300 ring-slate-50")}></div>
                              <div className="flex-1 w-0.5 bg-slate-100"></div>
                           </div>
                           <div className="flex-1 mb-2">
                              <div className="flex justify-between items-center mb-2">
                                 <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{log.stage}</span>
                                 <span className="text-[9px] font-bold text-slate-400">{new Date(log.date).toLocaleString()}</span>
                              </div>
                              <div className={cn(
                                 "p-4 rounded-2xl border transition-all hover:shadow-lg",
                                 log.stage === ApplicantStatus.UNDER_REVIEW ? "bg-orange-50 border-orange-100" : "bg-slate-50 border-slate-100 hover:bg-white"
                               )}>
                                  <p className={cn(
                                    "text-[10px] font-medium leading-relaxed italic",
                                    log.stage === ApplicantStatus.UNDER_REVIEW ? "text-orange-900" : "text-slate-500"
                                  )}>"{log.comments}"</p>
                                  <div className="flex items-center justify-between mt-3">
                                    <p className={cn(
                                      "text-[8px] font-black uppercase tracking-widest",
                                      log.stage === ApplicantStatus.UNDER_REVIEW ? "text-orange-600" : "text-blue-600"
                                    )}>Officer: {log.actor}</p>
                                    {log.stage === ApplicantStatus.UNDER_REVIEW && (
                                      <span className="bg-orange-200 text-orange-700 px-2 py-0.5 rounded text-[7px] font-black uppercase">Technical Deficiency</span>
                                    )}
                                  </div>
                               </div>
                           </div>
                        </div>
                      ))}
                      {!selectedApplicant.workflowLog?.length && (
                        <div className="text-center py-10 opacity-30">
                           <MessageSquare className="mx-auto mb-4" size={32} />
                           <p className="text-[10px] font-black uppercase">No registry trail</p>
                        </div>
                      )}
                   </div>
                 )}
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100 mt-auto">
                 <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 overflow-hidden">
                    <div className="flex flex-col lg:flex-row gap-6">
                      <div className="flex-1 space-y-3">
                         <div className="flex items-center justify-between">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] block px-1">Evaluation & Deficiency Notice</label>
                            {remarks.length > 0 && <span className="text-[9px] font-bold text-blue-500 animate-in fade-in slide-in-from-right-2">{remarks.length} chars</span>}
                         </div>
                         <textarea 
                           value={remarks}
                           onChange={(e) => setRemarks(e.target.value)}
                           placeholder="Type findings here to be recorded in audit trail..."
                           className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none text-[11px] font-bold text-slate-700 transition-all resize-none shadow-inner placeholder:text-slate-300"
                           rows={2}
                         />
                      </div>
                      <div className="flex lg:flex-col gap-3 w-full lg:w-48 justify-end">
                         <button 
                           onClick={() => handleAction(selectedApplicant.id, ApplicantStatus.UNDER_REVIEW)}
                           className="flex-1 py-4 px-6 bg-white border border-slate-200 text-orange-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-50 hover:border-orange-200 transition-all flex items-center justify-center gap-3 active:scale-95"
                         >
                            <ShieldAlert size={14} /> Hold Review
                         </button>
                         <button 
                           onClick={() => handleAction(selectedApplicant.id, ApplicantStatus.ASSESSMENT_PASSED)}
                           className="flex-1 py-4 px-6 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-600/20 active:scale-95"
                         >
                            <Check size={14} /> Verify Pass
                         </button>
                      </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
