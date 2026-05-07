import { useState, useEffect } from 'react';
import { Clock, CheckCircle2, AlertCircle, Calendar, User, Eye, ArrowRight, X, RotateCcw, ShieldAlert, CheckCircle, MapPin, Mail, Phone, ShieldCheck, MessageSquare, Image, ShieldX, Check, FileText } from 'lucide-react';
import { getApplicants, saveApplicants } from '../../lib/storage';
import { Applicant, ApplicantStatus } from '../../types';
import { cn } from '../../lib/utils';

export default function ApplicationQueue() {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [remarks, setRemarks] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'artifacts' | 'history'>('details');

  const notify = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(null), 3000);
  };

  useEffect(() => {
    setApplicants(getApplicants());
  }, []);

  const pendingApplications = applicants.filter(a => [
    ApplicantStatus.PROFESSIONAL_PENDING,
    ApplicantStatus.ASSESSMENT_PASSED,
    ApplicantStatus.CERTIFICATE_READY
  ].includes(a.status));

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

  return (
    <div className="space-y-6">
      <div>
         <h1 className="text-2xl font-bold text-slate-900 font-display uppercase tracking-tight">Verification Queue</h1>
         <p className="text-slate-500 text-sm">Monitor and move Professional Technologist upgrade applications through the active workflow.</p>
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
         <button className="shrink-0 bg-white text-slate-900 px-10 py-5 rounded-2xl text-xs font-bold uppercase tracking-wider shadow-2xl hover:bg-slate-100 transition-all active:scale-95 relative z-10" onClick={() => alert("Bulk processing engine engaged.")}>
            Launch Batch Verify
         </button>
      </div>

      {/* Detail Modal */}
      {selectedApplicant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
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
                         <button className="px-6 py-2 bg-blue-600 hover:bg-blue-500 transition-colors rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                            <Eye size={12} /> Inspect File
                         </button>
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
                              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 transition-all hover:bg-white hover:shadow-lg">
                                 <p className="text-[10px] text-slate-500 font-medium leading-relaxed italic">"{log.comments}"</p>
                                 <p className="mt-3 text-[8px] font-black uppercase tracking-widest text-blue-600">Officer: {log.actor}</p>
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

              <div className="p-10 bg-slate-50 border-t border-slate-100 space-y-6">
                 <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Internal Remarks / Deficiency Notice</label>
                    <textarea 
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Enter internal evaluation notes or deficiency reports..."
                      className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none text-[11px] font-medium transition-all"
                      rows={2}
                    />
                 </div>
                 <div className="flex gap-4">
                    <button 
                      onClick={() => handleAction(selectedApplicant.id, ApplicantStatus.UNDER_REVIEW)}
                      className="flex-1 py-4 bg-orange-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all flex items-center justify-center gap-2"
                    >
                       <ShieldAlert size={14} /> Mark for Review
                    </button>
                    <button 
                      onClick={() => handleAction(selectedApplicant.id, ApplicantStatus.ASSESSMENT_PASSED)}
                      className="flex-1 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                    >
                       <Check size={14} /> Validate Identity
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
