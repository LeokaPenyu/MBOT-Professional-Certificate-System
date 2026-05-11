import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, FileText, CheckCircle2, Clock, Calendar, Download, QrCode, Upload, CreditCard, MessageSquare, ShieldCheck, Mail, Phone, MapPin, User, AlertCircle, RefreshCcw, Eye, Shield, X, ChevronRight, BookOpen } from 'lucide-react';
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
    <div className="space-y-10 max-w-7xl mx-auto py-6 animate-in fade-in slide-in-from-bottom-6 duration-1000 relative">
      {/* Dynamic Background Accents */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-blue-400/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-20 -right-20 w-[500px] h-[500px] bg-indigo-400/5 blur-[150px] rounded-full pointer-events-none"></div>

      {/* Modern Header Section */}
      <div className="relative group overflow-hidden bg-white/40 backdrop-blur-xl border border-white/60 rounded-[3rem] p-10 shadow-2xl shadow-blue-900/5 transition-all duration-500 hover:shadow-blue-900/10 hover:border-white/80">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 blur-[80px] -mr-40 -mt-40 transition-all duration-700 group-hover:bg-blue-500/10"></div>
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-10">
            <div className="relative">
               <div className="absolute -inset-2 bg-blue-500/20 rounded-full blur-xl animate-pulse"></div>
               <ProfilePhotoUploader 
                 currentImage={user.profilePicture}
                 onImageCropped={handlePfpUpdate}
                 initials={user.fullName.charAt(0)}
                 className="w-28 h-28 relative z-10 ring-4 ring-white shadow-xl"
                 disabled={true}
               />
               <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 border-4 border-white rounded-full flex items-center justify-center text-white shadow-lg">
                 <CheckCircle2 size={12} />
               </div>
            </div>
            <div>
              <h1 className="text-4xl font-black text-slate-900 font-display tracking-tight leading-tight">
                Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">{user.fullName.split(' ')[0]}</span>
              </h1>
              <div className="flex flex-wrap items-center gap-4 mt-4">
                <span className="px-5 py-2 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-slate-900/10">
                  {user.status}
                </span>
                <span className="text-slate-400 text-xs font-bold flex items-center gap-2 px-1">
                  <ShieldCheck size={14} className="text-blue-500" />
                  Registry ID: {user.pTechNumber || user.gtNumber || 'AUTHENTICATED'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-4 w-full lg:w-auto">
            {[ApplicantStatus.CERTIFIED, ApplicantStatus.PROFESSIONAL, ApplicantStatus.CERTIFIED_TECH].includes(user.status) && (
              <button 
                onClick={generateCertificate}
                className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-10 py-5 bg-blue-600 text-white rounded-[2rem] shadow-xl shadow-blue-500/20 hover:bg-blue-700 hover:-translate-y-1 transition-all text-sm font-black uppercase tracking-widest active:scale-95"
              >
                <Download size={18} /> DOWNLOAD CERTIFICATE
              </button>
            )}
            <button 
              onClick={() => navigate('/cpd')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-10 py-5 bg-white border border-slate-200 text-slate-900 rounded-[2rem] shadow-sm hover:shadow-xl hover:border-blue-200 transition-all text-sm font-black uppercase tracking-widest active:scale-95"
            >
              <Award size={18} /> Manage CPD
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Track: Progress & Timeline */}
        <div className="lg:col-span-8 space-y-10">
          {/* Enhanced Progress Architecture */}
          <div className="bg-white/60 backdrop-blur-md rounded-[3.5rem] p-10 border border-white/80 shadow-2xl shadow-slate-200/50">
             <div className="flex justify-between items-end mb-12">
                <div>
                   <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-3">Status Pipeline</p>
                   <h2 className="text-3xl font-black text-slate-900 font-display tracking-tighter">Certification Journey</h2>
                </div>
                <div className="text-right">
                   <p className="text-3xl font-black text-slate-900 font-display italic">
                     {steps.filter(s => s.completed).length}/{steps.length}
                   </p>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Milestones</p>
                </div>
             </div>

             <div className="relative pt-12 pb-20">
               {/* Progress Line Background */}
               <div className="absolute top-[72px] left-[5%] w-[90%] h-1 bg-slate-100 rounded-full"></div>
               {/* Active Progress Overlay */}
               <div 
                 className="absolute top-[72px] left-[5%] h-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                 style={{ width: `${(steps.filter(s => s.completed).length - 1) * 33.33 + 5}%` }}
               ></div>

               <div className="flex justify-between relative px-2">
                  {workflowStages.map((stage, idx) => {
                    const isCompleted = steps[idx]?.completed;
                    const isCurrent = !isCompleted && (idx === 0 || steps[idx-1]?.completed);
                    
                    return (
                      <div key={idx} className="flex flex-col items-center relative group">
                        <motion.button 
                           whileHover={{ scale: 1.1 }}
                           whileTap={{ scale: 0.95 }}
                           onClick={() => setActiveStage(stage.key)}
                           className={cn(
                             "w-16 h-16 rounded-3xl flex items-center justify-center border-4 transition-all duration-500 relative z-10",
                             isCompleted 
                               ? "bg-slate-900 border-white text-white shadow-2xl shadow-slate-900/20" 
                               : isCurrent 
                                 ? "bg-white border-blue-600 text-blue-600 shadow-xl shadow-blue-500/10 scale-110" 
                                 : "bg-slate-50 border-slate-100 text-slate-300"
                           )}
                        >
                           {isCompleted ? <ShieldCheck size={24} /> : stage.icon}
                        </motion.button>
                        
                        <div className="absolute top-20 text-center w-32">
                           <p className={cn(
                             "text-[10px] font-black uppercase tracking-widest mb-1",
                             isCompleted || isCurrent ? "text-slate-900" : "text-slate-300"
                           )}>
                              {stage.label}
                           </p>
                           {isCurrent && (
                             <motion.span 
                               initial={{ opacity: 0 }}
                               animate={{ opacity: 1 }}
                               className="text-[8px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full"
                             >
                               ACTIVE
                             </motion.span>
                           )}
                        </div>
                      </div>
                    );
                  })}
               </div>
             </div>

             {activeStage && (
                <motion.div 
                  layoutId="stage-details"
                  className="mt-8 p-10 bg-slate-900 rounded-[3rem] text-white relative shadow-2xl"
                >
                   <button onClick={() => setActiveStage(null)} className="absolute top-8 right-8 text-white/40 hover:text-white transition-colors">
                      <X size={20} />
                   </button>
                   <div className="flex items-center gap-6 mb-8">
                      <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-xl">
                        {workflowStages.find(s => s.key === activeStage)?.icon}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-blue-400 uppercase tracking-[0.3em] mb-1">Module Definition</h4>
                        <p className="text-2xl font-black font-display">{workflowStages.find(s => s.key === activeStage)?.label}</p>
                      </div>
                   </div>
                   <p className="text-sm font-medium text-slate-300 leading-relaxed max-w-xl">
                     {workflowStages.find(s => s.key === activeStage)?.description}. Current infrastructure status indicates synchronization with the Federal Registry is 
                     <span className="text-blue-400 font-black px-1">ACTIVE</span>.
                   </p>
                </motion.div>
             )}
          </div>

          {/* Conditional Action Panels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Assessment Banner Refined */}
            {user.status === ApplicantStatus.ASSESSMENT_PENDING && (
              <div className={cn(
                "p-10 rounded-[3.5rem] flex flex-col justify-between h-full transition-all group",
                user.feesPaid?.assessment 
                  ? "bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-2xl shadow-blue-900/20" 
                  : "bg-white border border-slate-100 shadow-xl"
              )}>
                 <div className="space-y-6">
                    <div className={cn(
                      "w-16 h-16 rounded-3xl flex items-center justify-center transition-transform group-hover:scale-110",
                      user.feesPaid?.assessment ? "bg-white/20 backdrop-blur-xl" : "bg-slate-100 text-slate-400"
                    )}>
                      <Award size={32} />
                    </div>
                    <div>
                      <h3 className={cn("text-2xl font-black font-display tracking-tight", user.feesPaid?.assessment ? "text-white" : "text-slate-900")}>
                        Knowledge Terminal
                      </h3>
                      <p className={cn("text-xs font-medium mt-2 leading-relaxed", user.feesPaid?.assessment ? "text-blue-100" : "text-slate-500")}>
                        {user.feesPaid?.assessment 
                          ? "The technical evaluation platform is available for your session." 
                          : "Administrative fees must be cleared to activate the assessment module."}
                      </p>
                    </div>
                 </div>
                 <div className="mt-10">
                   {user.feesPaid?.assessment ? (
                     <button 
                        onClick={() => navigate('/assessment')}
                        className="w-full py-5 bg-white text-blue-600 rounded-3xl text-xs font-black uppercase tracking-widest transition-all hover:bg-blue-50 shadow-lg active:scale-95"
                     >
                        Enter Evaluation
                     </button>
                   ) : (
                     <button 
                        onClick={() => document.getElementById('payment-section')?.scrollIntoView({ behavior: 'smooth' })}
                        className="w-full py-5 bg-slate-900 text-white rounded-3xl text-xs font-black uppercase tracking-widest transition-all hover:bg-slate-800 shadow-xl active:scale-95 flex items-center justify-center gap-3"
                     >
                        <CreditCard size={16} /> Resolve Dues
                     </button>
                   )}
                 </div>
              </div>
            )}

            {/* Assessment Completed Refined */}
            {[ApplicantStatus.ASSESSMENT_PASSED, ApplicantStatus.CERTIFICATE_READY].includes(user.status) && (
              <div className="p-10 rounded-[3.5rem] bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex flex-col justify-between shadow-2xl shadow-emerald-500/20 group">
                 <div className="space-y-6">
                    <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-xl transition-transform group-hover:scale-110">
                      <CheckCircle2 size={32} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black font-display tracking-tight">Competency Verified</h3>
                      <p className="text-emerald-50 text-xs font-medium mt-2 leading-relaxed">
                        Assessors have validated your technical expertise. Your profile is now awaiting professional title allocation.
                      </p>
                    </div>
                 </div>
                 <div className="mt-10">
                    <div className="w-full py-5 bg-white/20 rounded-3xl text-xs font-black uppercase tracking-widest text-white border border-white/20 text-center flex items-center justify-center gap-3">
                       <ShieldCheck size={16} /> Integrity Check Pass
                    </div>
                 </div>
              </div>
            )}

            {/* CPD Quick Stats card */}
            <div className="p-10 rounded-[3.5rem] bg-white border border-slate-100 shadow-xl flex flex-col justify-between group hover:border-blue-200 transition-all">
               <div className="space-y-6">
                  <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <BookOpen size={30} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 font-display tracking-tight">CPD Ledger</h3>
                    <div className="flex items-end gap-3 mt-4">
                      <p className="text-5xl font-black text-slate-900 font-display">{totalCpdHours}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pb-3">/ 30 HOURS</p>
                    </div>
                  </div>
               </div>
               <div className="mt-10">
                  <button 
                     onClick={() => navigate('/cpd')}
                     className="w-full py-5 bg-slate-50 text-slate-900 rounded-3xl text-xs font-black uppercase tracking-widest transition-all hover:bg-slate-100 flex items-center justify-center gap-3 active:scale-95"
                  >
                     Log Activities <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </button>
               </div>
            </div>
          </div>
        </div>

        {/* Right Section: Sidebar Elements */}
        <div className="lg:col-span-4 space-y-10">
          {/* Finance Hub */}
          <div id="payment-section" className="bg-slate-900 rounded-[3.5rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-slate-900/30">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] -mr-32 -mt-32"></div>
            <div className="flex justify-between items-center mb-10 relative z-10">
               <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Finance Hub</p>
               <CreditCard size={20} className="text-slate-700" />
            </div>

            <div className="space-y-6 relative z-10">
               {/* Custom Dues List */}
               <div className="space-y-3">
                  {!user.feesPaid?.assessment && (
                    <div className="p-6 bg-white/5 border border-white/10 rounded-[2rem] group hover:bg-white/10 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                           <p className="text-xs font-bold uppercase tracking-tight">Assessment Module</p>
                           <p className="text-xl font-black text-blue-400">RM 600</p>
                        </div>
                        <button 
                          disabled={isProcessingPayment}
                          onClick={() => handlePayment('assessment', 600)}
                          className="w-full py-4 bg-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                        >
                           Process Payment
                        </button>
                    </div>
                  )}

                  {user.status === ApplicantStatus.ASSESSMENT_PASSED && !user.feesPaid?.certification && (
                    <div className="p-6 bg-white/5 border border-white/10 rounded-[2rem] group hover:bg-white/10 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                           <p className="text-xs font-bold uppercase tracking-tight">Title Allocation</p>
                           <p className="text-xl font-black text-emerald-400">RM 350</p>
                        </div>
                        <button 
                          disabled={isProcessingPayment}
                          onClick={() => handlePayment('certification', 350)}
                          className="w-full py-4 bg-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-lg active:scale-95"
                        >
                           Settle Record
                        </button>
                    </div>
                  )}

                  {((user.feesPaid?.assessment || false) && (user.status !== ApplicantStatus.ASSESSMENT_PASSED || (user.feesPaid?.certification || false))) && (
                    <div className="p-10 text-center border-2 border-dashed border-white/5 rounded-[2rem]">
                       <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-emerald-500 mx-auto mb-4">
                          <CheckCircle2 size={24} />
                       </div>
                       <p className="text-xs font-bold text-white mb-1 uppercase tracking-widest">ledger balanced</p>
                       <p className="text-[10px] font-medium text-slate-500 italic">No outstanding administrative dues</p>
                    </div>
                  )}
               </div>
            </div>
          </div>

          {/* Registry Identification Metadata */}
          <div className="bg-white rounded-[3.5rem] p-10 border border-slate-100 shadow-xl overflow-hidden group">
            <div className="flex justify-between items-center mb-10">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Registry Identifier</h3>
               <QrCode size={18} className="text-slate-300" />
            </div>

            <div className="flex flex-col items-center">
               <div className="p-10 bg-slate-50 rounded-[3rem] border border-slate-100 relative group-hover:shadow-2xl transition-all duration-700">
                  <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/[0.02] transition-colors rounded-[3rem]"></div>
                  <QRCodeSVG 
                    value={user.id}
                    size={160}
                    level="H"
                    className={cn(
                      "relative z-10 transition-all duration-700",
                      ![ApplicantStatus.CERTIFIED, ApplicantStatus.PROFESSIONAL, ApplicantStatus.CERTIFIED_TECH].includes(user.status) && "opacity-20 grayscale blur-[1px]"
                    )}
                  />
                  {![ApplicantStatus.CERTIFIED, ApplicantStatus.PROFESSIONAL, ApplicantStatus.CERTIFIED_TECH].includes(user.status) && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 z-20">
                       <Clock size={32} className="text-slate-400/50 mb-3" />
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest max-w-[100px]">PENDING FINAL VERIFICATION</p>
                    </div>
                  )}
               </div>

               <div className="mt-10 text-center space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">MBOT Registry Ref</p>
                  <p className="text-2xl font-black text-slate-950 font-display italic tracking-tight">{user.pTechNumber || user.gtNumber || 'UNASSIGNED'}</p>
               </div>

               <button 
                 onClick={() => setShowIdModal(true)}
                 className="w-full mt-10 py-5 bg-slate-900 text-white rounded-[2rem] text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition shadow-xl shadow-slate-900/10 active:scale-95"
               >
                  Generate Digital Card
               </button>
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
