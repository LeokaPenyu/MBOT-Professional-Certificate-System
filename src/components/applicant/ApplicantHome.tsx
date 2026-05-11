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

  if (!user) return <div className="min-h-screen flex items-center justify-center bg-bg-main">
    <div className="flex flex-col items-center gap-4">
      <RefreshCcw className="animate-spin text-brand-primary" size={40} />
      <p className="text-xs font-bold text-text-muted uppercase tracking-widest">Loading profile...</p>
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
          comments: 'Fee paid. Awaiting final approval.'
        });
      }

      if (feeType === 'renewal') {
        updatedUser.renewalDate = new Date(new Date().getFullYear() + 1, new Date().getMonth(), new Date().getDate()).toISOString();
        updatedUser.workflowLog.push({
          stage: 'Renewal Completed',
          date: new Date().toISOString(),
          actor: 'System Finance',
          comments: 'Annual fee RM 200 paid. Membership extended by 1 year.'
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
    { key: ApplicantStatus.REGISTERED, label: 'Registered', description: 'Account setup and initial check', icon: <User size={14} />, status: 'complete' },
    { key: ApplicantStatus.UNDER_REVIEW, label: 'Under Review', description: 'Checking documents', icon: <FileText size={14} />, status: [ApplicantStatus.REGISTERED].includes(user.status) ? 'current' : 'complete' },
    { key: ApplicantStatus.ASSESSMENT_PENDING, label: 'Assessment', description: 'Skill test', icon: <Award size={14} />, status: [ApplicantStatus.UNDER_REVIEW, ApplicantStatus.PROFESSIONAL_PENDING].includes(user.status) ? 'current' : ([ApplicantStatus.ASSESSMENT_PASSED, ApplicantStatus.CERTIFICATE_READY, ApplicantStatus.CERTIFIED, ApplicantStatus.PROFESSIONAL, ApplicantStatus.CERTIFIED_TECH].includes(user.status) ? 'complete' : 'upcoming') },
    { key: ApplicantStatus.CERTIFIED, label: 'Certified', description: 'Getting your professional title', icon: <ShieldCheck size={14} />, status: [ApplicantStatus.CERTIFIED, ApplicantStatus.PROFESSIONAL, ApplicantStatus.CERTIFIED_TECH].includes(user.status) ? 'complete' : ([ApplicantStatus.ASSESSMENT_PASSED, ApplicantStatus.CERTIFICATE_READY].includes(user.status) ? 'current' : 'upcoming') }
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
    const primaryBlue = [2, 132, 199]; // Darker brand primary
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
    <div className="space-y-8 max-w-7xl mx-auto py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-4 md:px-0">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Welcome back, {user.fullName.split(' ')[0]}
          </h1>
          <p className="text-slate-500 text-sm mt-1">Manage your professional credentials and CPD progress.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <select className="appearance-none bg-white border border-gray-200 rounded-[12px] px-6 py-2.5 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-brand-primary/10 outline-none w-full md:w-48 shadow-sm">
              <option>All types</option>
              <option>Professional</option>
              <option>Graduate</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <ChevronRight size={14} className="rotate-90 text-slate-400" />
            </div>
          </div>
          <button 
            onClick={() => navigate('/register')}
            className="flex-1 md:flex-none bg-slate-900 text-white px-6 py-2.5 rounded-[12px] text-sm font-medium hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <BookOpen size={16} /> New application
          </button>
        </div>
      </div>

      {/* Registration Progress Roadmap */}
      <div className="bg-white rounded-[12px] p-8 border border-gray-100 shadow-sm px-4 md:px-8 mx-4 md:mx-0">
        <div className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-brand-primary" />
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Registration Roadmap</h3>
          </div>
          <span className="text-[10px] font-bold text-brand-primary bg-brand-primary/5 px-2.5 py-1 rounded-md uppercase tracking-wider border border-brand-primary/10">
            {steps.filter(s => s.completed).length} of {steps.length} Milestones
          </span>
        </div>
        
        <div className="relative">
          {/* Progress Line */}
          <div className="absolute top-[18px] left-[10%] right-[10%] h-[2px] bg-slate-100 -z-0" />
          <div 
            className="absolute top-[18px] left-[10%] h-[2px] bg-brand-primary -z-0 transition-all duration-1000 shadow-sm" 
            style={{ width: `${Math.max(0, (steps.filter(s => s.completed).length - 1) * 26.6)}%` }}
          />

          <div className="flex justify-between relative z-10 px-2 lg:px-10">
            {steps.map((step, idx) => {
              const isCompleted = step.completed;
              const isCurrent = !isCompleted && (idx === 0 || steps[idx-1]?.completed);
              
              return (
                <div key={idx} className="flex flex-col items-center gap-4">
                  <div className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center border-4 transition-all duration-500",
                    isCompleted 
                      ? "bg-brand-primary border-white text-white shadow-md" 
                      : isCurrent
                        ? "bg-white border-brand-primary text-brand-primary ring-4 ring-brand-primary/10"
                        : "bg-white border-slate-100 text-slate-300"
                  )}>
                    {isCompleted ? <CheckCircle2 size={16} /> : <div className="text-[10px] font-bold">{idx + 1}</div>}
                  </div>
                  <div className="text-center w-20 lg:w-32">
                    <p className={cn(
                      "text-[10px] font-bold uppercase tracking-widest leading-tight transition-colors",
                      isCompleted ? "text-slate-900" : isCurrent ? "text-brand-primary" : "text-slate-400"
                    )}>{step.label}</p>
                    {isCurrent && (
                      <span className="block text-[8px] font-medium text-brand-primary/60 mt-1 uppercase tracking-tighter">Current Stage</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-4 md:px-0">
        {/* Main certificates content */}
        <div className="lg:col-span-8 space-y-6">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight px-2">Certificates</h2>
          
          {/* Certificate Cards */}
          <div className="space-y-6">
            {/* Show GTech Graduate card if exists */}
            {(user.gtNumber || user.status === ApplicantStatus.GRADUATE) && (
              <div className="bg-white rounded-[12px] border border-gray-100 shadow-sm overflow-hidden flex flex-col relative group">
                <div className="h-1 w-full bg-blue-500 absolute top-0 left-0" />
                <div className="p-8">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Graduate Technologist</h3>
                      <p className="text-slate-500 text-sm mt-0.5">{user.field}</p>
                    </div>
                    <div className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-emerald-100">
                      Active
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-y-6 gap-x-12 mb-10">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Registration number</p>
                      <p className="text-sm font-mono font-medium text-slate-700">{user.gtNumber || "GT 24050123"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Expiry date</p>
                      <p className="text-sm font-medium text-slate-700">{new Date(new Date().getFullYear() + 1, 11, 31).toLocaleDateString('en-GB')}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Field / Discipline</p>
                      <p className="text-sm font-medium text-slate-700">{user.field}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Issue date</p>
                      <p className="text-sm font-medium text-slate-700">{new Date(user.registrationDate).toLocaleDateString('en-GB')}</p>
                    </div>
                  </div>

                  {/* CPD Progress Bar */}
                  <div className="pt-8 border-t border-gray-100 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-slate-700">CPD progress {new Date().getFullYear()}</span>
                      <span className="text-xs font-bold text-slate-900">{totalCpdHours} / 30 hrs</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full transition-all duration-1000",
                          totalCpdHours >= 18 ? "bg-emerald-500" : totalCpdHours >= 9 ? "bg-amber-500" : "bg-red-500"
                        )}
                        style={{ width: `${Math.min((totalCpdHours / 30) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                      <Clock size={12} />
                      {30 - totalCpdHours > 0 ? `${30 - totalCpdHours} hours remaining until 31 Dec` : "CPD target achieved for this year"}
                    </div>
                  </div>

                  <div className="mt-10 flex gap-3">
                    <button 
                      onClick={generateCertificate}
                      className="flex-1 py-3 bg-white border border-gray-200 rounded-[8px] text-[10px] font-bold uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                    >
                      <Download size={14} /> Download certificate
                    </button>
                    <button 
                      onClick={() => navigate('/cpd')}
                      className="flex-1 py-3 bg-white border border-gray-200 rounded-[8px] text-[10px] font-bold uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                    >
                      <BookOpen size={14} /> CPD log
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Application Status Timeline for Pending Applications */}
            {user.status === ApplicantStatus.PROFESSIONAL_PENDING && (
              <div className="bg-white rounded-[12px] border border-gray-100 shadow-sm overflow-hidden p-8 relative">
                <div className="h-1 w-full bg-amber-500 absolute top-0 left-0" />
                <div className="flex justify-between items-start mb-10">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Professional Technologist Application</h3>
                    <p className="text-slate-500 text-sm mt-0.5">Application in progress</p>
                  </div>
                  <div className="px-3 py-1.5 bg-amber-50 text-amber-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-amber-100">
                    Pending Review
                  </div>
                </div>

                <div className="relative pl-10 space-y-12 py-4">
                  <div className="absolute left-4 top-4 bottom-4 w-px bg-gray-100" />
                  
                  {/* Step 1 */}
                  <div className="relative">
                    <div className="absolute -left-[27px] top-1.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-4 border-white ring-2 ring-emerald-100" />
                    <div>
                      <p className="text-sm font-bold text-slate-900">Documents submitted</p>
                      <p className="text-xs text-slate-500 mt-1">Verified on 02 May 2026</p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="relative">
                    <div className="absolute -left-[27px] top-1.5 w-3.5 h-3.5 rounded-full bg-amber-500 border-4 border-white ring-2 ring-amber-100 animate-pulse" />
                    <div>
                      <p className="text-sm font-bold text-slate-900">Board assessment</p>
                      <p className="text-xs text-slate-500 mt-1">Under review by secretariat. Estimated completion in 3-5 business days.</p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="relative opacity-40">
                    <div className="absolute -left-[27px] top-1.5 w-3.5 h-3.5 rounded-full bg-gray-200 border-4 border-white" />
                    <div>
                      <p className="text-sm font-bold text-slate-900">Certificate issuance</p>
                      <p className="text-xs text-slate-500 mt-1">Final approval and digitial certificate generation.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Example of an expiring certificate with Renew Button */}
            {user.status === ApplicantStatus.CERTIFIED && (
              <div className="bg-white rounded-[12px] border border-gray-100 shadow-sm overflow-hidden flex flex-col relative group">
                <div className="h-1 w-full bg-[#1D9E75] absolute top-0 left-0" />
                <div className="p-8">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Professional Technologist</h3>
                      <p className="text-slate-500 text-sm mt-0.5">{user.field}</p>
                    </div>
                    <div className="px-3 py-1.5 bg-amber-50 text-amber-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-amber-100 flex items-center gap-2">
                      <AlertCircle size={10} /> Expiring Soon
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-y-6 gap-x-12 mb-10">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Registration number</p>
                      <p className="text-sm font-mono font-medium text-slate-700">{user.pTechNumber || "PT 24050123"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Expiry date</p>
                      <p className="text-sm font-medium text-slate-700">30 June 2026</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Field / Discipline</p>
                      <p className="text-sm font-medium text-slate-700">{user.field}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Issue date</p>
                      <p className="text-sm font-medium text-slate-700">01 Jan 2025</p>
                    </div>
                  </div>

                  {/* CPD Progress Bar - Expiring Case */}
                  <div className="pt-8 border-t border-gray-100 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-slate-700">CPD progress 2026</span>
                      <span className="text-xs font-bold text-slate-900">{totalCpdHours} / 30 hrs</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={cn("h-full bg-red-500")}
                        style={{ width: `${Math.min((totalCpdHours / 30) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-red-600 font-bold">
                      <AlertCircle size={12} />
                      8 hours remaining • Renewal deadline in 48 days
                    </div>
                  </div>

                  <div className="mt-10 flex gap-3">
                    <button 
                      className="flex-1 py-3 bg-red-600 text-white rounded-[8px] text-[10px] font-bold uppercase tracking-widest hover:bg-red-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/10"
                    >
                      Renew now
                    </button>
                    <button 
                      onClick={() => navigate('/cpd')}
                      className="flex-1 py-3 bg-white border border-gray-200 rounded-[8px] text-[10px] font-bold uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                    >
                      <BookOpen size={14} /> CPD log
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Sidebar Elements */}
        <div className="lg:col-span-4 space-y-8">
          {/* Finance Hub */}
          <div className="bg-white rounded-[12px] border border-gray-100 shadow-sm p-8 overflow-hidden group">
            <div className="flex justify-between items-center mb-10">
               <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Finance Hub</h3>
               <CreditCard size={20} className="text-slate-200" />
            </div>

            <div className="space-y-6">
               <div className="space-y-4">
                  {!user.feesPaid?.assessment && (
                    <div className="p-6 bg-slate-50 rounded-[12px] border border-gray-100">
                        <div className="flex justify-between items-start mb-4">
                           <div>
                             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Upcoming Payment</p>
                             <p className="text-sm font-bold text-slate-900">Assessment Fee</p>
                           </div>
                           <p className="text-lg font-bold text-brand-primary">RM 600</p>
                        </div>
                        <button 
                          disabled={isProcessingPayment}
                          onClick={() => handlePayment('assessment', 600)}
                          className="w-full py-2.5 bg-slate-900 text-white rounded-[8px] text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition shadow-sm"
                        >
                           Pay fee
                        </button>
                    </div>
                  )}

                  {user.status === ApplicantStatus.ASSESSMENT_PASSED && !user.feesPaid?.certification && (
                    <div className="p-6 bg-slate-50 rounded-[12px] border border-gray-100">
                        <div className="flex justify-between items-start mb-4">
                           <div>
                             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Certification Fee</p>
                             <p className="text-sm font-bold text-slate-900">Professional Fee</p>
                           </div>
                           <p className="text-lg font-bold text-emerald-600">RM 350</p>
                        </div>
                        <button 
                          disabled={isProcessingPayment}
                          onClick={() => handlePayment('certification', 350)}
                          className="w-full py-2.5 bg-emerald-600 text-white rounded-[8px] text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-700 transition shadow-sm"
                        >
                           Pay fee
                        </button>
                    </div>
                  )}
               </div>
            </div>
          </div>

          {/* Registry Identification */}
          <div className="bg-white rounded-[12px] border border-gray-100 shadow-sm p-8 overflow-hidden group">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">Digital Member ID</h3>
            <div className="flex flex-col items-center">
               <div className="p-6 bg-slate-50 rounded-[12px] border border-gray-100 relative group-hover:scale-[1.02] transition-transform">
                  <QRCodeSVG 
                    value={user.id}
                    size={140}
                    level="H"
                    className={![ApplicantStatus.CERTIFIED, ApplicantStatus.PROFESSIONAL, ApplicantStatus.CERTIFIED_TECH].includes(user.status) ? "opacity-10 grayscale blur-[1px]" : "text-slate-900"}
                  />
                  {![ApplicantStatus.CERTIFIED, ApplicantStatus.PROFESSIONAL, ApplicantStatus.CERTIFIED_TECH].includes(user.status) && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                       <Shield size={32} className="text-slate-300 mb-2" />
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Active after certification</p>
                    </div>
                  )}
               </div>
               <div className="mt-8 text-center">
                  <p className="text-xl font-bold text-slate-900 tracking-tight">{user.pTechNumber || user.gtNumber || 'AUTHENTICATED'}</p>
               </div>
               <button 
                 onClick={() => setShowIdModal(true)}
                 className="mt-8 py-3 w-full bg-slate-50 text-slate-700 rounded-[8px] text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-100 transition-all border border-gray-100"
               >
                  Show ID Card
               </button>
            </div>
          </div>
        </div>
      </div>


      {/* ID Card Modal */}
      {showIdModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full relative shadow-2xl animate-in zoom-in-95 duration-200">
             <button 
               onClick={() => setShowIdModal(false)}
               className="absolute top-6 right-6 w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900"
             >
               <X size={18} />
             </button>

             <div className="mb-8 text-center">
                <div className="w-16 h-16 bg-brand-primary/10 text-brand-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                   <Shield size={32} />
                </div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">ID Card</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">MBOT Digital Identifier</p>
             </div>

             <div className="bg-slate-50 p-6 rounded-3xl mb-8 flex justify-center">
                <QRCodeSVG 
                  value={user.status === ApplicantStatus.CERTIFIED ? `https://ais-ver-6789.verify.mbot.com/id/${user.icPassport}` : `https://ais-reg-6789.registry.mbot.com/preaudit/${user.id}`} 
                  size={160} 
                  level="H"
                />
             </div>

             <div className="space-y-3 mb-8">
                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                   <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Reference</span>
                   <span className="text-[10px] font-black text-slate-900">{user.pTechNumber || user.gtNumber || user.qtNumber || 'PENDING'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                   <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Credential</span>
                   <span className="text-[10px] font-black text-brand-primary uppercase">{user.status}</span>
                </div>
             </div>

             <button 
               onClick={() => window.print()}
               className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition shadow-lg flex items-center justify-center gap-2"
             >
                <Download size={16} /> Save Image
             </button>
          </div>
        </div>
      )}
    </div>
  );
}
