import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Award, Mail, Lock, AlertCircle, ArrowRight, UserCircle, Briefcase, ChevronLeft } from 'lucide-react';
import { cn } from '../../lib/utils';
import { UserRole } from '../../types';
import { getApplicants, setCurrentUser, getStaff } from '../../lib/storage';

export default function Login({ onLogin }: { onLogin: (role: UserRole, user?: any) => void }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const roleType = searchParams.get('type') || 'applicant';
  const isSecretariat = roleType === 'secretariat';
  const isAssessor = roleType === 'assessor';
  const isStaff = isSecretariat || isAssessor;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Secure authentication sequence
    setTimeout(() => {
      const normalizedEmail = email.trim().toLowerCase();
      
      if (isStaff) {
        const staffList = getStaff();
        const staff = staffList.find(s => s.email.toLowerCase() === normalizedEmail);
        
        if (!staff) {
          setError('No Account found for this authority email. Please check your credentials.');
          setIsLoading(false);
          return;
        }

        if (staff.password && staff.password !== password) {
          setError('Invalid password. Access terminal locked for this session.');
          setIsLoading(false);
          return;
        }

        // Success for Staff
        const finalRole = isAssessor ? UserRole.ASSESSOR : UserRole.SECRETARIAT;
        onLogin(finalRole, staff);
        navigate(isAssessor ? '/assessor' : '/admin');
      } else {
        // Applicant Login
        const applicants = getApplicants();
        const found = applicants.find(a => a.email.toLowerCase() === normalizedEmail);
        
        if (!found) {
          setError('No Account found. Please register first.');
          setIsLoading(false);
          return;
        }

        if (found.password && found.password !== password) {
          setError('Invalid password. Please verify your access key.');
          setIsLoading(false);
          return;
        }
        
        onLogin(UserRole.APPLICANT, found);
        navigate('/');
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-bg-main flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-brand-primary/10 blur-[140px] -translate-x-1/3 -translate-y-1/3"></div>
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-brand-secondary/10 blur-[140px] translate-x-1/3 translate-y-1/3"></div>

      <div className="max-w-md w-full glass-card overflow-hidden animate-in fade-in zoom-in duration-700 relative z-10">
        <button 
          onClick={() => navigate('/')}
          className="absolute top-8 left-8 z-20 w-12 h-12 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center text-white hover:bg-white/30 transition-all border border-white/20 group"
        >
          <ChevronLeft size={22} className="group-hover:-translate-x-1 transition-transform" />
        </button>

        <div className={cn(
          "p-12 text-white relative h-72 flex flex-col justify-end overflow-hidden",
          isSecretariat ? "bg-gradient-to-br from-sky-950 to-bg-surface" : "bg-gradient-to-br from-brand-primary to-brand-secondary"
        )}>
          {/* Animated Glow in Header */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 blur-[80px] -mr-40 -mt-40 animate-pulse"></div>
          
          <div className="relative z-10">
            <div className={cn(
              "w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-8 shadow-2xl backdrop-blur-md border border-white/20",
              isSecretariat ? "bg-white/5 text-white" : "bg-white/10 text-white"
            )}>
              {isSecretariat ? <Briefcase size={32} strokeWidth={2.5} /> : <Award size={32} strokeWidth={2.5} />}
            </div>
            <h1 className="text-4xl font-black font-display tracking-tightest uppercase italic">
              {isSecretariat ? 'SEC_PORTAL' : isAssessor ? 'ASSESS_PORTAL' : 'AUTH_GATEWAY'}
            </h1>
            <div className="flex items-center gap-3 mt-3">
              <div className="w-2 h-2 rounded-full bg-white/50 animate-pulse"></div>
              <p className="uppercase tracking-[0.4em] text-[10px] font-black opacity-60">
                Malaysia Board of Technologists
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-12 space-y-10">
          <div className="space-y-8">
            <div className="space-y-4">
              <label className="text-[11px] font-black text-text-secondary uppercase tracking-[0.2em] ml-2">
                {isSecretariat ? 'AUTHORIZED_EMAIL' : 'REGISTRY_ID_EMAIL'}
              </label>
              <div className="relative group">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand-primary transition-colors" size={20} />
                <input 
                  required
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-16 pr-8 py-5 bg-white border border-brand-primary/10 rounded-2xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/30 outline-none text-sm transition-all placeholder:text-text-muted font-bold tracking-wide text-text-primary"
                  placeholder={isStaff ? "staff@mbot.gov.my" : "user@gmail.com"}
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[11px] font-black text-text-secondary uppercase tracking-[0.2em] ml-2">AUTHENTICATION_KEY</label>
              <div className="relative group">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand-primary transition-colors" size={20} />
                <input 
                  required
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-16 pr-8 py-5 bg-white border border-brand-primary/10 rounded-2xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/30 outline-none text-sm transition-all placeholder:text-text-muted font-bold tracking-wide text-text-primary"
                  placeholder="••••••••••••"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-4 p-5 bg-red-500/10 text-red-500 rounded-2xl border border-red-500/20 animate-in fade-in slide-in-from-top-4">
              <AlertCircle size={22} className="shrink-0" />
              <p className="text-[11px] font-black uppercase tracking-widest leading-relaxed">{error}</p>
            </div>
          )}

          <button 
            type="submit"
            disabled={isLoading}
            className={cn(
              "btn-primary w-full py-6 flex items-center justify-center gap-4 shadow-3xl",
              isLoading && "opacity-50 cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <span className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                VERIFYING...
              </span>
            ) : (
              <>
                Login <ArrowRight size={18} strokeWidth={3} />
              </>
            )}
          </button>

          <div className="pt-6 text-center space-y-6">
            <div className="flex items-center gap-4 py-2 opacity-60">
              <div className="h-px bg-brand-primary/10 flex-1"></div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted">Operational OS</span>
              <div className="h-px bg-brand-primary/10 flex-1"></div>
            </div>

            {isSecretariat ? (
              <p className="text-sm text-text-secondary font-medium">
                New Secretariat staff?{' '}
                <Link to="/register?type=secretariat" className="text-brand-primary font-black hover:text-brand-primary/80 transition-colors">
                  ONBOARD_ACCOUNT
                </Link>
              </p>
            ) : isAssessor ? (
              <p className="text-xs text-red-500 font-bold italic tracking-wider">
                AUTHORITY_LEVEL REQUIRED. SCANNING IP...
              </p>
            ) : (
              <p className="text-sm text-text-secondary font-medium">
                No Digital ID?{' '}
                <Link to="/register" className="text-brand-primary font-black hover:text-brand-primary/80 transition-colors">
                  Create Account
                </Link>
              </p>
            )}
            
            <div className="pt-4 space-y-4">
              <Link 
                to={isStaff ? "/login?type=applicant" : "/login?type=secretariat"}
                className="inline-block p-4 bg-white rounded-2xl border border-brand-primary/10 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] hover:text-brand-primary hover:bg-bg-elevated transition-all"
              >
                Switch to {isStaff ? 'Applicant' : 'Secretariat'} Gateway
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>

  );
}
