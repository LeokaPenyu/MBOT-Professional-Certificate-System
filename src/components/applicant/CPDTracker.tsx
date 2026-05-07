import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Trash2, Calendar, Clock, Award, BookOpen, AlertCircle, 
  Search, Filter, CheckCircle, X, Download, FileText, TrendingUp, 
  ChevronRight, Star, Zap, Save, Edit2, Upload, MapPin, CreditCard, RefreshCcw
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { getCurrentUser, saveApplicants, getApplicants, addNotification, updateUserProfile } from '../../lib/storage';
import { Applicant, CPDRecord, ApplicantStatus, CPDCategory, CPDStatus } from '../../types';
import { cn } from '../../lib/utils';
import { jsPDF } from 'jspdf';

const REQUIRED_HOURS = 30;

const CATEGORY_COLORS = {
  [CPDCategory.TECHNICAL]: '#3b82f6',
  [CPDCategory.SOFT_SKILLS]: '#8b5cf6',
  [CPDCategory.CERTIFICATION]: '#10b981',
  [CPDCategory.SEMINAR]: '#f59e0b',
  [CPDCategory.WORKSHOP]: '#ec4899',
  [CPDCategory.OTHER]: '#64748b'
};

const BADGES = [
  { id: '10h', name: 'Bronze Learner', icon: <Zap size={14} />, h: 10, color: 'bg-amber-100 text-amber-700' },
  { id: '20h', name: 'Silver Professional', icon: <Star size={14} />, h: 20, color: 'bg-slate-200 text-slate-700' },
  { id: '30h', name: 'Gold Specialist', icon: <Award size={14} />, h: 30, color: 'bg-yellow-100 text-yellow-700' },
  { id: '50h', name: 'Platinum Master', icon: <Zap size={14} className="animate-pulse" />, h: 50, color: 'bg-blue-100 text-blue-700' }
];

