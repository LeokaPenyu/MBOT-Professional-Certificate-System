import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Trash2, Calendar, Clock, Award, BookOpen, AlertCircle, 
  Search, Filter, CheckCircle, X, Download, FileText, TrendingUp, 
  ChevronRight, Star, Zap, Save, Edit2, Upload, MapPin, CreditCard, RefreshCcw,
  Edit, ExternalLink
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { getCurrentUser, saveApplicants, getApplicants, addNotification, updateUserProfile } from '../../lib/storage';
import { Applicant, CPDRecord, ApplicantStatus, CPDCategory, CPDStatus } from '../../types';
import { cn } from '../../lib/utils';
import { jsPDF } from 'jspdf';

const REQUIRED_HOURS = 30;

const CATEGORY_COLORS = {
  [CPDCategory.TECHNICAL]: '#0284c7',
  [CPDCategory.SOFT_SKILLS]: '#8b5cf6',
  [CPDCategory.CERTIFICATION]: '#10b981',
  [CPDCategory.SEMINAR]: '#f59e0b',
  [CPDCategory.WORKSHOP]: '#ec4899',
  [CPDCategory.OTHER]: '#64748b'
};

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

    const handleGlobalSearch = (e: any) => {
      setSearchTerm(e.detail);
    };

    window.addEventListener('mbot-global-search', handleGlobalSearch);
    return () => window.removeEventListener('mbot-global-search', handleGlobalSearch);
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

  const [viewingRecord, setViewingRecord] = useState<CPDRecord | null>(null);
  
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
      notify("Record updated successfully");
    } else {
      updatedRecords = [...user.cpdRecords, record];
      notify("New record added successfully");
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
    notify("Record deleted successfully");
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

  const openInNewTab = (url: string) => {
    if (!url) return;
    if (url.startsWith('data:')) {
      try {
        const parts = url.split(',');
        const contentType = parts[0].split(':')[1].split(';')[0];
        const byteCharacters = atob(parts[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: contentType });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
      } catch (e) {
        console.error('Error opening data URL', e);
        window.open(url, '_blank');
      }
    } else {
      window.open(url, '_blank');
    }
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
    notify("Performance report exported successfully");
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

  if (!user) return <div className="min-h-screen bg-bg-main flex items-center justify-center text-text-muted font-bold uppercase tracking-widest animate-pulse">Loading Tracker...</div>;

  return (
    <div className="min-h-screen bg-bg-main px-6 py-8 md:px-12 md:py-12">
      <div className="max-w-7xl mx-auto">
        {/* Notifications */}
        <AnimatePresence>
          {statusMsg && (
            <motion.div 
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              className="fixed top-8 left-1/2 -translate-x-1/2 z-[100]"
            >
               <div className="bg-white border border-gray-100 text-slate-900 px-8 py-4 rounded-[12px] shadow-xl flex items-center gap-4">
                  <div className="w-6 h-6 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
                    <CheckCircle size={16} />
                  </div>
                  <span className="text-sm font-medium tracking-tight font-sans">{statusMsg}</span>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-12">
          <div>
             <div className="flex items-center gap-4 mb-2">
               <div className="w-12 h-12 bg-slate-900 rounded-[12px] flex items-center justify-center text-white shadow-sm">
                 <Zap size={24} />
               </div>
               <div>
                  <h1 className="text-3xl font-bold text-slate-900 tracking-tight leading-none">CPD Tracker</h1>
                  <p className="text-slate-500 text-sm mt-2">Manage and monitor your professional development activities.</p>
               </div>
             </div>
          </div>
          
          <div className="flex flex-wrap gap-4 w-full lg:w-auto">
            <button 
              onClick={exportPDF}
              className="flex-1 lg:flex-none py-2.5 px-6 bg-white text-slate-700 border border-gray-200 rounded-[12px] text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 transition shadow-sm flex items-center justify-center gap-2"
            >
              <Download size={16} /> Export report
            </button>
            <button 
              onClick={() => setShowAdd(true)}
              className="flex-1 lg:flex-none py-2.5 px-6 bg-slate-900 text-white rounded-[12px] text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition shadow-sm flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Add activity
            </button>
          </div>
        </div>

        {/* Renewal Readiness Banner */}
        {stats.total >= REQUIRED_HOURS && !user.feesPaid?.renewal && (
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mb-12 p-8 bg-white border border-gray-100 rounded-[12px] text-slate-900 flex flex-col md:flex-row items-center gap-8 shadow-sm relative overflow-hidden"
          >
            <div className="w-16 h-16 bg-brand-primary/5 border border-brand-primary/10 rounded-[12px] flex items-center justify-center text-brand-primary shadow-sm">
              {isProcessingPayment ? <RefreshCcw size={32} className="animate-spin" /> : <TrendingUp size={32} />}
            </div>
            <div className="flex-1 text-center md:text-left relative z-10">
              <h3 className="text-xl font-bold tracking-tight">Hours Completed</h3>
              <p className="text-slate-500 text-sm mt-1 max-w-2xl">You have reached {stats.total}/30 hours. Please pay your annual fee (RM 200) to keep your professional status.</p>
            </div>
            <button 
               disabled={isProcessingPayment}
               onClick={handleRenewalPayment}
               className="w-full md:w-auto py-3 px-10 bg-brand-primary text-white rounded-[12px] text-[10px] font-bold uppercase tracking-widest hover:bg-brand-secondary transition shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2 active:scale-95"
            >
               {isProcessingPayment ? "Processing..." : <><CreditCard size={16} /> Pay RM 200 renewal</>}
            </button>
          </motion.div>
        )}

        {/* Renewal Success Banner */}
        {user.feesPaid?.renewal && user.renewalDate && (
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mb-12 p-8 bg-emerald-50 border border-emerald-100 rounded-[12px] text-slate-900 flex flex-col md:flex-row items-center gap-8 shadow-sm"
          >
            <div className="w-16 h-16 bg-emerald-100 border border-emerald-200 rounded-[12px] flex items-center justify-center text-emerald-600 shadow-sm">
              <CheckCircle size={32} />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl font-bold tracking-tight text-emerald-900">Registration Active</h3>
              <p className="text-emerald-700/70 text-sm mt-1 max-w-2xl">Your MBOT professional registration is in good standing. Next renewal is due on {new Date(user.renewalDate).toLocaleDateString()}.</p>
            </div>
            <div className="px-6 py-2 bg-emerald-600 text-white rounded-[8px] text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-emerald-100">
               Valid until {new Date(user.renewalDate).getFullYear()}
            </div>
          </motion.div>
        )}

         <div className="space-y-8">
          {/* Top Section: Dashboard Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             {/* Progress Circle & Main Stats */}
             <div className="bg-white rounded-[12px] p-8 shadow-sm border border-gray-100 relative overflow-hidden group">
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-8">
                     <div>
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Yearly target</h3>
                        <p className="text-lg font-bold text-slate-900 tracking-tight leading-none">CPD goal progress</p>
                     </div>
                     <div className={cn(
                       "px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                       stats.total >= REQUIRED_HOURS ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-blue-50 text-blue-600 border-blue-100"
                     )}>
                        {stats.total >= REQUIRED_HOURS ? "Met" : "Active"}
                     </div>
                  </div>

                  <div className="flex items-center justify-center">
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
                              paddingAngle={4}
                              dataKey="value"
                              stroke="none"
                            >
                              <Cell fill={stats.total >= REQUIRED_HOURS ? "#10b981" : "#0284c7"} />
                              <Cell fill="#f8fafc" />
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                           <span className="text-3xl font-bold text-slate-900 tracking-tight">
                              {Math.round((stats.total / REQUIRED_HOURS) * 100)}%
                           </span>
                           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{stats.total} / {REQUIRED_HOURS}h</span>
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-8">
                    <div className="bg-slate-50 p-4 rounded-[8px] border border-gray-100 text-center">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Current</p>
                        <p className="text-xl font-bold text-slate-900">{stats.total} h</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-[8px] border border-gray-100 text-center">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Required</p>
                        <p className="text-xl font-bold text-slate-900">{REQUIRED_HOURS} h</p>
                    </div>
                  </div>
                </div>
             </div>

             {/* Monthly Trend Chart */}
             <div className="lg:col-span-2 bg-white rounded-[12px] p-8 shadow-sm border border-gray-100 flex flex-col">
                <div className="flex justify-between items-center mb-10">
                   <div>
                     <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Monthly trend</h3>
                     <p className="text-lg font-bold text-slate-900 tracking-tight leading-none">Learning activity logs</p>
                   </div>
                   <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-slate-900"></div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Logged hours</span>
                    </div>
                </div>

                <div className="flex-1 w-full min-h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.monthly} barSize={20} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 9, fontWeight: 500, fill: '#94a3b8' }} 
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 9, fontWeight: 500, fill: '#94a3b8' }} 
                      />
                      <Tooltip 
                        cursor={{ fill: '#f8fafc', radius: 4 }}
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          borderRadius: '8px', 
                          border: '1px solid #f1f5f9', 
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
                          padding: '12px'
                        }}
                      />
                      <Bar dataKey="hours" fill="#0284c7" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-8 p-4 bg-slate-50 rounded-[8px] flex items-center justify-between border border-gray-100">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-[8px] flex items-center justify-center text-slate-900 shadow-sm border border-gray-100">
                        <TrendingUp size={18} />
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Average velocity</p>
                        <p className="text-sm font-bold text-slate-900 tracking-tight">+{Math.round((stats.total/12)*10)/10} hours per month</p>
                      </div>
                   </div>
                   <ChevronRight size={16} className="text-slate-300" />
                </div>
             </div>
          </div>
        </div>

        <div className="mt-16 space-y-8">
           {/* Filter & Search Header */}
             <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-[24px] border border-gray-100 shadow-sm">
                <div className="relative flex-1 group w-full">
                   <Search size={22} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-brand-primary" />
                   <input 
                     type="text" 
                     value={searchTerm}
                     onChange={e => setSearchTerm(e.target.value)}
                     placeholder="Search activities or providers..." 
                     className="w-full pl-14 pr-6 py-4 bg-transparent outline-none text-base font-sans text-slate-700 placeholder:text-slate-300"
                   />
                </div>
                <div className="flex gap-3 w-full md:w-auto pr-3">
                   <div className="relative">
                      <select 
                         value={filterCategory}
                         onChange={e => setFilterCategory(e.target.value as any)}
                         className="w-full md:w-auto pl-6 pr-14 py-4 bg-slate-50 border border-transparent rounded-[16px] focus:ring-2 focus:ring-slate-100 outline-none text-xs font-bold uppercase tracking-widest transition-all appearance-none cursor-pointer text-slate-600 hover:bg-slate-100"
                      >
                         <option value="All">All Categories</option>
                         {Object.values(CPDCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                        <ChevronRight size={16} className="rotate-90 text-slate-400" />
                      </div>
                   </div>
                </div>
             </div>

             {/* Records Display */}
             <div className="space-y-6">
                {filteredRecords.length === 0 ? (
                  <div className="bg-white p-24 text-center border border-gray-100 rounded-[24px] shadow-sm flex flex-col items-center">
                     <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mb-8">
                       <BookOpen size={40} />
                     </div>
                     <h3 className="text-xl font-bold text-slate-900 tracking-tight">No activities found</h3>
                     <p className="text-slate-500 text-sm mt-2 max-w-xs">No records match your current search or filter criteria.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <AnimatePresence mode="popLayout">
                      {filteredRecords.map((record, index) => (
                        <motion.div 
                           key={record.id}
                           layout
                           initial={{ y: 20, opacity: 0 }}
                           animate={{ y: 0, opacity: 1 }}
                           exit={{ scale: 0.95, opacity: 0 }}
                           transition={{ delay: index * 0.05 }}
                           className="bg-white p-8 rounded-[24px] border border-gray-100 shadow-sm hover:shadow-xl transition-all group flex flex-col"
                        >
                           <div className="flex justify-between items-start mb-8">
                              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-white shadow-sm" style={{ backgroundColor: CATEGORY_COLORS[record.category] }}>
                                 {record.category === CPDCategory.TECHNICAL && <Zap size={14} />}
                                 {record.category === CPDCategory.SOFT_SKILLS && <Star size={14} />}
                                 {record.category === CPDCategory.CERTIFICATION && <Award size={14} />}
                                 {record.category === CPDCategory.SEMINAR && <TrendingUp size={14} />}
                                 {record.category === CPDCategory.WORKSHOP && <Zap size={14} />}
                                 {record.category === CPDCategory.OTHER && <Plus size={14} />}
                                 {record.category}
                              </div>
                              <div className="flex gap-2">
                                 <button 
                                   onClick={() => startEdit(record)}
                                   className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all"
                                 >
                                    <Edit size={18} />
                                 </button>
                                 <button 
                                   onClick={() => handleDelete(record.id)}
                                   className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                 >
                                    <Trash2 size={18} />
                                 </button>
                              </div>
                           </div>

                           <div className="mb-8">
                              <h4 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight group-hover:text-brand-primary transition-colors line-clamp-2 min-h-[4rem]">{record.activityName}</h4>
                              <p className="text-sm font-medium text-slate-400 mt-2">{record.provider}</p>
                           </div>

                           <div className="grid grid-cols-2 gap-4 mb-8 pt-4 border-t border-slate-50">
                              <div className="flex flex-col gap-1">
                                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Date logged</p>
                                 <div className="flex items-center gap-2">
                                    <Calendar size={16} className="text-slate-300" />
                                    <p className="text-sm font-bold text-slate-700">{new Date(record.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                 </div>
                              </div>
                              <div className="flex flex-col gap-1">
                                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Credit hours</p>
                                 <div className="flex items-center gap-2">
                                    <Clock size={16} className="text-slate-300" />
                                    <p className="text-sm font-bold text-slate-700">{record.hours} Hours</p>
                                 </div>
                              </div>
                           </div>

                           <div className="mt-auto pt-6 flex flex-col gap-4">
                              <div className="flex items-center gap-2">
                                 <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Verified Record</span>
                              </div>
                              {record.certificateUrl && (
                                 <button 
                                   onClick={() => setViewingRecord(record)}
                                   className="w-full py-4 text-xs font-bold uppercase tracking-widest text-white bg-slate-900 rounded-[16px] hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shadow-lg shadow-slate-900/10"
                                 >
                                    <FileText size={18} /> View proof
                                 </button>
                              )}
                           </div>
                        </motion.div>
                      ))}
                     </AnimatePresence>
                  </div>
                )}
             </div>
          </div>

      {/* Verification Deadline Alert */}
      {stats.total < REQUIRED_HOURS && (
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="fixed bottom-8 left-8 z-[90] max-w-sm hidden 2xl:block"
        >
          <div className="bg-white p-6 rounded-[12px] border border-gray-100 flex gap-4 shadow-xl relative overflow-hidden">
             <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500"></div>
             <div className="w-10 h-10 bg-red-50 rounded-[8px] flex items-center justify-center text-red-500 flex-shrink-0">
                <AlertCircle size={20} />
             </div>
             <div>
                <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-1">More hours needed</p>
                <p className="text-xs font-medium text-slate-600 leading-relaxed">
                   You need <span className="text-red-600 font-bold">{REQUIRED_HOURS - stats.total} more hours</span> to finish the yearly requirement.
                </p>
             </div>
          </div>
        </motion.div>
      )}

      {/* Document Viewer Modal */}
      <AnimatePresence>
        {viewingRecord && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[250] flex items-center justify-center p-4 md:p-12">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full h-full max-w-5xl rounded-[24px] overflow-hidden flex flex-col shadow-2xl border border-white/20"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-600">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">{viewingRecord.activityName}</h3>
                    <p className="text-xs text-slate-500 font-medium">{viewingRecord.fileName || 'Supporting Document'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => openInNewTab(viewingRecord.certificateUrl)}
                    className="p-2.5 bg-slate-50 text-slate-600 hover:text-slate-900 rounded-xl transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-widest mr-2"
                  >
                    <ExternalLink size={16} /> Open in Browser
                  </button>
                  <a 
                    href={viewingRecord.certificateUrl}
                    download={viewingRecord.fileName || "Certificate"}
                    className="p-2.5 bg-slate-50 text-slate-600 hover:text-slate-900 rounded-xl transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-widest mr-2"
                  >
                    <Download size={16} /> Download
                  </a>
                  <button 
                    onClick={() => setViewingRecord(null)}
                    className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>
              <div className="flex-1 bg-slate-100/50 p-8 flex items-center justify-center overflow-auto relative">
                {viewingRecord.certificateUrl?.startsWith('data:image/') ? (
                  <img src={viewingRecord.certificateUrl} alt="Certificate" className="max-w-full max-h-full rounded-lg shadow-lg object-contain" />
                ) : (
                  <div className="w-full h-full relative">
                    <iframe 
                      src={viewingRecord.certificateUrl} 
                      className="w-full h-full rounded-lg shadow-lg bg-white relative z-10"
                      title="Certificate Viewer"
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
                       <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-md mb-6">
                          <FileText size={32} className="text-slate-300" />
                       </div>
                       <h4 className="text-lg font-bold text-slate-900">Document Preview</h4>
                       <p className="text-slate-500 text-sm mt-2 mb-8 max-w-xs">
                          If the document does not load automatically, it might be restricted by your browser.
                       </p>
                       <div className="flex gap-4">
                          <button 
                            onClick={() => openInNewTab(viewingRecord.certificateUrl)}
                            className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-slate-900/20 active:scale-95 transition-all flex items-center gap-2"
                          >
                            <ExternalLink size={18} /> Open in New Tab
                          </button>
                          <a 
                            href={viewingRecord.certificateUrl}
                            download={viewingRecord.fileName || "Certificate"}
                            className="px-8 py-4 bg-white text-slate-900 border border-slate-200 rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-sm active:scale-95 transition-all flex items-center gap-2"
                          >
                            <Download size={18} /> Download
                          </a>
                       </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingId && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-center justify-center p-6">
             <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white max-w-sm w-full rounded-[12px] p-8 text-center shadow-2xl border border-gray-100"
             >
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-[12px] flex items-center justify-center mx-auto mb-6">
                   <Trash2 size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Delete record?</h3>
                <p className="text-slate-500 text-sm mt-2">
                   This action cannot be undone. Are you sure you want to remove this entry?
                </p>
                <div className="mt-8 flex gap-3">
                   <button 
                     onClick={() => setDeletingId(null)}
                     className="flex-1 py-2.5 bg-slate-50 text-slate-600 rounded-[12px] text-[10px] font-bold uppercase tracking-widest hover:bg-slate-100 transition"
                   >
                      Cancel
                   </button>
                   <button 
                     onClick={confirmDelete}
                     className="flex-1 py-2.5 bg-red-600 text-white rounded-[12px] text-[10px] font-bold uppercase tracking-widest hover:bg-red-700 transition"
                   >
                      Delete
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[150] flex items-center justify-center p-6 overflow-y-auto">
             <motion.div 
               initial={{ scale: 0.95, opacity: 0, y: 20 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ scale: 0.95, opacity: 0, y: 20 }}
               className="bg-white w-full max-w-xl rounded-[12px] shadow-2xl border border-gray-100 relative my-auto overflow-hidden"
             >
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-slate-50/50">
                   <div>
                      <h2 className="text-xl font-bold text-slate-900 tracking-tight">{editingId ? 'Edit Activity' : 'New CPD Activity'}</h2>
                      <p className="text-slate-500 text-xs mt-1">Log your professional development progress.</p>
                   </div>
                   <button 
                     onClick={resetForm}
                     className="p-2 text-slate-400 hover:text-slate-900 transition-all rounded-lg"
                   >
                      <X size={20} />
                   </button>
                </div>

                <form onSubmit={handleSave} className="p-6 space-y-5">
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Activity name</label>
                      <input 
                        required
                        type="text" 
                        value={formData.activityName}
                        onChange={e => setFormData({...formData, activityName: e.target.value})}
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-[12px] focus:ring-2 focus:ring-slate-100 outline-none text-sm transition-all text-slate-700 placeholder:text-slate-300"
                        placeholder="e.g. Advanced AI Seminar"
                      />
                   </div>

                   <div className="grid md:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Category</label>
                         <div className="relative">
                            <select 
                              value={formData.category}
                              onChange={e => setFormData({...formData, category: e.target.value as CPDCategory})}
                              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-[12px] focus:ring-2 focus:ring-slate-100 outline-none text-sm transition-all text-slate-700 appearance-none cursor-pointer"
                            >
                               {Object.values(CPDCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                               <ChevronRight size={14} className="rotate-90 text-slate-400" />
                            </div>
                         </div>
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Credit hours</label>
                         <input 
                           required
                           type="number" 
                           step="0.5"
                           min="0"
                           value={formData.hours}
                           onChange={e => setFormData({...formData, hours: e.target.value})}
                           className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-[12px] focus:ring-2 focus:ring-slate-100 outline-none text-sm transition-all text-slate-700"
                         />
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Completion date</label>
                         <input 
                           required
                           type="date" 
                           value={formData.date}
                           onChange={e => setFormData({...formData, date: e.target.value})}
                           className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-[12px] focus:ring-2 focus:ring-slate-100 outline-none text-sm transition-all text-slate-700"
                         />
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Evidence</label>
                         <label className="w-full px-4 py-2.5 bg-slate-50 border border-gray-200 border-dashed rounded-[12px] focus-within:ring-2 focus-within:ring-slate-100 text-sm transition-all text-slate-400 flex items-center justify-between cursor-pointer hover:bg-slate-100/50">
                            <span className="truncate max-w-[120px] text-xs font-medium">
                               {formData.fileName || "Upload PDF"}
                            </span>
                            <Upload size={16} className="shrink-0" />
                            <input 
                              type="file" 
                              className="hidden" 
                              accept=".pdf,image/*" 
                              onChange={handleFileUpload}
                            />
                         </label>
                      </div>
                   </div>

                   <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Organizer / Provider</label>
                      <input 
                        required
                        type="text" 
                        value={formData.provider}
                        onChange={e => setFormData({...formData, provider: e.target.value})}
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-[12px] focus:ring-2 focus:ring-slate-100 outline-none text-sm transition-all text-slate-700 placeholder:text-slate-300"
                        placeholder="e.g. MBOT / LinkedIn / University"
                      />
                   </div>

                   <div className="pt-4 flex gap-4">
                      <button 
                        type="button" 
                        onClick={resetForm}
                        className="flex-1 py-2.5 bg-white text-slate-600 border border-gray-200 rounded-[12px] text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 transition"
                      >
                         Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="flex-[2] py-2.5 bg-slate-900 text-white rounded-[12px] text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition shadow-sm flex items-center justify-center gap-2"
                      >
                         <Save size={16} /> {editingId ? 'Update Activity' : 'Save Activity'}
                      </button>
                   </div>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
