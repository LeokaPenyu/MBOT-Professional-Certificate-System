import React, { useState, useEffect } from 'react';
import { Search, Filter, MoreVertical, CheckCircle, User, ChevronRight, FileEdit, Trash2, Mail, MessageSquare, ShieldCheck, X, Save, AlertCircle, Trash, History, Clock } from 'lucide-react';
import { getApplicants, saveApplicants } from '../../lib/storage';
import { Applicant, ApplicantStatus } from '../../types';
import { MBOT_FIELDS } from '../../constants';
import { cn } from '../../lib/utils';

export default function ApplicantList() {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [editingApplicant, setEditingApplicant] = useState<Applicant | null>(null);
  const [viewingLogs, setViewingLogs] = useState<Applicant | null>(null);

  const notify = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(null), 3000);
  };

  useEffect(() => {
    setApplicants(getApplicants());
  }, []);

  const saveUpdatedApplicants = (updated: Applicant[]) => {
    setApplicants(updated);
    saveApplicants(updated);
  };

  const handleStatusChange = (id: string, newStatus: ApplicantStatus) => {
    const updated = applicants.map(a => {
      if (a.id === id) {
        let finalStatus = newStatus;
        let additionalFields = {};

        if (newStatus === ApplicantStatus.PROFESSIONAL) {
          const isTechnician = a.qtNumber !== undefined;
          finalStatus = isTechnician ? ApplicantStatus.CERTIFIED_TECH : ApplicantStatus.PROFESSIONAL;
          
          const year = new Date().getFullYear();
          const randomNum = Math.floor(10000 + Math.random() * 90000);
          
          if (isTechnician) {
            additionalFields = { cTechNumber: `Tc./${year}/${randomNum}` };
          } else {
            additionalFields = { pTechNumber: `Ts./${year}/${randomNum}` };
          }
        }
        return { ...a, status: finalStatus, ...additionalFields };
      }
      return a;
    });
    saveUpdatedApplicants(updated);
    notify(`REGISTRY UPDATE: Status changed to ${newStatus}`);
  };

  const deleteApplicant = (id: string) => {
    setApplicants(prev => {
      const updated = prev.filter(a => a.id !== id);
      saveApplicants(updated);
      return updated;
    });
    notify("REGISTRY UPDATE: Profile successfully decommissioned and purged.");
  };

  const updateApplicantInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApplicant) return;

    const updated = applicants.map(a => a.id === editingApplicant.id ? editingApplicant : a);
    saveUpdatedApplicants(updated);
    setEditingApplicant(null);
    notify("REGISTRY UPDATE: Record successfully committed to database.");
  };

  const filtered = applicants.filter(a => {
    const matchesSearch = a.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          a.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          a.gtNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = statusFilter === 'All' || a.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <h1 className="text-2xl font-bold text-slate-900 font-display uppercase tracking-tight">Professional Registry</h1>
           <p className="text-slate-500 text-sm font-medium">Manage, verify, and audit registered technological professionals.</p>
        </div>
      </div>

      {statusMsg && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top duration-500">
           <div className="bg-slate-900 border border-slate-800 text-white px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-4">
              <CheckCircle size={18} className="text-green-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">{statusMsg}</span>
           </div>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-8 bg-white border-b border-slate-50 flex flex-col lg:flex-row gap-6 items-center justify-between">
           <div className="relative w-full max-w-xl group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Search registry by name, IC, or GT number..."
                className="w-full pl-16 pr-6 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 text-xs font-semibold tracking-wider transition-all placeholder:text-slate-300"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
           </div>
           <div className="flex gap-3 w-full lg:w-auto">
              <div className="relative flex-1 lg:flex-none">
                 <select 
                   className="w-full lg:w-64 px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 text-[10px] font-black uppercase tracking-widest text-slate-500 appearance-none cursor-pointer"
                   value={statusFilter}
                   onChange={e => setStatusFilter(e.target.value)}
                 >
                   <option value="All">All Registration States</option>
                   {Object.values(ApplicantStatus).map(s => <option key={s} value={s}>{s}</option>)}
                 </select>
                 <Filter className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={16} />
              </div>
           </div>
        </div>

        <div className="overflow-x-auto flex-1">
           <table className="w-full text-left min-w-[900px]">
              <thead className="bg-slate-50/50 text-xs uppercase font-semibold text-slate-400 tracking-wider border-b border-slate-100">
                 <tr>
                    <th className="px-10 py-6">Professional Profile</th>
                    <th className="px-10 py-6">Core Competency</th>
                    <th className="px-10 py-6">Regulatory Status</th>
                    <th className="px-10 py-6 text-right">Registry Actions</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {filtered.map(applicant => (
                   <tr key={applicant.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-10 py-6">
                         <div className="flex items-center gap-5">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-xs border border-slate-200/50">
                               {applicant.fullName.charAt(0)}
                            </div>
                            <div className="space-y-0.5">
                               <p className="font-bold text-slate-900 text-sm tracking-tight">{applicant.fullName}</p>
                               <p className="text-[11px] text-slate-400 font-medium">{applicant.email}</p>
                            </div>
                         </div>
                      </td>
                      <td className="px-10 py-6">
                         <p className="text-xs font-bold text-slate-800 mb-1">{applicant.field}</p>
                         <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">{applicant.qualification}</p>
                      </td>
                      <td className="px-10 py-6">
                         <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                [ApplicantStatus.PROFESSIONAL, ApplicantStatus.CERTIFIED_TECH].includes(applicant.status) ? "bg-green-500" : 
                                [ApplicantStatus.GRADUATE, ApplicantStatus.QUALIFIED_TECH].includes(applicant.status) ? "bg-slate-400" : "bg-blue-500"
                              )} />
                              <span className={cn(
                                "text-[10px] font-bold uppercase tracking-wider",
                                [ApplicantStatus.PROFESSIONAL, ApplicantStatus.CERTIFIED_TECH].includes(applicant.status) ? "text-green-600" : 
                                [ApplicantStatus.GRADUATE, ApplicantStatus.QUALIFIED_TECH].includes(applicant.status) ? "text-slate-500" : "text-blue-600"
                              )}>
                                {applicant.status}
                              </span>
                            </div>
                            {applicant.status === ApplicantStatus.CERTIFICATE_READY && (
                               <div className={cn(
                                 "text-[8px] font-black uppercase px-2 py-0.5 rounded flex items-center gap-1 w-fit",
                                 applicant.feesPaid?.certification ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                               )}>
                                 {applicant.feesPaid?.certification ? (
                                   <><CheckCircle size={8} /> Fee RM350 Verified</>
                                 ) : (
                                   <><AlertCircle size={8} /> Payment Pending</>
                                 )}
                               </div>
                            )}
                            {applicant.status === ApplicantStatus.PROFESSIONAL || applicant.status === ApplicantStatus.CERTIFIED_TECH ? (
                               applicant.cpdRecords?.reduce((acc, r) => acc + (r.status === 'Approved' ? r.hours : 0), 0) >= 30 && (
                                  <div className={cn(
                                    "text-[8px] font-black uppercase px-2 py-0.5 rounded flex items-center gap-1 w-fit mt-1",
                                    applicant.feesPaid?.renewal ? "bg-indigo-100 text-indigo-700" : "bg-orange-100 text-orange-700"
                                  )}>
                                    {applicant.feesPaid?.renewal ? (
                                      <><CheckCircle size={8} /> Renewal Fee Paid</>
                                    ) : (
                                      <><AlertCircle size={8} /> Renewal Fee Owed</>
                                    )}
                                  </div>
                               )
                            ) : null}
                         </div>
                      </td>
                      <td className="px-10 py-6 text-right">
                         <div className="flex justify-end gap-2 transition-all">
                            <button 
                              onClick={() => setViewingLogs(applicant)}
                              className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-900 shadow-sm border border-slate-100 transition-all bg-white" 
                              title="View Workflow Audit Log"
                            >
                               <History size={14} />
                            </button>
                            <button 
                              onClick={() => setEditingApplicant({...applicant})}
                              className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:bg-blue-50 hover:text-blue-600 shadow-sm border border-slate-100 transition-all bg-white" 
                              title="Modify Registry Record"
                            >
                               <FileEdit size={14} />
                            </button>
                            <button 
                              onClick={() => {
                                if (applicant.status === ApplicantStatus.CERTIFICATE_READY) {
                                  if (!applicant.feesPaid?.certification) {
                                    notify("REJECTED: Certification fee RM350 must be settled before issuance.");
                                    return;
                                  }
                                  if(window.confirm(`REGULATORY OVERRIDE: Deploy final Professional Technologist certification for ${applicant.fullName}?`)) {
                                    handleStatusChange(applicant.id, ApplicantStatus.PROFESSIONAL);
                                  }
                                } else if (applicant.status === ApplicantStatus.QUALIFIED_TECH || applicant.status === ApplicantStatus.GRADUATE) {
                                   if(window.confirm(`WORKFLOW ESCALATION: Move ${applicant.fullName} to Assessment Pending state?`)) {
                                      handleStatusChange(applicant.id, ApplicantStatus.PROFESSIONAL_PENDING);
                                   }
                                } else {
                                  notify("WORKFLOW BLOCK: Compliance criteria not met for automatic status escalation.");
                                }
                              }}
                              className={cn(
                                "w-9 h-9 rounded-lg flex items-center justify-center shadow-sm border transition-all",
                                applicant.status === ApplicantStatus.CERTIFICATE_READY ? "bg-green-600 text-white border-green-600 hover:bg-green-700" : "bg-white border-slate-100 text-slate-400 hover:text-green-600 hover:bg-green-50"
                              )}
                              title="Escalate/Approve Status"
                            >
                               <ShieldCheck size={14} />
                            </button>
                            <button 
                              onClick={() => deleteApplicant(applicant.id)}
                              className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 shadow-sm border border-slate-100 transition-all bg-white" 
                              title="Purge Registry Record"
                            >
                               <Trash2 size={14} />
                            </button>
                         </div>
                      </td>
                   </tr>
                 ))}
              </tbody>
           </table>
           
           {filtered.length === 0 && (
             <div className="p-24 text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                  <Search size={40} />
                </div>
                <p className="text-slate-400 font-black font-display uppercase tracking-[0.2em] text-xs">No registry records matched the search criteria.</p>
             </div>
           )}
        </div>
      </div>

      {editingApplicant && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
              <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                 <div>
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight font-display italic">Registry Data Terminal</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Profile Synchronization Interface</p>
                 </div>
                 <button 
                   onClick={() => setEditingApplicant(null)}
                   className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-900 shadow-sm border border-slate-100 transition-all hover:rotate-90"
                 >
                    <X size={20} />
                 </button>
              </div>

              <form onSubmit={updateApplicantInfo} className="p-10 space-y-8">
                 <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Full Identity Name</label>
                       <input 
                         required
                         type="text" 
                         value={editingApplicant.fullName}
                         onChange={e => setEditingApplicant({...editingApplicant, fullName: e.target.value})}
                         className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none text-sm transition-all font-bold"
                       />
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Official Email</label>
                       <input 
                         required
                         type="email" 
                         value={editingApplicant.email}
                         onChange={e => setEditingApplicant({...editingApplicant, email: e.target.value})}
                         className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none text-sm transition-all font-bold"
                       />
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Industry Field</label>
                       <select 
                         value={editingApplicant.field}
                         onChange={e => setEditingApplicant({...editingApplicant, field: e.target.value})}
                         className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none text-sm transition-all font-bold appearance-none"
                       >
                          {MBOT_FIELDS.map(f => <option key={f} value={f}>{f}</option>)}
                       </select>
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Regulatory Status</label>
                       <select 
                         value={editingApplicant.status}
                         onChange={e => setEditingApplicant({...editingApplicant, status: e.target.value as ApplicantStatus})}
                         className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none text-sm transition-all font-bold appearance-none"
                       >
                          {Object.values(ApplicantStatus).map(s => <option key={s} value={s}>{s}</option>)}
                       </select>
                    </div>
                 </div>

                 <div className="pt-6">
                    <button type="submit" className="w-full py-6 bg-slate-900 text-white text-[11px] font-black uppercase tracking-[0.3em] rounded-[2rem] hover:bg-slate-800 transition shadow-2xl flex items-center justify-center gap-3 active:scale-95">
                       <Save size={18} /> Commit Registry Changes
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {viewingLogs && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300 flex flex-col max-h-[80vh]">
              <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                 <div>
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight font-display italic">Audit Trail: {viewingLogs.fullName}</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Full Lifecycle Documentation</p>
                 </div>
                 <button 
                   onClick={() => setViewingLogs(null)}
                   className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-900 shadow-sm border border-slate-100 transition-all hover:rotate-90"
                 >
                    <X size={20} />
                 </button>
              </div>

              <div className="p-10 overflow-y-auto space-y-8 flex-1">
                 {(!viewingLogs.workflowLog || viewingLogs.workflowLog.length === 0) ? (
                    <div className="text-center py-20">
                       <Clock size={40} className="mx-auto text-slate-100 mb-4" />
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No audit entries detected for this entity.</p>
                    </div>
                 ) : (
                    <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-slate-100 before:via-slate-100 before:to-transparent">
                       {viewingLogs.workflowLog.map((log, i) => (
                          <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                             <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-100 text-slate-400 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                                <CheckCircle size={14} className={cn(i === 0 ? "text-blue-500" : "text-slate-400")} />
                             </div>
                             <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between space-x-2 mb-1">
                                   <div className="font-bold text-slate-900 text-sm tracking-tight">{log.stage}</div>
                                   <time className="font-mono text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{new Date(log.date).toLocaleDateString()}</time>
                                </div>
                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-3">Operator: {log.actor}</div>
                                <div className="text-[11px] text-slate-500 leading-relaxed font-medium bg-white/50 p-3 rounded-lg border border-slate-100/50 italic">
                                   "{log.comments}"
                                </div>
                             </div>
                          </div>
                       ))}
                    </div>
                 )}
              </div>

              <div className="p-8 border-t border-slate-50 bg-slate-50/50 flex justify-end">
                 <button 
                   onClick={() => setViewingLogs(null)}
                   className="px-8 py-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-800 transition shadow-xl"
                 >
                    Close Terminal
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
