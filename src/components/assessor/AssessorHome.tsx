import React, { useState, useEffect } from 'react';
import { 
  Users, CheckCircle, XCircle, Search, Calendar, Clock, 
  User, Award, FileText, ExternalLink, ShieldCheck, RefreshCcw
} from 'lucide-react';
import { getApplicants, saveApplicants } from '../../lib/storage';
import { Applicant, ApplicantStatus } from '../../types';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function AssessorHome() {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initial data load
    const data = getApplicants();
    setApplicants(data);
    setIsLoading(false);
  }, []);

  const notify = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const updateApplicantStatus = (id: string, newStatus: ApplicantStatus, comment: string) => {
    const updated = applicants.map(app => {
      if (app.id === id) {
        const logEntry = {
          stage: `Assessor Evaluation: ${newStatus}`,
          date: new Date().toISOString(),
          actor: 'System Assessor',
          comments: comment
        };
        return { 
          ...app, 
          status: newStatus,
          workflowLog: [...(app.workflowLog || []), logEntry]
        };
      }
      return app;
    });

    setApplicants(updated);
    saveApplicants(updated);
    notify(`EVALUATION RECORDED: ${newStatus}`);
  };

  const filtered = applicants.filter(app => {
    const needsAssessment = [
      ApplicantStatus.UNDER_REVIEW,
      ApplicantStatus.ASSESSMENT_PENDING,
      ApplicantStatus.PROFESSIONAL_PENDING
    ].includes(app.status);
    
    return needsAssessment && (
      app.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.field.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <AnimatePresence>
        {statusMsg && (
          <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-[100]"
          >
             <div className="bg-slate-900 border border-slate-800 text-white px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-4">
                <CheckCircle size={18} className="text-green-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">{statusMsg}</span>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
        <div>
           <h1 className="text-3xl font-bold text-slate-900 font-display uppercase tracking-tight">Assessor Terminal</h1>
           <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">Professional Review • Technical Evaluation Queue</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
           <div className="flex items-center px-6 py-3 bg-slate-900 text-white rounded-xl gap-3">
              <RefreshCcw size={14} className="animate-spin-slow" />
              <span className="text-[10px] font-bold uppercase tracking-wider">{filtered.length} Evaluations Pending</span>
           </div>
        </div>
      </div>

      <div className="relative group">
         <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-blue-600 transition-colors" />
         <input 
           type="text" 
           value={searchTerm}
           onChange={e => setSearchTerm(e.target.value)}
           placeholder="Search evaluations by candidate name or domain..." 
           className="w-full pl-16 pr-8 py-5 bg-white border border-slate-100 rounded-3xl focus:ring-2 focus:ring-blue-500/10 outline-none text-sm transition-all font-bold placeholder:text-slate-300 shadow-sm"
         />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {filtered.map((candidate, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={candidate.id}
            className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden group"
          >
            <div className="p-10">
               <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-6">
                     <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-900 font-black text-2xl italic shadow-inner group-hover:bg-slate-900 group-hover:text-white transition-all duration-500">
                        {candidate.fullName.charAt(0)}
                     </div>
                     <div>
                        <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tight">{candidate.fullName}</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 mb-2">{candidate.field}</p>
                        <div className="flex gap-2">
                           <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-blue-100">
                              {candidate.qualification}
                           </span>
                           <span className="px-3 py-1 bg-slate-50 text-slate-500 rounded-full text-[9px] font-black uppercase tracking-widest border border-slate-100">
                              {candidate.yearsOfExperience} YRS EXP
                           </span>
                        </div>
                     </div>
                  </div>
                  <div className="text-right">
                     <span className={cn(
                        "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border",
                        candidate.status === ApplicantStatus.PROFESSIONAL_PENDING ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-blue-50 text-blue-600 border-blue-100"
                     )}>
                        {candidate.status}
                     </span>
                  </div>
               </div>

               <div className="bg-slate-50 border border-slate-100 rounded-3xl p-8 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Submission Date</p>
                        <p className="text-xs font-bold text-slate-900">{new Date(candidate.registrationDate).toLocaleDateString()}</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Candidate ID</p>
                        <p className="font-mono text-xs font-bold text-slate-900 truncate">#{candidate.id.toUpperCase().slice(0, 8)}</p>
                     </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-slate-200/50">
                    <button className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest hover:translate-x-1 transition-transform">
                       <FileText size={14} /> Review CV / Portfolio <ExternalLink size={12} />
                    </button>
                    <button className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">
                       Full Lifecycle Audit
                    </button>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4 mt-8">
                  <button 
                    onClick={() => updateApplicantStatus(candidate.id, 
                      candidate.status === ApplicantStatus.PROFESSIONAL_PENDING ? ApplicantStatus.CERTIFIED : ApplicantStatus.ASSESSMENT_PASSED, 
                      "Comprehensive technical evaluation completed. Candidate demonstrates required competencies.")}
                    className="py-5 bg-slate-900 text-white rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-800 transition active:scale-95 shadow-xl shadow-slate-200"
                  >
                     <CheckCircle size={18} className="text-green-400" />
                     <span className="text-[10px] font-black uppercase tracking-[0.2em]">Approve Candidate</span>
                  </button>
                  <button 
                    onClick={() => updateApplicantStatus(candidate.id, ApplicantStatus.ASSESSMENT_FAILED, "Evaluation identifying significant competency gaps. Recommend further industry experience.")}
                    className="py-5 bg-white border border-slate-200 text-slate-900 rounded-2xl flex items-center justify-center gap-3 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition active:scale-95"
                  >
                     <XCircle size={18} />
                     <span className="text-[10px] font-black uppercase tracking-[0.2em]">Reject Submission</span>
                  </button>
               </div>
            </div>
          </motion.div>
        ))}

        {filtered.length === 0 && !isLoading && (
          <div className="col-span-full py-32 flex flex-col items-center justify-center text-center">
             <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-100 mb-8">
                <ShieldCheck size={48} />
             </div>
             <h3 className="text-2xl font-black text-slate-900 uppercase italic">Review Queue Empty</h3>
             <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mt-2">All technical assessments are up to date and verified.</p>
          </div>
        )}
      </div>
    </div>
  );
}
