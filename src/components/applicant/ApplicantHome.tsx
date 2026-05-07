import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, FileText, CheckCircle2, Clock, Calendar, Download, QrCode, Upload, CreditCard, MessageSquare, ShieldCheck, Mail, Phone, MapPin, User, AlertCircle, RefreshCcw, Eye, Shield, X, ChevronRight } from 'lucide-react';
import { getCurrentUser, saveApplicants, getApplicants, addNotification, updateUserProfile } from '../../lib/storage';
import { Applicant, ApplicantStatus, CPDCategory, Notification as AppNotification } from '../../types';
import { FEES, MBOT_FIELDS } from '../../constants';
import { cn } from '../../lib/utils';
import { jsPDF } from 'jspdf';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'motion/react';
import ProfilePhotoUploader from '../common/ProfilePhotoUploader';

export default function ApplicantHome() {
  const navigate = useNavigate();
  const [user, setUser] = useState<Applicant | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeStage, setActiveStage] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const [showIdModal, setShowIdModal] = useState(false);

  useEffect(() => {
    const refreshUser = () => {
      const currentUser = getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      }
    };

    refreshUser();
    window.addEventListener('mbot-user-update', refreshUser);
    return () => window.removeEventListener('mbot-user-update', refreshUser);
  }, []);

  if (!user) return <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="flex flex-col items-center gap-4">
      <RefreshCcw className="animate-spin text-blue-600" size={40} />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Synchronizing Identity...</p>
    </div>
  </div>;

  const unreadCount = user.notifications?.filter(n => !n.read).length || 0;

  const handlePayment = (feeType: 'application' | 'assessment' | 'certification' | 'renewal', amount: number) => {
    setIsProcessingPayment(true);
    
    // Simulate payment gateway
    setTimeout(() => {
      const updatedUser: Applicant = {
        ...user,
        feesPaid: {
          ...user.feesPaid,
          [feeType]: true
        }
      };

      // Transition states based on payment
      if (feeType === 'certification') {
        updatedUser.status = ApplicantStatus.CERTIFICATE_READY;
        updatedUser.workflowLog.push({
          stage: 'Certificate Ready',
          date: new Date().toISOString(),
          actor: 'System Finance',
          comments: 'Certification processing fee verified. Registry awaiting Secretariat final validation.'
        });
      }

      if (feeType === 'renewal') {
        updatedUser.renewalDate = new Date(new Date().getFullYear() + 1, new Date().getMonth(), new Date().getDate()).toISOString();
        updatedUser.workflowLog.push({
          stage: 'Renewal Completed',
          date: new Date().toISOString(),
          actor: 'System Finance',
          comments: 'Annual renewal fee RM 200 paid. Membership extended by 1 year.'
        });
      }

      updateUser(updatedUser);
      addNotification(user.id, {
        title: "Payment Success",
        message: `Your RM${amount} payment for ${feeType} fee has been confirmed. Receipt #${Math.floor(Math.random() * 1000000)} generated.`
      });
      setIsProcessingPayment(false);
      alert('Payment processed successfully. Your records have been updated.');
    }, 2000);
  };

  const markNotificationRead = (id: string) => {
    if (!user) return;
    const updatedNotifications = user.notifications.map(n => n.id === id ? { ...n, read: true } : n);
    updateUser({ ...user, notifications: updatedNotifications });
  };

  const workflowStages = [
    { key: ApplicantStatus.REGISTERED, label: 'Registered', description: 'Account initialization and basis check', icon: <User size={14} />, status: 'complete' },
    { key: ApplicantStatus.UNDER_REVIEW, label: 'Under Review', description: 'Document audit and eligibility verification', icon: <FileText size={14} />, status: [ApplicantStatus.REGISTERED].includes(user.status) ? 'current' : 'complete' },
    { key: ApplicantStatus.ASSESSMENT_PENDING, label: 'Assessment', description: 'Technical competency evaluation module', icon: <Award size={14} />, status: [ApplicantStatus.UNDER_REVIEW, ApplicantStatus.PROFESSIONAL_PENDING].includes(user.status) ? 'current' : ([ApplicantStatus.ASSESSMENT_PASSED, ApplicantStatus.CERTIFICATE_READY, ApplicantStatus.CERTIFIED, ApplicantStatus.PROFESSIONAL, ApplicantStatus.CERTIFIED_TECH].includes(user.status) ? 'complete' : 'upcoming') },
    { key: ApplicantStatus.CERTIFIED, label: 'Certified', description: 'Issuance of Ts./Tc. professional title', icon: <ShieldCheck size={14} />, status: [ApplicantStatus.CERTIFIED, ApplicantStatus.PROFESSIONAL, ApplicantStatus.CERTIFIED_TECH].includes(user.status) ? 'complete' : ([ApplicantStatus.ASSESSMENT_PASSED, ApplicantStatus.CERTIFICATE_READY].includes(user.status) ? 'current' : 'upcoming') }
  ];

  const updateUser = (updated: Applicant) => {
    const applicants = getApplicants().map(a => a.id === updated.id ? updated : a);
    saveApplicants(applicants);
    updateUserProfile(updated);
    setUser(updated);
  };

  const handlePfpUpdate = (dataUrl: string) => {
    if (!user) return;
    const updatedUser = { ...user, profilePicture: dataUrl };
    updateUser(updatedUser);
  };

  const generateCertificate = () => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Theme Colors
    const primaryBlue = [37, 99, 235];
    const gold = [218, 165, 32];

    doc.setFillColor(252, 252, 253);
    doc.rect(0, 0, 297, 210, 'F');
    
    // Border
    doc.setDrawColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
    doc.setLineWidth(1);
    doc.rect(8, 8, 281, 194);
    doc.setLineWidth(0.5);
    doc.rect(10, 10, 277, 190);

    // Ornament Corner
    doc.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
    doc.triangle(10, 10, 30, 10, 10, 30, 'F');
    doc.triangle(287, 10, 267, 10, 287, 30, 'F');
    doc.triangle(10, 200, 30, 200, 10, 180, 'F');
    doc.triangle(287, 200, 267, 200, 287, 180, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(30, 41, 59);
    doc.text('MALAYSIA BOARD OF TECHNOLOGISTS', 148.5, 45, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text('ESTABLISHED UNDER THE TECHNOLOGISTS AND TECHNICIANS ACT 2015 [ACT 768]', 148.5, 52, { align: 'center' });

    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'normal');
    doc.text('This is to certify that', 148.5, 80, { align: 'center' });
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(32);
    doc.setTextColor(37, 99, 235);
    const title = [ApplicantStatus.PROFESSIONAL, ApplicantStatus.PROFESSIONAL_PENDING].some(s => user.status === s) ? 'Ts. ' : ([ApplicantStatus.CERTIFIED_TECH, ApplicantStatus.CERTIFIED].some(s => user.status === s) ? 'Tc. ' : '');
    doc.text(`${title}${user.fullName.toUpperCase()}`, 148.5, 100, { align: 'center' });

    doc.setFontSize(14);
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.text('as registered on the professional list of', 148.5, 115, { align: 'center' });
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(30, 41, 59);
    const finalRole = [ApplicantStatus.PROFESSIONAL, ApplicantStatus.PROFESSIONAL_PENDING].some(s => user.status === s) ? 'PROFESSIONAL TECHNOLOGIST' : 'CERTIFIED TECHNICIAN';
    doc.text(finalRole, 148.5, 130, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 116, 139);
    doc.text(`Field of Technology: ${user.field}`, 148.5, 145, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    const regNum = user.pTechNumber || user.cTechNumber || user.gtNumber || user.qtNumber || 'N/A';
    doc.text(`REGESTRATION NO: ${regNum}`, 148.5, 165, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`ISSUED BY THE AUTHORITY OF THE BOARD ON ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}`, 148.5, 175, { align: 'center' });

    // Seal
    doc.setDrawColor(218, 165, 32);
    doc.setLineWidth(0.5);
    doc.circle(250, 160, 20);
    doc.setFontSize(6);
    doc.text('OFFICIAL SEAL', 250, 161, { align: 'center' });

    doc.save(`MBOT_CERTIFICATE_${user.fullName.replace(/\s+/g, '_')}.pdf`);
  };

  const steps = [
    { label: "Registered", completed: true },
    { label: "Assessment", completed: [ApplicantStatus.ASSESSMENT_PASSED, ApplicantStatus.CERTIFICATE_READY, ApplicantStatus.PROFESSIONAL, ApplicantStatus.CERTIFIED, ApplicantStatus.CERTIFIED_TECH].includes(user.status) },
    { label: "Payment", completed: user.feesPaid?.certification || [ApplicantStatus.CERTIFIED, ApplicantStatus.PROFESSIONAL, ApplicantStatus.CERTIFIED_TECH].includes(user.status) },
    { label: "Certified", completed: [ApplicantStatus.PROFESSIONAL, ApplicantStatus.CERTIFIED, ApplicantStatus.CERTIFIED_TECH].includes(user.status) },
  ];

  const calculateCompleteness = () => {
    const sections = [
      { name: 'Personal Details', fields: ['fullName', 'icPassport', 'email', 'phone'], weight: 30 },
      { name: 'Academic Info', fields: ['qualification', 'field'], weight: 30 },
      { name: 'Professional Evidence', fields: ['yearsOfExperience', 'cvMetadata'], weight: 40 }
    ];

    let totalScore = 0;
    const details = sections.map(section => {
      const completedFields = section.fields.filter(f => {
        const val = (user as any)[f];
        return val !== undefined && val !== null && val !== '' && val !== 0;
      });
      const sectionScore = (completedFields.length / section.fields.length) * section.weight;
      totalScore += sectionScore;
      return {
        ...section,
        completed: completedFields.length === section.fields.length,
        percent: Math.round((completedFields.length / section.fields.length) * 100)
      };
    });

    return { total: Math.round(totalScore), details };
  };

  const completeness = calculateCompleteness();

  const totalCpdHours = user.cpdRecords?.filter(r => r.status === 'Approved').reduce((acc, r) => acc + r.hours, 0) || 0;

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
      {/* Header Info */}
      <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 blur-3xl -mr-32 -mt-32 transition-colors group-hover:bg-slate-100/50"></div>
        <div className="relative z-10 flex items-center gap-8">
           <ProfilePhotoUploader 
             currentImage={user.profilePicture}
             onImageCropped={handlePfpUpdate}
             initials={user.fullName.charAt(0)}
             className="w-24 h-24"
             disabled={true}
           />
           <div>
             <h1 className="text-3xl font-bold text-slate-900 font-display tracking-tight flex items-center gap-3">
               Welcome, {user.fullName.split(' ')[0]}
             </h1>
             <p className="text-slate-400 mt-1 uppercase tracking-wider text-xs font-semibold flex items-center gap-2">
               <ShieldCheck size={14} className="text-blue-500" />
               National Professional Registry • <span className="text-blue-600">{user.status}</span>
             </p>
           </div>
        </div>
        
        <div className="relative z-10 flex gap-4">
           {[ApplicantStatus.CERTIFIED, ApplicantStatus.PROFESSIONAL, ApplicantStatus.CERTIFIED_TECH].includes(user.status) && (
             <button 
                onClick={generateCertificate}
                className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl shadow-lg hover:bg-slate-800 transition-all text-sm font-semibold active:scale-95 animate-in zoom-in duration-500"
             >
                <Download size={16} /> Download Certificate
             </button>
           )}

        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Workflow and Feed */}
        <div className="lg:col-span-8 space-y-8">
           {/* Interactive Workflow Tracker */}
           <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                 <div>
                    <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Certification Progress</h2>
                    <p className="text-xl font-bold text-slate-900 font-display">Registration Track</p>
                 </div>
                 <div className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold border border-blue-100">
                    {user.status}
                 </div>
              </div>

              <div className="relative py-4">
                <div className="absolute top-1/2 left-[10%] w-[80%] h-px bg-slate-100 -translate-y-1/2"></div>
                <div className="flex justify-between relative px-2">
                   {workflowStages.map((stage, idx) => (
                     <div key={idx} className="flex flex-col items-center group/stage relative">
                        <button 
                           onClick={() => setActiveStage(stage.key)}
                           className={cn(
                             "w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-300 relative z-10",
                             stage.status === 'complete' ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100" :
                             stage.status === 'current' ? "bg-white border-blue-500 text-blue-600 shadow-sm" :
                             "bg-slate-50 border-slate-200 text-slate-300"
                           )}
                        >
                           {stage.status === 'complete' ? <CheckCircle2 size={16} /> : stage.icon}
                        </button>
                        <p className={cn(
                          "absolute top-14 text-[10px] font-semibold uppercase tracking-wider text-center w-24 group-hover/stage:text-blue-600 transition-colors",
                          stage.status === 'complete' || stage.status === 'current' ? "text-slate-900" : "text-slate-400"
                        )}>
                           {stage.label}
                        </p>
                     </div>
                   ))}
               </div>

               {activeStage && (
                 <motion.div 
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="mt-12 p-8 bg-slate-50 rounded-[2rem] border border-slate-100 relative"
                 >
                    <button 
                      onClick={() => setActiveStage(null)}
                      className="absolute top-6 right-6 text-slate-400 hover:text-slate-900"
                    >
                       <X className="w-4 h-4" />
                    </button>
                    <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">Stage Details: {activeStage}</h4>
                    <p className="text-sm font-bold text-slate-900 mb-2">
                       {workflowStages.find(s => s.key === activeStage)?.label} Review
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium mb-4">
                       {workflowStages.find(s => s.key === activeStage)?.description}. 
                       Status: <span className="text-blue-600 font-bold">{workflowStages.find(s => s.key === activeStage)?.status.toUpperCase()}</span>
                    </p>
                    {activeStage === ApplicantStatus.REGISTERED && (
                       <button onClick={() => navigate('/profile')} className="text-[10px] font-black text-blue-600 uppercase hover:underline">View Registration Artifacts →</button>
                    )}
                 </motion.div>
               )}
              </div>

               {/* Assessment Action */}
              {[ApplicantStatus.ASSESSMENT_PASSED, ApplicantStatus.CERTIFICATE_READY].includes(user.status) && (
                 <div className="mt-16 p-8 rounded-3xl bg-green-600 text-white flex flex-col md:flex-row items-center gap-8 shadow-xl shadow-green-100 transition-all animate-in zoom-in duration-500">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                       <CheckCircle2 size={32} />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                       <h3 className="text-xl font-bold font-display leading-tight">Assessment Completed</h3>
                       <p className="text-green-50 text-xs font-medium mt-1">Validation transcript successfully recorded in national registry.</p>
                    </div>
                    <button 
                       disabled
                       className="px-8 py-4 bg-white/20 text-white rounded-2xl font-bold text-sm cursor-not-allowed opacity-50 flex items-center gap-2"
                    >
                       <ShieldCheck size={14} /> Module Finalized
                    </button>
                 </div>
              )}

              {user.status === ApplicantStatus.ASSESSMENT_PENDING && (
                <div className={cn(
                  "mt-16 p-8 rounded-3xl text-white flex flex-col md:flex-row items-center gap-8 shadow-xl transition-all",
                  user.feesPaid?.assessment 
                    ? "bg-blue-600 shadow-blue-100" 
                    : "bg-slate-800 shadow-slate-200"
                )}>
                   <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                      {user.feesPaid?.assessment ? <Award size={32} /> : <CreditCard size={32} />}
                   </div>
                   <div className="flex-1 text-center md:text-left">
                      <h3 className="text-xl font-bold font-display leading-tight">
                        {user.feesPaid?.assessment ? "Assessment Module Ready" : "Assessment Locked"}
                      </h3>
                      <p className="text-blue-100/80 text-xs font-medium mt-1">
                        {user.feesPaid?.assessment 
                          ? "Verify your technical competency to proceed." 
                          : "Administrative settlement required to initialize technical validation."}
                      </p>
                   </div>
                   {user.feesPaid?.assessment ? (
                     <button 
                        onClick={() => navigate('/assessment')}
                        className="px-8 py-4 bg-white text-blue-600 rounded-2xl font-bold text-sm hover:bg-slate-50 transition shadow-sm active:scale-95"
                     >
                        Start Assessment
                     </button>
                   ) : (
                     <button 
                        onClick={() => {
                          const element = document.getElementById('payment-section');
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth' });
                          }
                        }}
                        className="px-8 py-4 bg-orange-500 text-white rounded-2xl font-bold text-sm hover:bg-orange-600 transition shadow-sm active:scale-95 flex items-center gap-2"
                     >
                        <CreditCard size={16} /> Pay to Unlock
                     </button>
                   )}
                </div>
              )}
           </div>

           {/* Assessor Feedback & History */}
           <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm relative">
              <div className="flex justify-between items-center mb-10">
                 <h2 className="text-sm font-bold text-slate-800">Application Timeline</h2>
                 <MessageSquare size={18} className="text-slate-300" />
              </div>
              
              <div className="space-y-8">
                 {user.workflowLog?.slice().reverse().map((log, idx) => (
                   <div key={idx} className="flex gap-4 group relative">
                      <div className="flex flex-col items-center">
                         <div className={cn("w-2 h-2 rounded-full mt-1 border border-white ring-2", idx === 0 ? "bg-blue-600 ring-blue-50" : "bg-slate-200 ring-slate-50")}></div>
                         {idx !== (user.workflowLog?.length || 0) - 1 && <div className="w-px flex-1 bg-slate-100 mt-2"></div>}
                      </div>
                      <div className="pb-2 flex-1">
                         <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-slate-900">{log.stage}</span>
                            <span className="text-[10px] font-medium text-slate-400">{new Date(log.date).toLocaleDateString()}</span>
                         </div>
                         <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group-hover:bg-white group-hover:shadow-md transition-all">
                            <p className="text-xs text-slate-600 leading-relaxed italic">"{log.comments}"</p>
                            <p className="mt-2 text-[10px] font-semibold text-blue-500">{log.actor}</p>
                         </div>
                      </div>
                   </div>
                 ))}
                 {!user.workflowLog?.length && (
                   <div className="text-center py-10 opacity-40">
                      <AlertCircle className="mx-auto mb-4" size={32} />
                      <p className="text-[10px] font-black uppercase tracking-widest">No feedback trail found</p>
                   </div>
                 )}
              </div>
           </div>
        </div>

        {/* Right Column: Cards */}
        <div className="lg:col-span-4 space-y-8">
           {/* Payment Module */}
           <div id="payment-section" className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-2xl -mr-16 -mt-16"></div>
              <div className="flex justify-between items-center mb-8 relative z-10">
                 <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Finance</p>
                 <CreditCard size={20} className="text-slate-600" />
              </div>
              
              <div className="space-y-6 relative z-10">
                 <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-4">Account Dues</p>
                    {!user.feesPaid?.assessment && (
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-bold">Assessment Fee</p>
                          <p className="text-[9px] font-medium text-slate-500">Technical competency validation</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">RM600</p>
                          <button 
                            disabled={isProcessingPayment}
                            onClick={() => handlePayment('assessment', 600)}
                            className="mt-3 px-5 py-2 bg-blue-600 text-[10px] font-bold uppercase rounded-full hover:bg-blue-500 transition-all active:scale-95"
                          >
                            Pay RM600
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {user.status === ApplicantStatus.ASSESSMENT_PASSED && !user.feesPaid?.certification && (
                      <div className="flex justify-between items-center pt-4 mt-4 border-t border-white/5">
                        <div>
                          <p className="text-sm font-bold">Certification Fee</p>
                          <p className="text-[9px] font-medium text-slate-500">Processing & Certificate Issuance</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">RM350</p>
                          <button 
                            disabled={isProcessingPayment}
                            onClick={() => handlePayment('certification', 350)}
                            className="mt-3 px-5 py-2 bg-green-500 text-[10px] font-bold uppercase rounded-full hover:bg-green-400 transition-all font-sans active:scale-95"
                          >
                            Pay RM350
                          </button>
                        </div>
                      </div>
                    )}

                    {totalCpdHours >= 30 && !user.feesPaid?.renewal && (
                      <div className="flex justify-between items-center pt-4 mt-4 border-t border-white/5">
                        <div>
                          <p className="text-sm font-bold">Annual Renewal Fee</p>
                          <p className="text-[9px] font-medium text-slate-500">30/30 CPD Hours Achieved</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">RM200</p>
                          <button 
                            disabled={isProcessingPayment}
                            onClick={() => handlePayment('renewal', 200)}
                            className="mt-3 px-5 py-2 bg-orange-600 text-[10px] font-bold uppercase rounded-full hover:bg-orange-500 transition-all font-sans active:scale-95"
                          >
                            Pay RM200
                          </button>
                        </div>
                      </div>
                    )}

                    {user.renewalDate && (
                      <div className="flex justify-between items-center pt-4 mt-4 border-t border-white/5">
                        <div>
                          <p className="text-sm font-bold">Registry Valid Until</p>
                          <p className="text-[9px] font-medium text-slate-500">Professional Standing Cycle</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-blue-400">{new Date(user.renewalDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                    )}

                    {(user.feesPaid?.assessment && 
                      (user.status !== ApplicantStatus.ASSESSMENT_PASSED || user.feesPaid?.certification) &&
                      (totalCpdHours < 30 || user.feesPaid?.renewal)) && (
                      <div className="text-center py-2">
                         <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 mx-auto mb-3">
                            <CheckCircle2 size={18} />
                         </div>
                         <p className="text-xs font-bold">Account Balanced</p>
                      </div>
                    )}
                 </div>
              </div>
           </div>

           {/* Registration Artifacts Panel */}
           <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest leading-none">Registry Documentation</h3>
                 <ShieldCheck size={16} className="text-blue-500" />
              </div>
              
              <div className="space-y-4">
                 <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-blue-200 transition-all cursor-pointer" onClick={() => navigate('/profile')}>
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
                          <User size={14} />
                       </div>
                       <div>
                          <p className="text-[11px] font-bold text-slate-900">Personal Details</p>
                          <p className="text-[9px] text-slate-400 font-medium">Identity & Basis Records</p>
                       </div>
                    </div>
                    <ChevronRight size={14} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                 </div>

                 <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-blue-200 transition-all cursor-pointer" onClick={() => navigate('/profile')}>
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
                          <FileText size={14} />
                       </div>
                       <div>
                          <p className="text-[11px] font-bold text-slate-900">Academic Background</p>
                          <p className="text-[9px] text-slate-400 font-medium">Technological Domain Evidence</p>
                       </div>
                    </div>
                    <ChevronRight size={14} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                 </div>

                 <button 
                  onClick={() => setShowIdModal(true)}
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition shadow-lg shadow-blue-500/20 active:scale-95"
                 >
                    View Registry ID
                 </button>
              </div>
           </div>

           {/* Certificate Preview/QR Panel */}
           <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm text-center group">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-8">Digital Identity Verified</h3>
              
              <div className="relative inline-block">
                 <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 transition-all group-hover:shadow-lg">
                    <QRCodeSVG 
                      value={[ApplicantStatus.CERTIFIED, ApplicantStatus.PROFESSIONAL, ApplicantStatus.CERTIFIED_TECH].includes(user.status) ? `https://ais-ver-6789.verify.mbot.com/id/${user.icPassport}` : `https://ais-reg-6789.registry.mbot.com/preaudit/${user.id}`} 
                      size={160} 
                      className={cn(![ApplicantStatus.CERTIFIED, ApplicantStatus.PROFESSIONAL, ApplicantStatus.CERTIFIED_TECH].includes(user.status) && "opacity-10 grayscale")}
                    />
                    {![ApplicantStatus.CERTIFIED, ApplicantStatus.PROFESSIONAL, ApplicantStatus.CERTIFIED_TECH].includes(user.status) && (
                      <div className="absolute inset-0 flex items-center justify-center flex-col p-8 text-center rounded-3xl">
                         <Clock size={32} className="text-slate-400 mb-2 opacity-50" />
                         <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Awaiting Title</p>
                      </div>
                    )}
                 </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-50">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ID: {user.pTechNumber || user.gtNumber || user.qtNumber || 'PENDING'}</p>
              </div>
           </div>
        </div>
      </div>
      {/* ID Card Modal */}
      {showIdModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white p-10 rounded-[3rem] shadow-2xl max-w-sm w-full relative animate-in zoom-in-95 duration-300 text-center overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-2 bg-blue-600" />
             <button 
               onClick={() => setShowIdModal(false)}
               className="absolute top-6 right-6 w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all"
             >
               <X className="w-5 h-5" />
             </button>

             <div className="mb-8">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Shield size={32} />
                </div>
                <h3 className="text-xl font-black text-slate-900 font-display italic uppercase tracking-tight">Identity Terminal</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Official Registry Listing</p>
             </div>

             <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 mb-8 flex justify-center">
                <QRCodeSVG 
                  value={user.status === ApplicantStatus.CERTIFIED ? `https://ais-ver-6789.verify.mbot.com/id/${user.icPassport}` : `https://ais-reg-6789.registry.mbot.com/preaudit/${user.id}`} 
                  size={160} 
                />
             </div>

             <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Registry ID</span>
                   <span className="text-[10px] font-black text-slate-900">{user.pTechNumber || user.gtNumber || user.qtNumber || 'PENDING'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</span>
                   <span className="text-[10px] font-black text-blue-600 uppercase italic tracking-tight">{user.status}</span>
                </div>
             </div>

             <button 
               onClick={() => window.print()}
               className="w-full py-5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-slate-800 transition active:scale-95 flex items-center justify-center gap-3"
             >
                <Download size={14} /> Download Image
             </button>
          </div>
        </div>
      )}
    </div>
  );
}
