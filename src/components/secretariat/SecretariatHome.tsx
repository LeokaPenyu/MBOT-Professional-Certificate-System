import { useState, useEffect } from 'react';
import { Users, FileText, CheckCircle, Clock, TrendingUp, AlertCircle, BarChart2, Award, X, ShieldAlert, Download, ShieldCheck, Database, RefreshCw, Zap, Trash2 } from 'lucide-react';
import { getApplicants, seedApplicants, saveApplicants, getCurrentUser, updateUserProfile } from '../../lib/storage';
import { Applicant, ApplicantStatus } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { cn } from '../../lib/utils';
import { DUMMY_AUDIT_LOGS, generateDummyApplicants } from '../../lib/dummyData';
import ProfilePhotoUploader from '../common/ProfilePhotoUploader';
import * as XLSX from 'xlsx';

export default function SecretariatHome() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    certified: 0,
    renewalsDue: 0
  });

  const [chartData, setChartData] = useState<any[]>([]);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<string | null>(null);

  const [systemPolicies, setSystemPolicies] = useState([
    { id: 'auto-triage', name: 'Auto-Triage Low Risk Profiles', enabled: true, description: 'Automatically move complete profiles with 5+ years experience to Review stage.' },
    { id: 'enforce-audit', name: 'Mandatory Dual-Assessor Audit', enabled: false, description: 'Require two separate assessors for all Professional Certificates.' },
    { id: 'strict-fees', name: 'Stricter Payment Validation', enabled: true, description: 'Block stage advancement if any prior fee components are flagged as pending.' },
    { id: 'audit-logging', name: 'Enhanced Global Traceability', enabled: true, description: 'Log every field-level change to the permanent audit record.' }
  ]);

  const refreshDashboard = () => {
    const applicants = getApplicants();
    const pending = applicants.filter(a => [
      ApplicantStatus.PROFESSIONAL_PENDING, 
      ApplicantStatus.UNDER_REVIEW, 
      ApplicantStatus.CERTIFICATE_READY
    ].includes(a.status)).length;
    const certified = applicants.filter(a => a.status === ApplicantStatus.PROFESSIONAL || a.status === ApplicantStatus.CERTIFIED).length;
    const readyForApproval = applicants.filter(a => a.status === ApplicantStatus.CERTIFICATE_READY).length;
    const pendingCPD = applicants.reduce((acc, a) => acc + (a.cpdRecords || []).filter(r => r.status === 'Pending Approval').length, 0);
    
    setStats({
      total: applicants.length,
      pending,
      certified,
      renewalsDue: readyForApproval // Using this slot for "Awaiting Final Approval"
    });

    const statusCounts = applicants.reduce((acc: any, a) => {
      acc[a.status] = (acc[a.status] || 0) + 1;
      return acc;
    }, {});

    setChartData(Object.entries(statusCounts).map(([name, value]) => ({ name, value })));
  };

  const handleSeedData = () => {
    seedApplicants(20);
    refreshDashboard();
    alert("Alert: 20 records added.");
  };

  const handleSystemReset = () => {
    if (confirm("CRITICAL ACTION: This will purge ALL registry data and re-initialize with factory defaults. Proceed?")) {
      const resetData = generateDummyApplicants();
      saveApplicants(resetData);
      refreshDashboard();
      alert("Success: Data reset.");
    }
  };

  const handlePurgeCPD = () => {
    const applicants = getApplicants();
    let count = 0;
    const updated = applicants.map(app => {
      const filteredRecords = (app.cpdRecords || []).filter(rec => {
        if (rec.status === 'Pending Approval' && count < 5) {
          count++;
          return false;
        }
        return true;
      });
      return { ...app, cpdRecords: filteredRecords };
    });
    
    saveApplicants(updated);
    refreshDashboard();
    alert(`Cleaned: ${count} records removed.`);
  };

  const handleExportAudit = () => {
    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(DUMMY_AUDIT_LOGS.map(log => ({
      'ID': log.id,
      'Operation': log.action,
      'Department': log.department,
      'Specialist User': log.user,
      'Timestamp': log.time,
      'System Status': log.status
    })));

    // Set column widths for "neatness"
    worksheet['!cols'] = [
      { wch: 10 }, // ID
      { wch: 30 }, // Operation
      { wch: 20 }, // Department
      { wch: 25 }, // Specialist User
      { wch: 15 }, // Timestamp
      { wch: 12 }  // System Status
    ];

    // Create workbook and append sheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Audit Logs");

    // Generate XLSX file and trigger download
    XLSX.writeFile(workbook, `MBOT_Audit_Matrix_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleRunOptimizer = () => {
    setIsOptimizing(true);
    setOptimizationResult(null);
    
    setTimeout(() => {
      const applicants = getApplicants();
      let optimizedCount = 0;
      
      const updated = applicants.map(app => {
        // Find "Registered" applicants that have been sitting (simulation: 50% chance)
        if (app.status === ApplicantStatus.REGISTERED && Math.random() > 0.5) {
          optimizedCount++;
          return { 
            ...app, 
            status: ApplicantStatus.UNDER_REVIEW,
            workflowLog: [...(app.workflowLog || []), {
              stage: 'Queue Optimization Pulse',
              date: new Date().toISOString(),
              actor: 'AI Core Optimizer',
              comments: 'Automated bottleneck resolution: Escalated to Secretariat Review queue.'
            }]
          };
        }
        return app;
      });
      
      saveApplicants(updated);
      refreshDashboard();
      setIsOptimizing(false);
      setOptimizationResult(`Done: ${optimizedCount} records updated.`);
      setTimeout(() => setOptimizationResult(null), 5000);
    }, 2000);
  };

  const togglePolicy = (id: string) => {
    setSystemPolicies(prev => prev.map(p => 
      p.id === id ? { ...p, enabled: !p.enabled } : p
    ));
  };

  const handlePfpUpdate = (dataUrl: string) => {
    if (!user) return;
    const updatedUser = { ...user, profilePicture: dataUrl };
    updateUserProfile(updatedUser);
    setUser(updatedUser);
  };

  useEffect(() => {
    refreshDashboard();
    setUser(getCurrentUser());
  }, []);

  const colors = ['#3b82f6', '#4f46e5', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPIButton 
          icon={<Users size={20} />} 
          label="Total Applicants" 
          value={stats.total} 
          trend="+5% this month"
          color="bg-brand-primary/10 text-brand-primary"
        />
        <KPIButton 
          icon={<Clock size={20} />} 
          label="Pending Assessments" 
          value={stats.pending} 
          trend="Action required"
          color="bg-amber-100 text-amber-600"
        />
        <KPIButton 
          icon={<CheckCircle size={20} />} 
          label="Certificates Issued" 
          value={stats.certified} 
          trend="+12 this week"
          color="bg-emerald-100 text-emerald-600"
        />
        <KPIButton 
          icon={<ShieldCheck size={20} />} 
          label="Approval Required" 
          value={stats.renewalsDue} 
          trend="Certification Audit"
          color="bg-brand-primary text-white shadow-lg shadow-brand-primary/20"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
         {/* Chart Section */}
         <div className="lg:col-span-8 bg-white rounded-2xl p-8 border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[400px]">
            <div className="flex justify-between items-center mb-8">
               <h3 className="font-bold text-lg text-slate-800 font-display">Registration Volume</h3>
               <div className="flex gap-2">
                 <div className="w-3 h-3 bg-blue-600 rounded-full opacity-80"></div>
                 <div className="w-3 h-3 bg-slate-100 rounded-full"></div>
               </div>
            </div>
            <div className="flex-1 min-h-0">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                     <XAxis 
                       dataKey="name" 
                       axisLine={false} 
                       tickLine={false} 
                       tick={{fill: '#64748b', fontSize: 10}}
                       interval={0}
                     />
                     <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                     <Tooltip 
                       contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                       cursor={{ fill: '#f8fafc' }}
                     />
                     <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        ))}
                     </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Mini Audit Log Section */}
         <div className="lg:col-span-4 bg-white rounded-2xl p-8 border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[400px]">
            <h3 className="font-bold text-lg text-slate-800 mb-6 font-display">Activity</h3>
            <div className="space-y-6 overflow-y-auto flex-1 pr-2 custom-scrollbar">
               {DUMMY_AUDIT_LOGS.slice(0, 5).map(log => (
                 <ActivityItem 
                   key={log.id}
                   icon={log.action.includes('Registration') ? <Users className="text-blue-500" /> : <Award className="text-indigo-500" />} 
                   title={log.action} 
                   time={log.time} 
                   detail={`${log.user} (${log.department})`} 
                 />
               ))}
            </div>
            <button 
              onClick={() => setShowAuditModal(true)}
              className="w-full mt-8 py-3 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-xl transition border border-dashed border-blue-200"
            >
               View History
            </button>
         </div>
      </div>

      {/* Control Center Tools */}
      <div className="bg-brand-secondary rounded-3xl p-10 text-white overflow-hidden relative shadow-xl">
         <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl -mr-32 -mt-32"></div>
         <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="space-y-4">
               <h4 className="text-xs font-bold uppercase tracking-wider text-white/60">Policy Management</h4>
               <p className="text-lg font-bold font-display leading-snug text-white">Update operating procedures and Act 768 guidelines.</p>
               <button 
                 onClick={() => setShowPolicyModal(true)}
                 className="flex items-center gap-2 text-sm font-medium text-white/60 hover:text-white transition"
               >
                  Access Terminal <ChevronRight size={16} />
               </button>
            </div>
            <div className="space-y-4">
               <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-300">Queue Optimizer</h4>
               <p className="text-lg font-bold font-display leading-snug text-white">Average time: 4.2 days. Optimize verification paths.</p>
               <button 
                 disabled={isOptimizing}
                 onClick={handleRunOptimizer}
                 className={cn(
                    "flex items-center gap-2 text-sm font-medium transition",
                    isOptimizing ? "text-emerald-300 animate-pulse" : "text-white/60 hover:text-white"
                 )}
               >
                  {isOptimizing ? 'Optimizing AI Engines...' : 'Run Analytics'} <ChevronRight size={16} />
               </button>
               {optimizationResult && (
                 <p className="text-[9px] font-black text-emerald-300 uppercase tracking-widest animate-in slide-in-from-left-2">{optimizationResult}</p>
               )}
            </div>
            <div className="space-y-4">
               <h4 className="text-xs font-bold uppercase tracking-wider text-sky-200">Reporting Engine</h4>
               <p className="text-lg font-bold font-display leading-snug text-white">Generate performance audits for the board review.</p>
               <button className="flex items-center gap-2 text-sm font-medium text-white/60 hover:text-white transition" onClick={() => window.location.href = '/admin/reports'}>
                  Access Intelligence Dashboard <ChevronRight size={16} />
               </button>
            </div>
         </div>
      </div>

      {/* Audit Modal */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[80vh]">
            <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-2xl font-black text-slate-900 font-display uppercase tracking-tight flex items-center gap-3">
                  <ShieldAlert className="text-blue-600" size={28} />
                  History Logs
                </h2>
                <p className="text-slate-500 text-xs mt-1 uppercase tracking-widest font-bold">See all changes</p>
              </div>
              <button 
                onClick={() => setShowAuditModal(false)}
                className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-900 shadow-sm border border-slate-100 transition-all hover:rotate-90"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-10 space-y-4 custom-scrollbar">
               <div className="grid grid-cols-12 gap-4 text-[10px] uppercase font-black text-slate-400 tracking-[0.2em] px-6 mb-2">
                  <div className="col-span-4">Operation</div>
                  <div className="col-span-3">Entity</div>
                  <div className="col-span-2">Time</div>
                  <div className="col-span-3 text-right">Status</div>
               </div>
               {DUMMY_AUDIT_LOGS.map(log => (
                 <div key={log.id} className="grid grid-cols-12 gap-4 p-6 bg-white border border-slate-100 rounded-[2rem] items-center hover:shadow-lg hover:shadow-slate-100 transition-all group">
                    <div className="col-span-4">
                       <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{log.action}</p>
                       <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{log.department}</p>
                    </div>
                    <div className="col-span-3">
                       <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-black">{log.user.charAt(0)}</div>
                          <p className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">{log.user}</p>
                       </div>
                    </div>
                    <div className="col-span-2">
                       <p className="text-[10px] font-bold text-slate-400">{log.time}</p>
                    </div>
                    <div className="col-span-3 text-right">
                       <span className={cn(
                         "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest",
                         log.status === 'Success' ? "bg-green-100 text-green-600" :
                         log.status === 'Warning' ? "bg-orange-100 text-orange-600" :
                         "bg-red-100 text-red-600"
                       )}>
                         {log.status}
                       </span>
                    </div>
                 </div>
               ))}
            </div>

            <div className="p-8 border-t border-slate-50 bg-slate-50/50 flex justify-end">
               <button 
                 onClick={handleExportAudit}
                 className="flex items-center gap-2 px-8 py-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-800 transition shadow-xl shadow-slate-900/10"
               >
                 <Download size={14} /> Export Audit Dataset
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Policy Modal */}
      {showPolicyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
              <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                 <div>
                    <h2 className="text-lg font-black text-slate-900 font-display uppercase tracking-tight flex items-center gap-3">
                       <ShieldAlert className="text-blue-600" size={20} />
                       Settings
                    </h2>
                    <p className="text-slate-400 text-[9px] mt-0.5 uppercase tracking-widest font-bold">Change Rules</p>
                 </div>
                 <button 
                   onClick={() => setShowPolicyModal(false)}
                   className="w-9 h-9 bg-white rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-900 shadow-sm border border-slate-100 transition-all hover:rotate-90"
                 >
                    <X size={16} />
                 </button>
              </div>

              <div className="p-6 space-y-2.5">
                 {systemPolicies.map((policy) => (
                    <div key={policy.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white transition-all group">
                       <div className="max-w-[75%]">
                          <h4 className="text-[10px] font-bold text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{policy.name}</h4>
                          <p className="text-[8px] text-slate-400 font-medium italic mt-0.5 leading-tight">{policy.description}</p>
                       </div>
                       <button 
                         onClick={() => togglePolicy(policy.id)}
                         className={cn(
                           "relative inline-flex h-4.5 w-9 items-center rounded-full transition-colors outline-none",
                           policy.enabled ? "bg-blue-600" : "bg-slate-200"
                         )}
                       >
                          <span 
                            className={cn(
                              "inline-block h-3 w-3 transform rounded-full bg-white transition-transform",
                              policy.enabled ? "translate-x-5" : "translate-x-1"
                            )}
                          />
                       </button>
                    </div>
                 ))}

                 <div className="bg-blue-50/50 p-3.5 rounded-xl border border-blue-100/50 mt-1">
                    <div className="flex gap-2">
                       <AlertCircle className="text-blue-600 shrink-0" size={12} />
                       <p className="text-[8px] text-blue-600 font-bold uppercase tracking-wider leading-relaxed">
                          NOTICE: Changes are applied globally to all active workstreams.
                       </p>
                    </div>
                 </div>
              </div>

              <div className="p-5 border-t border-slate-50 bg-slate-50/50 flex justify-end gap-3">
                 <button 
                   onClick={() => setShowPolicyModal(false)}
                   className="px-5 py-2.5 bg-slate-900 text-white text-[8px] font-black uppercase tracking-[0.2em] rounded-lg hover:bg-slate-800 transition shadow-xl"
                 >
                    Apply Configurations
                 </button>
              </div>
           </div>
        </div>
      )}
      
    </div>
  );
}

function KPIButton({ icon, label, value, trend, color }: any) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all group cursor-default">
       <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-6 transition-transform group-hover:scale-105 shadow-sm", color)}>
          {icon}
       </div>
       <div>
         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{label}</p>
         <div className="flex items-baseline gap-2">
           <p className="text-3xl font-display font-bold text-slate-900">{value}</p>
           <span className="text-[10px] font-bold text-green-500 bg-green-50 px-2 py-0.5 rounded-full tracking-wide">{(trend || '').split(' ')[0]}</span>
         </div>
       </div>
    </div>
  );
}

function ActivityItem({ icon, title, time, detail }: any) {
  return (
    <div className="flex gap-4 group py-1">
       <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
          {icon}
       </div>
       <div className="space-y-1 flex-1 min-w-0">
          <div className="flex items-center justify-between gap-4">
             <p className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">{title}</p>
             <span className="text-[10px] text-slate-400 font-medium shrink-0">{time}</span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium truncate">{detail}</p>
       </div>
    </div>
  );
}

const ChevronRight = ({ size, className }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m9 18 6-6-6-6"/>
  </svg>
);
