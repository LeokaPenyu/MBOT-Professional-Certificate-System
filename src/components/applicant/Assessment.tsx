import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle2, XCircle, AlertTriangle, ArrowRight, BookOpen, CreditCard, Shield, Award, ShieldCheck } from 'lucide-react';
import { getQuestions, getCurrentUser, saveApplicants, getApplicants, addNotification } from '../../lib/storage';
import { Question, Applicant, ApplicantStatus, AssessmentType } from '../../types';
import { cn } from '../../lib/utils';

export default function Assessment() {
  const navigate = useNavigate();
  const [user, setUser] = useState<Applicant | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);

  const [isStarted, setIsStarted] = useState(false);

  useEffect(() => {
    const u = getCurrentUser();
    setUser(u);
    
    const isTechnician = u?.qtNumber !== undefined;
    const targetType = isTechnician 
       ? AssessmentType.CERTIFIED_TECHNICIAN 
       : AssessmentType.PROFESSIONAL_TECHNOLOGIST;

    const allQuestions = getQuestions();
    const filtered = allQuestions.filter(q => {
      const target = (q as any).target || AssessmentType.PROFESSIONAL_TECHNOLOGIST;
      return target === targetType;
    });
    
    setQuestions(filtered.slice(0, 10));
  }, []);

  useEffect(() => {
    if (!isStarted || isFinished) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isStarted, isFinished]);

  const handleFinish = () => {
    if (isFinished) return;
    
    let correct = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) {
        correct++;
      }
    });

    const percentage = (correct / questions.length) * 100;
    setScore(percentage);
    setIsFinished(true);

    if (user) {
      const passed = percentage >= 70;
      const updatedUser: Applicant = {
        ...user,
        status: passed ? ApplicantStatus.ASSESSMENT_PASSED : ApplicantStatus.ASSESSMENT_FAILED,
        assessments: [...(user.assessments || []), {
          date: new Date().toISOString(),
          score: percentage,
          passed
        }],
        workflowLog: [...(user.workflowLog || []), {
          stage: 'Assessment',
          date: new Date().toISOString(),
          actor: 'System Auto-Audit',
          comments: passed 
            ? `Assessment module passed with a proficiency of ${percentage.toFixed(1)}%. Eligibility for certification confirmed.`
            : `Assessment module failed (${percentage.toFixed(1)}%). Proficiency threshold not met. Re-take eligibility pending payment.`
        }]
      };
      
      // Update feesPaid: assessment becomes false again if failed to force repayment
      if (!passed) {
        updatedUser.feesPaid = { ...user.feesPaid, assessment: false };
      }

      updateUser(updatedUser);

      const isTechnician = user.qtNumber !== undefined;
      const targetTitle = isTechnician ? 'Certified Technician' : 'Professional Technologist';

      addNotification(user.id, {
        title: passed ? "Assessment Passed!" : "Assessment Failed",
        message: passed 
          ? `Congratulations! You scored ${percentage}%. You can now proceed to pay the RM350 application fee for ${targetTitle} status.`
          : `You scored ${percentage}%. Unfortunately, this is below the 70% passing mark. Pay the RM600 re-assessment fee to unlock another attempt.`
      });
    }
  };

  const updateUser = (updated: Applicant) => {
    const applicants = getApplicants().map(a => a.id === updated.id ? updated : a);
    saveApplicants(applicants);
    setUser(updated);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!user) return <div>Loading...</div>;

  if ([ApplicantStatus.ASSESSMENT_PASSED, ApplicantStatus.CERTIFICATE_READY, ApplicantStatus.CERTIFIED, ApplicantStatus.PROFESSIONAL].includes(user.status)) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 mx-auto bg-green-50 text-green-500 rounded-3xl flex items-center justify-center mb-10">
           <CheckCircle2 size={40} />
        </div>
        <h1 className="text-3xl font-bold font-display text-slate-900 mb-4 tracking-tight">Validation Complete</h1>
        <p className="text-slate-500 text-sm font-medium leading-relaxed mb-10">
          Our records indicate that you have already successfully completed the technical competency validation. Further evaluations are not required at this stage.
        </p>
        <button 
          onClick={() => navigate('/')}
          className="px-10 py-4 bg-slate-900 text-white font-bold rounded-full hover:bg-slate-800 transition"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  if (!user.feesPaid?.assessment) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 mx-auto bg-slate-100 rounded-3xl flex items-center justify-center mb-10 text-slate-400">
           <CreditCard size={40} />
        </div>
        <h1 className="text-3xl font-bold font-display text-slate-900 mb-4 tracking-tight">Access Restricted</h1>
        <p className="text-slate-500 text-sm font-medium leading-relaxed mb-10">
          The technical competency evaluation module is currently locked. Applicants are required to settle the assessment fee before the validation registry can be initialized.
        </p>
        <button 
          onClick={() => navigate('/')}
          className="px-10 py-4 bg-slate-900 text-white font-bold rounded-full hover:bg-slate-800 transition shadow-lg shadow-slate-900/10 uppercase tracking-widest text-xs active:scale-95"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  if (!isStarted && !isFinished) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="bg-white rounded-[3rem] p-12 border border-slate-100 shadow-2xl shadow-slate-200/40 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 blur-3xl -mr-32 -mt-32"></div>
           
           <div className="relative z-10">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-8 shadow-xl shadow-blue-200">
                 <Shield size={32} />
              </div>
              <h1 className="text-4xl font-bold text-slate-900 font-display tracking-tight leading-tight mb-4">
                Technical Competence <br /> Validation Module
              </h1>
              <p className="text-slate-500 text-sm font-medium leading-relaxed mb-10 max-w-md">
                You are about to begin the mandatory technical evaluation for MBOT professional registration. This module assesses your understanding of Act 768, Ethics, and Industrial safety standards.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 text-left">
                 <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <Clock className="text-blue-600 mb-3" size={20} />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Time Limit</p>
                    <p className="text-sm font-bold text-slate-900">10 Minutes (600s)</p>
                 </div>
                 <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <Award className="text-blue-600 mb-3" size={20} />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Threshold</p>
                    <p className="text-sm font-bold text-slate-900">70% Minimum Pass</p>
                 </div>
              </div>

              <div className="flex flex-col gap-6">
                 <button 
                   onClick={() => setIsStarted(true)}
                   className="w-full py-6 bg-blue-600 text-white rounded-3xl text-sm font-black uppercase tracking-[0.3em] hover:bg-blue-700 transition shadow-xl shadow-blue-500/20 active:scale-95"
                 >
                    Initialize Assessment
                 </button>
                 <button 
                   onClick={() => navigate('/')}
                   className="w-full py-4 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-slate-600 transition"
                 >
                    Return to Dashboard
                 </button>
              </div>
           </div>
        </div>
      </div>
    );
  }

  const isTechnician = user?.qtNumber !== undefined;
  const assessmentTitle = isTechnician ? 'Qualified Technician Assessment' : 'Professional Technologist Assessment';

  if (isFinished) {
    const passed = score >= 70;
    const isTechnician = user.qtNumber !== undefined;
    const targetTitle = isTechnician ? 'Certified Technician (Tc.)' : 'Professional Technologist (Ts.)';
    
    return (
      <div className="max-w-xl mx-auto py-20 text-center animate-in fade-in zoom-in duration-500">
        <div className={cn(
          "w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-10 shadow-2xl transition-all",
          passed ? "bg-green-500 text-white shadow-green-200" : "bg-red-500 text-white shadow-red-200 animate-shake"
        )}>
          {passed ? <CheckCircle2 size={40} /> : <XCircle size={40} />}
        </div>
        <h1 className="text-4xl font-bold font-display text-slate-900 mb-2 tracking-tight">
          {passed ? "Evaluation Passed" : "Standard Not Met"}
        </h1>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-12">
          Assessment Score: <span className={cn("text-lg ml-2", passed ? "text-green-500" : "text-red-500")}>{score.toFixed(1)}%</span>
        </p>
        
        <div className="bg-white rounded-3xl p-10 border border-slate-100 shadow-xl shadow-slate-100/50 text-left mb-12">
           <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Official Feedback</h3>
           <p className="text-sm text-slate-600 leading-relaxed font-medium">
             {passed 
               ? `The Malaysia Board of Technologists (MBOT) records indicate a successful competency verification. You are now eligible for ${targetTitle} status pending the final administrative fee settlement.`
               : "The current evaluation score is below the minimum proficiency threshold (70%). Strategic review of the MBOT Ethics Framework is recommended before re-attempting the validation process in 30 days."}
           </p>
        </div>

        <div className="flex flex-col gap-4">
           {passed && (
             <button 
               className="px-10 py-4 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 transition shadow-lg shadow-blue-500/20 uppercase tracking-widest text-xs"
               onClick={() => {
                  const updatedUser = { 
                    ...user, 
                    status: ApplicantStatus.CERTIFICATE_READY, 
                    feesPaid: { ...user.feesPaid, certification: true },
                    workflowLog: [...(user.workflowLog || []), {
                      stage: 'Certificate Ready',
                      date: new Date().toISOString(),
                      actor: 'System Finance',
                      comments: 'Certification processing fee RM350 verified.'
                    }]
                  };
                  const applicants = getApplicants().map(a => a.id === user.id ? updatedUser : a);
                  saveApplicants(applicants);
                  alert("Certification fee processed. Status updated to 'Certificate Ready'.");
                 navigate('/');
               }}
             >
               Finalize Certification (RM350)
             </button>
           )}
           <button 
             onClick={() => navigate('/')}
             className="px-10 py-4 bg-slate-100 text-slate-600 font-bold rounded-full hover:bg-slate-200 transition uppercase tracking-widest text-xs"
           >
             Exit Portal
           </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="max-w-4xl mx-auto py-8 animate-in fade-in duration-500">
      {/* Quiz Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
           <h1 className="text-3xl font-bold text-slate-900 font-display tracking-tight">{assessmentTitle}</h1>
           <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-[0.2em]">Malaysian Board of Technologists • Online Validation</p>
        </div>
        <div className={cn(
          "px-8 py-4 rounded-3xl flex items-center gap-4 font-mono font-bold text-xl shadow-lg transition-colors border",
          timeLeft < 300 
            ? "bg-red-500 text-white border-red-400 animate-pulse" 
            : "bg-white text-slate-800 border-slate-100 shadow-slate-200/50"
        )}>
          <Clock size={24} className={timeLeft < 300 ? "text-white" : "text-blue-600"} /> 
          <span className="tabular-nums">{formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-10 px-2">
        <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-3 uppercase tracking-[0.2em]">
          <span>Block {currentIndex + 1} of {questions.length}</span>
          <span>{Math.round(((currentIndex + 1) / questions.length) * 100)}%</span>
        </div>
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-600 transition-all duration-700 ease-out" 
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-[2.5rem] p-12 border border-slate-100 shadow-2xl shadow-slate-200/40 relative overflow-hidden">
        {/* Decor */}
        <div className="absolute -top-12 -right-12 p-8 opacity-[0.05] pointer-events-none rotate-12">
           <BookOpen size={240} />
        </div>

        <div className="space-y-10 relative z-10">
           <div className="flex items-center gap-3">
              <span className="px-4 py-1.5 bg-blue-600 text-white text-[9px] font-black uppercase rounded-full tracking-[0.2em]">
                {currentQuestion?.category}
              </span>
              <span className="px-4 py-1.5 bg-slate-900 text-white text-[9px] font-black uppercase rounded-full tracking-[0.2em]">
                {currentQuestion?.difficulty}
              </span>
           </div>

           <h2 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight font-display">
             {currentQuestion?.text}
           </h2>

           <div className="grid gap-5">
              {currentQuestion?.options.map((option, idx) => (
                <button 
                  key={idx}
                  onClick={() => setAnswers({...answers, [currentQuestion.id]: idx})}
                  className={cn(
                    "w-full text-left p-6 rounded-3xl border-2 transition-all group flex items-center gap-6",
                    answers[currentQuestion.id] === idx 
                      ? "border-blue-600 bg-blue-600 text-white shadow-xl shadow-blue-500/20 translate-x-2" 
                      : "border-slate-50 bg-slate-50 hover:bg-white hover:border-slate-200 hover:shadow-lg hover:shadow-slate-200/20 hover:-translate-y-1"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm transition-colors",
                    answers[currentQuestion.id] === idx 
                      ? "bg-white text-blue-600" 
                      : "bg-white text-slate-400 group-hover:text-slate-600 shadow-sm"
                  )}>
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <span className={cn(
                    "font-bold text-base transition-colors",
                    answers[currentQuestion.id] === idx ? "text-white" : "text-slate-600 group-hover:text-slate-900"
                  )}>{option}</span>
                </button>
              ))}
           </div>

           <div className="flex justify-between items-center pt-6">
              <button 
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex(prev => prev - 1)}
                className="px-8 py-3 text-slate-400 font-bold hover:text-slate-900 disabled:opacity-0 transition-all uppercase tracking-widest text-[10px]"
              >
                Backwards
              </button>
              
              {currentIndex === questions.length - 1 ? (
                <button 
                  onClick={handleFinish}
                  className="px-12 py-4 bg-orange-500 text-white font-bold rounded-full hover:bg-orange-600 shadow-xl shadow-orange-500/20 transition-all active:scale-95 uppercase tracking-widest text-xs"
                >
                  Confirm Submission
                </button>
              ) : (
                <button 
                  onClick={() => setCurrentIndex(prev => prev + 1)}
                  className="px-10 py-4 bg-slate-900 text-white font-bold rounded-full hover:bg-blue-600 flex items-center gap-3 transition-all shadow-xl shadow-slate-900/10 uppercase tracking-widest text-xs"
                >
                  Continue <ArrowRight size={16} />
                </button>
              )}
           </div>
        </div>
      </div>

      <div className="mt-10 flex items-center gap-4 text-slate-400 bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm">
         <AlertTriangle size={24} className="text-orange-400 shrink-0" />
         <p className="text-[10px] font-bold uppercase tracking-widest leading-relaxed">
           Session Integrity Notice: Abandoning this assessment or refreshing the module will result in an automatic score calculation based on current progress.
         </p>
      </div>
    </div>
  );
}