export default function CPDTracker() {
  const [user, setUser] = useState<Applicant | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<CPDCategory | 'All'>('All');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  const [formData, setFormData] = useState({
    activityName: '',
    date: new Date().toISOString().split('T')[0],
    hours: '',
    provider: '',
    category: CPDCategory.TECHNICAL,
    location: '',
    certificateUrl: '',
    fileName: '',
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          certificateUrl: reader.result as string,
          fileName: file.name
        });
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  const notify = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const updateUser = (updated: Applicant) => {
    const applicants = getApplicants().map(a => a.id === updated.id ? updated : a);
    saveApplicants(applicants);
    updateUserProfile(updated);
    setUser(updated);
  };

  const handleRenewalPayment = () => {
    if (!user) return;
    setIsProcessingPayment(true);
    
    // Simulate payment gateway
    setTimeout(() => {
      const updatedUser: Applicant = {
        ...user,
        renewalDate: new Date(new Date().getFullYear() + 1, new Date().getMonth(), new Date().getDate()).toISOString(),
        feesPaid: {
          ...user.feesPaid,
          renewal: true
        },
        workflowLog: [...(user.workflowLog || []), {
          stage: 'Professional Renewal',
          date: new Date().toISOString(),
          actor: 'System Finance',
          comments: 'Annual maintenance fee RM 200 settled. Registry standing active for another cycle.'
        }]
      };

      updateUser(updatedUser);
      addNotification(user.id, {
        title: "Renewal Confirmed",
        message: "Your professional registry renewal for RM200 was successful. Due date extended."
      });
      setIsProcessingPayment(false);
      notify("PAYMENT VERIFIED: Registry standing extended.");
    }, 2000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const record: CPDRecord = {
      id: editingId || Math.random().toString(36).substr(2, 9),
      activityName: formData.activityName,
      date: formData.date,
      hours: Number(formData.hours),
      provider: formData.provider,
      category: formData.category,
      location: formData.location,
      certificateUrl: formData.certificateUrl,
      fileName: formData.fileName,
      status: editingId ? (user.cpdRecords.find(r => r.id === editingId)?.status || CPDStatus.PENDING) : CPDStatus.PENDING,
    };

    let updatedRecords;
    if (editingId) {
      updatedRecords = user.cpdRecords.map(r => r.id === editingId ? record : r);
      notify("ARTIFACT UPDATED: Record synchronization complete.");
    } else {
      updatedRecords = [...user.cpdRecords, record];
      notify("ARTIFACT COMMITTED: Data stream integrated into Knowledge Matrix.");
    }

    updateUser({ ...user, cpdRecords: updatedRecords });
    resetForm();
  };

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    if (!user) return;
    setDeletingId(id);
  };

  const confirmDelete = () => {
    if (!user || !deletingId) return;
    const updatedRecords = user.cpdRecords.filter(r => r.id !== deletingId);
    updateUser({ ...user, cpdRecords: updatedRecords });
    notify("RECORD DELETED: CPD artifact removed successfully.");
    setDeletingId(null);
  };

  const resetForm = () => {
    setShowAdd(false);
    setEditingId(null);
    setFormData({
      activityName: '',
      date: new Date().toISOString().split('T')[0],
      hours: '',
      provider: '',
      category: CPDCategory.TECHNICAL,
      location: '',
      certificateUrl: '',
      fileName: '',
    });
  };

  const startEdit = (record: CPDRecord) => {
    setEditingId(record.id);
    setFormData({
      activityName: record.activityName,
      date: record.date,
      hours: record.hours.toString(),
      provider: record.provider,
      category: record.category,
      location: record.location || '',
      certificateUrl: record.certificateUrl || '',
      fileName: record.fileName || '',
    });
    setShowAdd(true);
  };

  const exportPDF = () => {
    if (!user) return;
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('MBOT CPD Compliance Report', 20, 20);
    doc.setFontSize(10);
    doc.text(`Professional: ${user.fullName}`, 20, 30);
    doc.text(`Status: ${user.status}`, 20, 35);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 40);
    
    doc.line(20, 45, 190, 45);
    
    doc.setFontSize(14);
    doc.text('Activity Record', 20, 55);
    
    let y = 65;
    user.cpdRecords.forEach((r, i) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setFontSize(10);
      doc.text(`${i+1}. ${r.activityName} (${r.category})`, 20, y);
      doc.text(`${r.hours} Hrs | ${r.date} | ${r.provider}`, 20, y + 5);
      y += 15;
    });
    
    doc.save(`CPD_Report_${user.fullName.replace(/\s+/g, '_')}.pdf`);
    notify("REPORT GENERATED: Professional compliance artifact exported.");
  };

  // Memoized Data Calcs
  const stats = useMemo(() => {
    if (!user) return { total: 0, byCategory: [], monthly: [] };
    const total = user.cpdRecords.reduce((acc, r) => acc + r.hours, 0);
    
    const catMap = user.cpdRecords.reduce((acc: any, r) => {
      acc[r.category] = (acc[r.category] || 0) + r.hours;
      return acc;
    }, {});

    const byCategory = Object.keys(catMap).map(k => ({
      name: k,
      value: catMap[k],
      color: CATEGORY_COLORS[k as CPDCategory]
    }));

    // Simple monthly calc
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthly = months.map((m, i) => {
      const h = user.cpdRecords
        .filter(r => new Date(r.date).getMonth() === i)
        .reduce((acc, r) => acc + r.hours, 0);
      return { name: m, hours: h };
    });

    return { total, byCategory, monthly };
  }, [user]);

  const filteredRecords = useMemo(() => {
    if (!user) return [];
    return user.cpdRecords
      .filter(r => (filterCategory === 'All' || r.category === filterCategory))
      .filter(r => r.activityName.toLowerCase().includes(searchTerm.toLowerCase()) || r.provider.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [user, filterCategory, searchTerm]);

  if (!user) return <div>Loading Matrix...</div>;

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-8 md:px-12 md:py-12 bg-white">
      {/* Notifications */}
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

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-16">
        <div>
           <div className="flex items-center gap-3 mb-2">
             <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
               <BookOpen size={20} />
             </div>
             <h1 className="text-4xl font-black text-slate-900 font-display tracking-tight leading-none italic uppercase">CPD Matrix</h1>
           </div>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-13">Competency Credits • Professional Audit Trail 2026</p>
        </div>
        
        <div className="flex flex-wrap gap-4 w-full lg:w-auto">
          <button 
            onClick={exportPDF}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-8 py-4 bg-white text-slate-900 border border-slate-200 rounded-3xl font-black text-[10px] uppercase tracking-widest hover:border-slate-400 transition-all active:scale-95 shadow-sm"
          >
            <Download size={16} /> Export Audit Report
          </button>
          <button 
            onClick={() => setShowAdd(true)}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-slate-900 text-white px-10 py-5 rounded-3xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition shadow-2xl active:scale-95"
          >
            <Plus size={18} /> Record New Artifact
          </button>
        </div>
      </div>

      {/* Renewal Readiness Banner */}
      {stats.total >= REQUIRED_HOURS && !user.feesPaid?.renewal && (
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-12 p-8 bg-indigo-600 rounded-[2.5rem] text-white flex flex-col md:flex-row items-center gap-8 shadow-xl shadow-indigo-100 italic"
        >
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
            {isProcessingPayment ? <RefreshCcw size={32} className="animate-spin" /> : <TrendingUp size={32} />}
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-xl font-bold font-display leading-tight">Registry Renewal Eligible</h3>
            <p className="text-indigo-100 text-xs font-medium mt-1">Compliance threshold met ({stats.total}/30). Proceed to settle the Annual Renewal Fee (RM200) to maintain your professional title.</p>
          </div>
          <button 
             disabled={isProcessingPayment}
             onClick={handleRenewalPayment}
             className="px-8 py-4 bg-white text-indigo-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-50 transition shadow-sm active:scale-95 not-italic flex items-center gap-2"
          >
             {isProcessingPayment ? "Processing..." : <><CreditCard size={14} /> Pay RM200 Now</>}
          </button>
        </motion.div>
      )}

      {/* Renewal Success Banner */}
      {user.feesPaid?.renewal && user.renewalDate && (
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-12 p-8 bg-green-600 rounded-[2.5rem] text-white flex flex-col md:flex-row items-center gap-8 shadow-xl shadow-green-100 italic"
        >
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
            <CheckCircle size={32} />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-xl font-bold font-display leading-tight">Registry Status: Active</h3>
            <p className="text-green-50 text-xs font-medium mt-1">Professional standing verified. Your next required renewal cycle is due on <span className="font-black underline">{new Date(user.renewalDate).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</span>.</p>
          </div>
          <div className="px-6 py-3 bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest not-italic">
            Valid until {new Date(user.renewalDate).getFullYear()}
          </div>
        </motion.div>
      )}

      <div className="space-y-12">
        {/* Top Section: Dashboard Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Progress Circle & Main Stats */}
           <div className="bg-slate-50 rounded-[3rem] p-10 border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] -mr-32 -mt-32 group-hover:bg-blue-600/10 transition-all duration-700"></div>
              
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                   <div>
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Audit Score</h3>
                      <p className="text-sm font-black text-slate-900 uppercase italic">Compliance Status</p>
                   </div>
                   <div className={cn(
                     "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm",
                     stats.total >= REQUIRED_HOURS ? "bg-green-500 text-white" : "bg-blue-600 text-white"
                   )}>
                      {stats.total >= REQUIRED_HOURS ? "Compliant" : "In Progress"}
                   </div>
                </div>

                <div className="flex items-center justify-center -my-4">
                   <div className="relative w-48 h-48 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { value: Math.min(stats.total, REQUIRED_HOURS) },
                              { value: Math.max(0, REQUIRED_HOURS - stats.total) }
                            ]}
                            innerRadius={65}
                            outerRadius={85}
                            startAngle={90}
                            endAngle={450}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                          >
                            <Cell fill={stats.total >= REQUIRED_HOURS ? "#10b981" : "#3b82f6"} />
                            <Cell fill="#e2e8f0" />
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                         <span className="text-3xl font-black text-slate-900 font-display italic tracking-tighter">
                            {Math.round((stats.total / REQUIRED_HOURS) * 100)}%
                         </span>
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">{stats.total} / {REQUIRED_HOURS} Hrs</span>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Credits</p>
                      <p className="text-lg font-black text-slate-900 italic">{stats.total} <span className="text-[8px] uppercase tracking-widest not-italic text-slate-400 font-black ml-1">Hrs</span></p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Target</p>
                      <p className="text-lg font-black text-slate-900 italic">{REQUIRED_HOURS} <span className="text-[8px] uppercase tracking-widest not-italic text-slate-400 font-black ml-1">Hrs</span></p>
                  </div>
                </div>
              </div>
           </div>

           {/* Monthly Trend */}
           <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm flex flex-col">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8 text-center">Credit Accumulation Trend</h3>
              <div className="flex-1 w-full min-h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.monthly}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: 900, fill: '#94a3b8' }} />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '10px' }}
                    />
                    <Bar dataKey="hours" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-8 bg-slate-900 text-white p-5 rounded-3xl flex items-center justify-between group cursor-pointer hover:bg-slate-800 transition-all">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-lg">
                      <TrendingUp size={16} className="text-blue-400" />
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest leading-none mb-1">Efficiency</p>
                      <p className="text-xs font-bold uppercase tracking-tight italic leading-none">Velocity +{Math.round((stats.total/12)*10)/10} Hrs/Mo</p>
                    </div>
                 </div>
                 <ChevronRight size={16} className="text-slate-600 group-hover:translate-x-1 transition-transform" />
              </div>
           </div>

        </div>

        {/* Bottom Section: Records Ledger */}
        <div className="space-y-10">
           {/* Gamification Bar */}
           <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-wrap items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl rotate-3">
                   <Award size={28} />
                </div>
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Current Rank</p>
                   <p className="text-xl font-black text-slate-900 italic flex items-center gap-2">
                      Elite Specialist <span className="text-[10px] not-italic px-2 py-0.5 bg-slate-100 text-slate-500 rounded-lg">LVL 4</span>
                   </p>
                </div>
              </div>
              <div className="flex gap-3">
                 {BADGES.map(badge => (
                   <div 
                     key={badge.id}
                     className={cn(
                       "w-12 h-12 rounded-xl flex items-center justify-center transition-all cursor-help relative group",
                       stats.total >= badge.h ? badge.color + " shadow-lg" : "bg-slate-50 text-slate-300 opacity-40 grayscale"
                     )}
                     title={badge.name}
                   >
                      {badge.icon}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-slate-900 text-white text-[8px] font-black rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap transition-all">
                        {badge.name} • {badge.h} Hrs
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
              <div className="xl:col-span-12 space-y-8">
                 {/* Filter & Search Header */}
                 <div className="flex flex-col md:flex-row gap-6 items-center">
                    <div className="relative flex-1 group w-full">
                       <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-blue-500 transition-colors" />
                       <input 
                         type="text" 
                         value={searchTerm}
                         onChange={e => setSearchTerm(e.target.value)}
                         placeholder="Search professional artifacts..." 
                         className="w-full pl-16 pr-8 py-5 bg-slate-50 border-none rounded-[2rem] focus:ring-2 focus:ring-blue-500/20 outline-none text-sm transition-all font-bold placeholder:text-slate-300 shadow-sm"
                       />
                    </div>
                    <div className="flex gap-4 w-full md:w-auto">
                       <div className="relative w-full md:w-auto">
                          <Filter size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                          <select 
                            value={filterCategory}
                            onChange={e => setFilterCategory(e.target.value as any)}
                            className="w-full md:w-auto pl-14 pr-10 py-5 bg-white border border-slate-200 rounded-[2rem] focus:ring-2 focus:ring-blue-500/20 outline-none text-[10px] font-black uppercase tracking-widest transition-all appearance-none shadow-sm cursor-pointer"
                          >
                             <option value="All">All Categories</option>
                             {Object.values(CPDCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                          </select>
                       </div>
                    </div>
                 </div>

                 {/* Records Display */}
                 <div className="space-y-6">
                    {filteredRecords.length === 0 ? (
                      <div className="bg-white rounded-[3rem] p-24 text-center border border-slate-100 shadow-sm flex flex-col items-center animate-in fade-in zoom-in duration-700">
                         <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-200 mb-8 border border-slate-51">
                           <BookOpen size={48} />
                         </div>
                         <h3 className="text-2xl font-black text-slate-900 font-display italic tracking-tight">Ledger Empty</h3>
                         <p className="text-slate-400 text-xs mt-4 max-w-sm uppercase tracking-[0.2em] font-black leading-relaxed">No artifacts found matching your current filter criteria in the secure Knowledge Matrix.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
                         <AnimatePresence mode="popLayout">
                          {filteredRecords.map((record, index) => (
                            <motion.div 
                              key={record.id}
                              layout
                              initial={{ y: 20, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              exit={{ scale: 0.8, opacity: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all group flex flex-col items-center justify-center gap-6 relative overflow-hidden"
                            >
                               <div className="absolute top-0 left-0 bottom-0 w-1 bg-slate-100 group-hover:bg-blue-600 transition-colors"></div>
                               
                               <div className="flex items-center gap-6 w-full">
                                 <div className="w-16 h-16 bg-slate-50 rounded-2xl flex flex-col items-center justify-center shrink-0 border border-slate-50 group-hover:bg-blue-50 transition-colors">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{new Date(record.date).toLocaleString('default', { month: 'short' })}</span>
                                    <span className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">{new Date(record.date).getDate()}</span>
                                 </div>

                                 <div className="flex-1 text-left min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                       <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-lg text-[8px] font-black uppercase tracking-widest border border-slate-200 group-hover:bg-white group-hover:border-slate-300 transition-all truncate">
                                          {record.category}
                                       </span>
                                    </div>
                                    <h4 className="text-lg font-bold text-slate-900 font-display italic group-hover:text-blue-600 transition-colors truncate">{record.activityName}</h4>
                                 </div>
                               </div>

                               <div className="w-full h-px bg-slate-50"></div>

                               <div className="flex items-center justify-between w-full">
                                  <div className="flex flex-col gap-1">
                                     <div className="flex items-center gap-2 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                        <MapPin size={10} className="text-blue-500" />
                                        <span className="truncate max-w-[120px]">{record.provider}</span>
                                     </div>
                                     <div className="flex items-center gap-2 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                        <Clock size={10} className="text-indigo-500" />
                                        {record.hours.toFixed(1)} Credits
                                     </div>
                                  </div>

                                  <div className="flex items-center gap-2 relative z-20">
                                     <span className={cn(
                                       "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border flex items-center gap-1 mr-2",
                                       record.status === CPDStatus.APPROVED ? "bg-green-50 text-green-600 border-green-100" : "bg-amber-50 text-amber-600 border-amber-100"
                                     )}>
                                        {record.status === CPDStatus.APPROVED ? <CheckCircle size={8} /> : <Clock size={8} />}
                                        {record.status}
                                     </span>
                                     <button 
                                      disabled={record.status === CPDStatus.APPROVED}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        startEdit(record);
                                      }}
                                      className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90",
                                        record.status === CPDStatus.APPROVED 
                                          ? "bg-slate-50 text-slate-200 cursor-not-allowed" 
                                          : "bg-slate-50 text-slate-300 hover:bg-blue-600 hover:text-white"
                                      )}
                                      title={record.status === CPDStatus.APPROVED ? "Approved artifacts are immutable" : "Modify Artifact"}
                                     >
                                        <Edit2 size={14} />
                                     </button>
                                     <button 
                                      disabled={record.status === CPDStatus.APPROVED}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(record.id);
                                      }}
                                      className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90",
                                        record.status === CPDStatus.APPROVED 
                                          ? "bg-slate-50 text-slate-200 cursor-not-allowed" 
                                          : "bg-slate-50 text-slate-300 hover:bg-red-500 hover:text-white"
                                      )}
                                      title={record.status === CPDStatus.APPROVED ? "Approved artifacts are immutable" : "Delete Record"}
                                     >
                                        <Trash2 size={14} />
                                     </button>
                                  </div>
                               </div>
                            </motion.div>
                          ))}
                         </AnimatePresence>
                      </div>
                    )}
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Verification Deadline Alert */}
      {stats.total < REQUIRED_HOURS && (
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-8 right-8 z-40 max-w-sm w-full"
        >
          <div className="bg-slate-900 text-white rounded-[2rem] p-6 shadow-2xl border border-slate-800 flex items-start gap-5 relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-3xl -mr-16 -mt-16 animate-pulse"></div>
             <div className="w-12 h-12 bg-red-600 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-red-600/20">
                <Clock size={24} />
             </div>
             <div>
                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Compliance Lockdown</p>
                <p className="text-xs font-medium text-slate-400 leading-relaxed">
                   <span className="text-white font-bold">15 Days Left</span> to fulfill your {REQUIRED_HOURS} hour requirement. Failure to comply may affect professional standing.
                </p>
             </div>
          </div>
        </motion.div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingId && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[120] flex items-center justify-center p-4">
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               className="bg-white max-w-sm w-full rounded-[2.5rem] p-10 text-center shadow-2xl"
             >
                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                   <Trash2 size={40} />
                </div>
                <h3 className="text-xl font-black text-slate-900 font-display italic leading-tight">Delete Record?</h3>
                <p className="text-xs text-slate-400 font-black uppercase tracking-widest mt-4 leading-relaxed">
                   This action will permanently remove the record from your professional compliance ledger.
                </p>
                <div className="mt-10 flex gap-4">
                   <button 
                     onClick={() => setDeletingId(null)}
                     className="flex-1 py-4 bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-100 transition"
                   >
                      Cancel
                   </button>
                   <button 
                     onClick={confirmDelete}
                     className="flex-1 py-4 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-red-600 transition shadow-lg shadow-red-200"
                   >
                      Confirm Delete
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[110] flex items-center justify-center p-4">
             <motion.div 
               initial={{ scale: 0.9, opacity: 0, y: 20 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ scale: 0.9, opacity: 0, y: 20 }}
               className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden"
             >
                <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                   <div>
                      <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight font-display italic">{editingId ? "Modify Artifact" : "Record New Artifact"}</h2>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Professional Development Entry Terminal</p>
                   </div>
                   <button 
                     onClick={resetForm}
                     className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 shadow-sm border border-slate-100 transition-all hover:rotate-90"
                   >
                      <X size={18} />
                   </button>
                </div>

                <form onSubmit={handleSave} className="p-8 space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Activity Designation</label>
                      <input 
                        required
                        type="text" 
                        value={formData.activityName}
                        onChange={e => setFormData({...formData, activityName: e.target.value})}
                        className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-sm transition-all font-bold placeholder:text-slate-300"
                        placeholder="e.g. Industry 4.0 Transformation Summit"
                      />
                   </div>

                   <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Category Classification</label>
                         <select 
                           value={formData.category}
                           onChange={e => setFormData({...formData, category: e.target.value as CPDCategory})}
                           className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-sm transition-all font-bold appearance-none cursor-pointer"
                         >
                            {Object.values(CPDCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                         </select>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Credit Volume (Hrs)</label>
                         <input 
                           required
                           type="number" 
                           step="0.5"
                           min="0.5"
                           value={formData.hours}
                           onChange={e => setFormData({...formData, hours: e.target.value})}
                           className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-sm transition-all font-black"
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Endorsement Date</label>
                         <input 
                           required
                           type="date" 
                           value={formData.date}
                           onChange={e => setFormData({...formData, date: e.target.value})}
                           className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-sm transition-all font-bold uppercase"
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Proof of Attendance (Document)</label>
                         <div className="relative group/upload">
                            <label className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-400 flex items-center justify-between group-hover/upload:bg-slate-100 transition-colors cursor-pointer">
                               <span className={cn("truncate max-w-[200px] transition-all", formData.fileName && "font-black text-slate-900")}>
                                 {formData.fileName || "Upload Document..."}
                               </span>
                               {formData.fileName ? (
                                 <button 
                                   type="button"
                                   onClick={(e) => {
                                     e.preventDefault();
                                     e.stopPropagation();
                                     setFormData({...formData, certificateUrl: '', fileName: ''});
                                   }}
                                   className="w-10 h-10 -mr-3 flex items-center justify-center text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                                 >
                                   <X size={16} />
                                 </button>
                               ) : (
                                 <Upload size={14} />
                               )}
                               <input 
                                 type="file" 
                                 className="hidden" 
                                 accept=".pdf,image/*" 
                                 onChange={handleFileUpload}
                               />
                            </label>
                         </div>
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Provider Agency & Venue</label>
                      <div className="relative">
                         <MapPin size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                         <input 
                           required
                           type="text" 
                           value={formData.provider}
                           onChange={e => setFormData({...formData, provider: e.target.value})}
                           className="w-full pl-14 pr-5 py-3.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-sm transition-all font-bold placeholder:text-slate-300"
                           placeholder="e.g. MBOT HQ • Kuala Lumpur"
                         />
                      </div>
                   </div>

                   <div className="pt-4 flex gap-4">
                      <button 
                        type="button" 
                        onClick={resetForm}
                        className="flex-1 py-4 bg-slate-100 text-slate-500 text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-slate-200 transition active:scale-95"
                      >
                         Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="flex-[2] py-4 bg-slate-900 text-white text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-slate-800 transition shadow-2xl flex items-center justify-center gap-3 active:scale-95"
                      >
                         <Save size={16} /> {editingId ? "Update Artifact" : "Commit to Vault"}
                      </button>
                   </div>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
