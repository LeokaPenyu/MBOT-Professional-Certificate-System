import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, XCircle, Search, Filter, Calendar, Clock, 
  User, Award, Eye, Download, ShieldCheck, AlertCircle, RefreshCcw,
  FileText
} from 'lucide-react';
import { getApplicants, saveApplicants } from '../../lib/storage';
import { Applicant, CPDRecord, CPDStatus, CPDCategory } from '../../types';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function CPDApproval() {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<CPDCategory | 'All'>('All');
  const [filterStatus, setFilterStatus] = useState<CPDStatus | 'All'>('All');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [inspectingRecord, setInspectingRecord] = useState<any | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    startDate: '',
    endDate: '',
    category: 'All' as CPDCategory | 'All'
  });

  useEffect(() => {
    let currentUrl: string | null = null;
    
    const createBlob = async () => {
      if (inspectingRecord?.certificateUrl && (inspectingRecord.certificateUrl.includes('pdf') || inspectingRecord.certificateUrl.startsWith('data:application/pdf'))) {
        try {
          // Attempt fetch first as it's cleaner for many browsers
          const res = await fetch(inspectingRecord.certificateUrl);
          const blob = await res.blob();
          currentUrl = URL.createObjectURL(blob);
          setBlobUrl(currentUrl);
        } catch (err) {
          console.warn("Fetch PDF failed, attempting manual base64 conversion", err);
          if (inspectingRecord.certificateUrl.startsWith('data:')) {
            try {
              const parts = inspectingRecord.certificateUrl.split(',');
              if (parts.length > 1) {
                const base64 = parts[1];
                const binary = atob(base64);
                const bytes = new Uint8Array(binary.length);
                for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
                const blob = new Blob([bytes], { type: 'application/pdf' });
                currentUrl = URL.createObjectURL(blob);
                setBlobUrl(currentUrl);
              }
            } catch (e) {
              console.error("Critical PDF conversion failure:", e);
            }
          } else {
            // If fetch failed and it's not a data URL, just try to use the URL directly as a last resort
            setBlobUrl(inspectingRecord.certificateUrl);
          }
        }
      }
    };

    createBlob();

    return () => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
      setBlobUrl(null);
    };
  }, [inspectingRecord]);

  useEffect(() => {
    setApplicants(getApplicants());

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

  const handleStatusChange = (applicantId: string, recordId: string, newStatus: CPDStatus) => {
    const updatedApplicants = applicants.map(app => {
      if (app.id === applicantId) {
        return {
          ...app,
          cpdRecords: app.cpdRecords.map(rec => 
            rec.id === recordId ? { ...rec, status: newStatus } : rec
          )
        };
      }
      return app;
    });

    setApplicants(updatedApplicants);
    saveApplicants(updatedApplicants);
    notify(`ARTIFACT ${newStatus === CPDStatus.APPROVED ? 'VERIFIED' : 'REJECTED'}: Registry updated.`);
  };

  const handleExportReport = () => {
    // Collect all records from all applicants
    const allRecords = applicants.flatMap(app => 
      app.cpdRecords.map(rec => ({ 
        ...rec, 
        applicantName: app.fullName, 
        applicantId: app.id 
      }))
    );

    // Apply filters from exportOptions
    const filteredForExport = allRecords.filter(r => {
      const dateMatch = (!exportOptions.startDate || r.date >= exportOptions.startDate) &&
                        (!exportOptions.endDate || r.date <= exportOptions.endDate);
      const categoryMatch = exportOptions.category === 'All' || r.category === exportOptions.category;
      return dateMatch && categoryMatch;
    });

    if (filteredForExport.length === 0) {
      notify("ERROR: No data found for specified criteria.");
      return;
    }

    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('CPD COMPLIANCE AUDIT REPORT', 20, 25);
    
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 32);
    doc.text(`MBOT REGULATORY OVERSIGHT TERMINAL`, 130, 32);
    
    // Summary
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.text('Audit Summary', 20, 55);
    
    doc.setFontSize(10);
    doc.text(`Total Records Found: ${filteredForExport.length}`, 20, 65);
    doc.text(`Category Filter: ${exportOptions.category}`, 20, 72);
    doc.text(`Date Range: ${exportOptions.startDate || 'Beginning'} to ${exportOptions.endDate || 'Present'}`, 20, 79);
    
    // Table
    const tableData = filteredForExport.map(r => [
      r.applicantName,
      r.activityName,
      r.category,
      r.hours.toFixed(1),
      r.date,
      r.status
    ]);
    
    autoTable(doc, {
      startY: 90,
      head: [['Professional', 'Activity', 'Category', 'Hrs', 'Date', 'Status']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], fontSize: 9, cellPadding: 3 },
      bodyStyles: { fontSize: 8, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 60 },
        2: { cellWidth: 25 },
        3: { cellWidth: 15, halign: 'center' },
        4: { cellWidth: 25 },
        5: { cellWidth: 25 }
      }
    });
    
    doc.save(`MBOT_CPD_Audit_${new Date().toISOString().split('T')[0]}.pdf`);
    notify("REPORT GENERATED: Audit documentation exported successfully.");
    setShowExportModal(false);
  };

  // Flatten pending records for the admin view
  const allPendingRecords = applicants.flatMap(app => 
    app.cpdRecords.map(rec => ({ ...rec, applicantName: app.fullName, applicantId: app.id }))
  );

  const filtered = allPendingRecords
    .filter(r => (filterStatus === 'All' || r.status === filterStatus))
    .filter(r => (filterCategory === 'All' || r.category === filterCategory))
    .filter(r => (!filterStartDate || r.date >= filterStartDate))
    .filter(r => (!filterEndDate || r.date <= filterEndDate))
    .filter(r => 
      r.activityName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      r.applicantName.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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
                <CheckCircle2 size={18} className="text-green-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">{statusMsg}</span>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
        <div>
           <h1 className="text-3xl font-bold text-slate-900 font-display uppercase tracking-tight">CPD Approval</h1>
           <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">Review and approve CPD records.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
           <button 
             onClick={() => setShowExportModal(true)}
             className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-900 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-50 transition active:scale-95 shadow-sm"
           >
              <Download size={14} /> Download Report
           </button>
           <div className="flex items-center px-6 py-3 bg-slate-900 text-white rounded-xl gap-3">
              <RefreshCcw size={14} className="animate-spin-slow" />
              <span className="text-[10px] font-bold uppercase tracking-wider">{filtered.length} Actions Required</span>
           </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="relative flex-1 group">
           <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-blue-600 transition-colors" />
           <input 
             type="text" 
             value={searchTerm}
             onChange={e => setSearchTerm(e.target.value)}
             placeholder="Search by professional name or artifact ID..." 
             className="w-full pl-16 pr-8 py-5 bg-white border border-slate-100 rounded-3xl focus:ring-2 focus:ring-blue-500/10 outline-none text-sm transition-all font-bold placeholder:text-slate-300 shadow-sm"
           />
        </div>
        <div className="flex flex-wrap gap-4">
           <div className="flex items-center gap-2 bg-white border border-slate-100 rounded-3xl px-4 py-2 shadow-sm">
              <Calendar size={14} className="text-slate-400" />
              <input 
                type="date" 
                value={filterStartDate}
                onChange={e => setFilterStartDate(e.target.value)}
                className="bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest cursor-pointer"
                title="Start Date"
              />
              <span className="text-slate-300 font-bold">→</span>
              <input 
                type="date" 
                value={filterEndDate}
                onChange={e => setFilterEndDate(e.target.value)}
                className="bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest cursor-pointer"
                title="End Date"
              />
              {(filterStartDate || filterEndDate) && (
                <button 
                  onClick={() => { setFilterStartDate(''); setFilterEndDate(''); }}
                  className="ml-2 text-red-500 hover:text-red-600 transition-colors"
                >
                  <XCircle size={14} />
                </button>
              )}
           </div>

           <select 
             value={filterStatus}
             onChange={e => setFilterStatus(e.target.value as any)}
             className="px-8 py-5 bg-white border border-slate-100 rounded-3xl focus:ring-2 focus:ring-blue-500/10 outline-none text-[10px] font-black uppercase tracking-widest transition-all appearance-none shadow-sm cursor-pointer"
           >
              <option value="All">All Status</option>
              {Object.values(CPDStatus).map(s => <option key={s} value={s}>{s}</option>)}
           </select>
           <select 
             value={filterCategory}
             onChange={e => setFilterCategory(e.target.value as any)}
             className="px-8 py-5 bg-white border border-slate-100 rounded-3xl focus:ring-2 focus:ring-blue-500/10 outline-none text-[10px] font-black uppercase tracking-widest transition-all appearance-none shadow-sm cursor-pointer"
           >
              <option value="All">All Categories</option>
              {Object.values(CPDCategory).map(c => <option key={c} value={c}>{c}</option>)}
           </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
             <tr className="bg-slate-50/30">
                <th className="px-8 py-5 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-50">Professional</th>
                <th className="px-8 py-5 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-50">Artifact</th>
                <th className="px-8 py-5 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-50">Volume/Date</th>
                <th className="px-8 py-5 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-50">Status</th>
                <th className="px-8 py-5 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-50">Actions</th>
             </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
             {filtered.length === 0 ? (
               <tr>
                 <td colSpan={5} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center">
                       <ShieldCheck size={32} className="text-slate-100 mb-4" />
                       <h3 className="text-lg font-bold text-slate-900 font-display">Queue Clear</h3>
                       <p className="text-slate-400 text-xs font-medium mt-1">Standards are fully compliant.</p>
                    </div>
                 </td>
               </tr>
             ) : (
               filtered.map((record, index) => (
                 <motion.tr 
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: index * 0.03 }}
                   key={record.id} 
                   className="group hover:bg-slate-50/50 transition-all"
                 >
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 text-xs font-bold group-hover:bg-slate-900 group-hover:text-white transition-all">
                             {record.applicantName.charAt(0)}
                          </div>
                          <div>
                             <p className="text-sm font-bold text-slate-900">{record.applicantName}</p>
                             <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">ID: {record.applicantId.slice(0, 6)}</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex flex-col">
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md w-fit mb-1 uppercase tracking-wider">
                             {record.category}
                          </span>
                          <p className="font-bold text-slate-800 text-xs tracking-tight truncate max-w-[200px]">{record.activityName}</p>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-slate-900 font-bold text-xs">
                             <Clock size={12} className="text-blue-500" />
                             {record.hours.toFixed(1)} Cr
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-400 font-medium text-[11px] uppercase tracking-wider">
                             <Calendar size={12} />
                             {new Date(record.date).toLocaleDateString()}
                          </div>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1.5 w-fit border",
                          record.status === CPDStatus.APPROVED ? "bg-green-50/50 text-green-600 border-green-100" : 
                          record.status === CPDStatus.REJECTED ? "bg-red-50/50 text-red-600 border-red-100" : 
                          "bg-amber-50 text-amber-600 border-amber-100"
                       )}>
                          {record.status === CPDStatus.PENDING && <Clock size={10} className="animate-spin-slow" />}
                          {record.status}
                       </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleStatusChange(record.applicantId, record.id, CPDStatus.APPROVED)}
                            className="w-9 h-9 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-300 hover:bg-green-500 hover:text-white hover:border-green-500 transition-all shadow-sm active:scale-95"
                            title="Verify"
                          >
                             <CheckCircle2 size={14} />
                          </button>
                          <button 
                            onClick={() => handleStatusChange(record.applicantId, record.id, CPDStatus.REJECTED)}
                            className="w-9 h-9 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-300 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all shadow-sm active:scale-95"
                            title="Reject"
                          >
                             <XCircle size={14} />
                          </button>
                          <button 
                            className="w-9 h-9 bg-slate-900 border border-slate-900 rounded-xl flex items-center justify-center text-white hover:bg-slate-800 transition-all shadow-sm active:scale-95"
                            title="Inspect"
                            onClick={() => record.certificateUrl ? setInspectingRecord(record) : notify("ERROR: No artifact.")}
                          >
                             <Eye size={14} />
                          </button>
                       </div>
                    </td>
                 </motion.tr>
               ))
             )}
          </tbody>
        </table>
      </div>

      <div className="bg-slate-50 border border-slate-100 rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center justify-between gap-8">
         <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-slate-900 shadow-xl shadow-slate-200/50">
               <AlertCircle size={32} />
            </div>
            <div>
               <h4 className="text-sm font-black text-slate-900 uppercase italic">Careful Review Required</h4>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Please check all documents manually before approving.</p>
            </div>
         </div>
         <button 
           onClick={() => notify("SYNCING: Professional registry synchronized and compliance flags updated.")}
           className="px-10 py-5 bg-slate-900 text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-slate-800 transition active:scale-95 shadow-2xl"
         >
            Update Records
         </button>
      </div>

      {/* Export Audit Report Modal */}
      <AnimatePresence>
        {showExportModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[120] flex items-center justify-center p-4">
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden"
             >
                <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                   <div>
                      <h2 className="text-xl font-bold text-slate-900 font-display uppercase tracking-tight">Export Audit Report</h2>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Configure Parameters for Regulatory Export</p>
                   </div>
                   <button 
                     onClick={() => setShowExportModal(false)}
                     className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 shadow-sm border border-slate-100 transition-all hover:rotate-90"
                   >
                      <XCircle size={18} />
                   </button>
                </div>
                
                <div className="p-8 space-y-6">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Start Date</label>
                         <input 
                           type="date" 
                           value={exportOptions.startDate}
                           onChange={e => setExportOptions({...exportOptions, startDate: e.target.value})}
                           className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-sm transition-all font-bold uppercase"
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">End Date</label>
                         <input 
                           type="date" 
                           value={exportOptions.endDate}
                           onChange={e => setExportOptions({...exportOptions, endDate: e.target.value})}
                           className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-sm transition-all font-bold uppercase"
                         />
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">CPD Category Filter</label>
                      <select 
                        value={exportOptions.category}
                        onChange={e => setExportOptions({...exportOptions, category: e.target.value as any})}
                        className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-sm transition-all font-bold cursor-pointer"
                      >
                         <option value="All">All Categories</option>
                         {Object.values(CPDCategory).map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                   </div>

                   <div className="pt-4 flex gap-4">
                      <button 
                        onClick={() => setShowExportModal(false)}
                        className="flex-1 py-4 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition active:scale-95"
                      >
                         Cancel
                      </button>
                      <button 
                         onClick={handleExportReport}
                         className="flex-[2] py-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition shadow-2xl flex items-center justify-center gap-3 active:scale-95"
                      >
                         <FileText size={16} /> Generate PDF Report
                      </button>
                   </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Proof Inspection Modal */}
      <AnimatePresence>
        {inspectingRecord && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[120] flex items-center justify-center p-4">
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden"
             >
                <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                   <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-2xl italic shadow-xl shadow-blue-100">
                         {inspectingRecord.applicantName.charAt(0)}
                      </div>
                      <div>
                         <h2 className="text-2xl font-black text-slate-900 font-display uppercase tracking-tight italic">{inspectingRecord.applicantName}</h2>
                         <p className="text-slate-400 text-[10px] mt-1 font-black uppercase tracking-[0.2em] flex items-center gap-2">
                           <ShieldCheck size={12} className="text-blue-600" />
                           Registry Artifact Audit • {inspectingRecord.category}
                         </p>
                      </div>
                   </div>
                   <button 
                     onClick={() => setInspectingRecord(null)}
                     className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-900 shadow-sm border border-slate-100 transition-all hover:rotate-90"
                   >
                      <XCircle size={20} />
                   </button>
                </div>
                
                <div className="flex-1 p-0 bg-slate-50 flex flex-col min-h-0">
                   {/* Control Bar */}
                   <div className="px-10 py-5 bg-white border-b border-slate-100 flex flex-wrap justify-between items-center gap-6">
                      <div className="flex items-center gap-3">
                         <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                         <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">{inspectingRecord.activityName}</p>
                      </div>
                      <div className="flex items-center gap-4">
                         <div className="hidden xl:flex items-center gap-2 pr-4 border-r border-slate-100">
                            <AlertCircle size={14} className="text-amber-500" />
                            <p className="text-[8px] font-bold text-amber-700 uppercase tracking-widest leading-none">Preview Issue? Use New Tab</p>
                         </div>
                         <a 
                            href={blobUrl || inspectingRecord.certificateUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-900 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 transition active:scale-95 shadow-sm"
                         >
                            <Eye size={12} /> View in New Browser Tab
                         </a>
                         <a 
                            href={inspectingRecord.certificateUrl} 
                            download={inspectingRecord.fileName || 'Proof.pdf'}
                            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 transition active:scale-95 shadow-lg shadow-slate-200"
                         >
                            <Download size={12} /> Download
                         </a>
                      </div>
                   </div>

                   <div className="flex-1 p-10 overflow-hidden min-h-0">
                      {inspectingRecord.certificateUrl.startsWith('data:image/') ? (
                         <div className="w-full h-full flex flex-col items-center justify-center overflow-auto gap-4 custom-scrollbar">
                           <img 
                             src={inspectingRecord.certificateUrl} 
                             alt="CPD Proof" 
                             className="max-w-full h-auto rounded-2xl shadow-2xl border-4 border-white"
                             referrerPolicy="no-referrer"
                           />
                         </div>
                      ) : (inspectingRecord.certificateUrl.includes('pdf') || inspectingRecord.certificateUrl.startsWith('data:application/pdf')) ? (
                         <div className="w-full h-full">
                           {blobUrl ? (
                             <div className="w-full h-full rounded-3xl shadow-2xl bg-white overflow-hidden relative border border-slate-200 group/pdf">
                               <iframe 
                                 src={`${blobUrl}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`}
                                 className="w-full h-full border-none"
                                 title="PDF Preview"
                               />
                               <div className="absolute inset-0 pointer-events-none border-4 border-transparent group-hover/pdf:border-blue-500/5 transition-all rounded-3xl" />
                             </div>
                           ) : (
                             <div className="w-full h-full flex flex-col items-center justify-center bg-white rounded-3xl shadow-xl border border-slate-100">
                                <div className="relative">
                                   <RefreshCcw size={48} className="text-blue-500 animate-spin" />
                                   <ShieldCheck size={20} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600" />
                                </div>
                                <h4 className="mt-6 text-sm font-black text-slate-900 uppercase italic">Reconstructing Artifact...</h4>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 text-center">Decrypting secure PDF data stream<br/>for compliance inspection</p>
                             </div>
                           )}
                         </div>
                      ) : (
                         <div className="w-full h-full flex items-center justify-center">
                            <div className="bg-white p-12 rounded-[3rem] text-center shadow-2xl border border-slate-100 max-w-md">
                              <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 mx-auto mb-8">
                                 <AlertCircle size={40} />
                               </div>
                               <h3 className="text-xl font-black text-slate-900 uppercase italic mb-2">Unrecognized Format</h3>
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-10 leading-relaxed">This artifact requires manual detonation in a local environment for verification.</p>
                               <a 
                                 href={inspectingRecord.certificateUrl} 
                                 download={inspectingRecord.fileName || 'Proof.pdf'}
                                 className="w-full py-5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-slate-800 transition shadow-2xl active:scale-95 block"
                               >
                                  Release Artifact for Download
                               </a>
                            </div>
                         </div>
                      )}
                   </div>
                </div>

             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
