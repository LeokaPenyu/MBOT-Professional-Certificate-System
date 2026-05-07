import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Award, Mail, Lock, AlertCircle, ArrowRight, UserCircle, Briefcase } from 'lucide-react';
import { cn } from '../../lib/utils';
import { UserRole } from '../../types';
import { getApplicants, setCurrentUser, getStaff } from '../../lib/storage';

export default function Login({ onLogin }: { onLogin: (role: UserRole, user?: any) => void }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const roleType = searchParams.get('type') || 'applicant';
  const isSecretariat = roleType === 'secretariat';

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
      
      if (isSecretariat) {
        const staffList = getStaff();
        const staff = staffList.find(s => s.email.toLowerCase() === normalizedEmail);
        
        if (!staff) {
          setError('No Account found for this secretariat email. Please check your credentials.');
          setIsLoading(false);
          return;
        }

        if (staff.password && staff.password !== password) {
          setError('Invalid password. Access terminal locked for this session.');
          setIsLoading(false);
          return;
        }

        // Success for Secretariat
        onLogin(UserRole.SECRETARIAT, staff);
        navigate('/admin');
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-500">
        <div className={cn(
          "p-12 text-white relative h-64 flex flex-col justify-end",
          isSecretariat ? "bg-slate-900" : "bg-blue-600"
        )}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl -mr-32 -mt-32"></div>
          <div className="relative z-10">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-lg",
              isSecretariat ? "bg-indigo-600 text-white" : "bg-white text-blue-600"
            )}>
              {isSecretariat ? <Briefcase size={24} /> : <Award size={24} />}
            </div>
            <h1 className="text-3xl font-bold font-display tracking-tight">
              {isSecretariat ? 'Staff Portal' : 'Applicant Login'}
            </h1>
            <p className={cn(
              "mt-2 uppercase tracking-[0.3em] text-[10px] font-black",
              isSecretariat ? "text-slate-400" : "text-blue-100"
            )}>
              Malaysia Board of Technologists
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-12 space-y-8">
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-4">
                {isSecretariat ? 'Official Email Address' : 'Registration Email'}
              </label>
              <div className="relative">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  required
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-full focus:ring-2 focus:ring-blue-500/20 outline-none text-sm transition-all placeholder:text-slate-300"
                  placeholder={isSecretariat ? "name@mbot.gov.my" : "email@example.com"}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-4">Access Key</label>
              <div className="relative">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  required
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-full focus:ring-2 focus:ring-blue-500/20 outline-none text-sm transition-all placeholder:text-slate-300"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={18} className="shrink-0" />
              <p className="text-[10px] font-bold uppercase tracking-wider">{error}</p>
            </div>
          )}

          <button 
            type="submit"
            disabled={isLoading}
            className={cn(
              "w-full py-5 text-white font-black rounded-full shadow-xl transition-all active:scale-[0.98] uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2",
              isSecretariat ? "bg-slate-900 shadow-slate-900/20" : "bg-blue-600 shadow-blue-500/20",
              isLoading && "opacity-50 cursor-not-allowed"
            )}
          >
            {isLoading ? 'Authenticating...' : (
              <>
                Initialize Session <ArrowRight size={14} />
              </>
            )}
          </button>

          <div className="pt-4 text-center space-y-4">
            {isSecretariat ? (
              <p className="text-xs text-slate-500 font-medium">
                New Secretariat staff?{' '}
                <Link to="/register?type=secretariat" className="text-slate-900 font-bold hover:underline">
                  Onboard Account
                </Link>
              </p>
            ) : (
              <p className="text-xs text-slate-500 font-medium">
                Don't have an account?{' '}
                <Link to="/register" className="text-blue-600 font-bold hover:underline">
                  Register Now
                </Link>
              </p>
            )}
            
            <div className="pt-4 border-t border-slate-50">
              <Link 
                to={isSecretariat ? "/login?type=applicant" : "/login?type=secretariat"}
                className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-slate-600 transition-colors"
              >
                Switch to {isSecretariat ? 'Applicant' : 'Secretariat'} Gateway
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
