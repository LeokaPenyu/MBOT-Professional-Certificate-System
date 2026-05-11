import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, UserCircle, Award, BookOpen, Settings, LogIn, Users, FileText, Bell, CheckCircle, Clock, ShieldCheck, Search, TrendingUp } from 'lucide-react';
import { UserRole, Applicant, ApplicantStatus } from './types';
import { getCurrentUser, setCurrentUser, getApplicants, getCurrentRole, updateUserProfile } from './lib/storage';
import { cn } from './lib/utils';

// Placeholder components to be implemented
import ApplicantHome from './components/applicant/ApplicantHome';
import Registration from './components/applicant/Registration';
import Assessment from './components/applicant/Assessment';
import CPDTracker from './components/applicant/CPDTracker';
import SecretariatHome from './components/secretariat/SecretariatHome';
import ApplicantList from './components/secretariat/ApplicantList';
import ApplicationQueue from './components/secretariat/ApplicationQueue';
import QuestionBank from './components/secretariat/QuestionBank';
import CPDApproval from './components/secretariat/CPDApproval';
import ReportsDashboard from './components/secretariat/ReportsDashboard';
import AssessorHome from './components/assessor/AssessorHome';
import Login from './components/auth/Login';
import Profile from './components/Profile';

export default function App() {
  const [role, setRole] = useState<UserRole | null>(null);
  const [user, setUser] = useState<Applicant | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isCroppingGlobal, setIsCroppingGlobal] = useState(false);

  useEffect(() => {
    const refreshUser = () => {
      const currentUser = getCurrentUser();
      const currentRole = getCurrentRole();
      if (currentUser && currentRole) {
        setRole(currentRole);
        setUser(currentUser);
      }
    };

    const handleCroppingStatus = (e: any) => {
      setIsCroppingGlobal(e.detail);
    };

    refreshUser();
    window.addEventListener('mbot-user-update', refreshUser);
    window.addEventListener('mbot-cropping-status', handleCroppingStatus);
    return () => {
      window.removeEventListener('mbot-user-update', refreshUser);
      window.removeEventListener('mbot-cropping-status', handleCroppingStatus);
    };
  }, []);

  const handleLogin = (newRole: UserRole, newUser?: any) => {
    if (newUser) {
      setCurrentUser(newUser.id, newRole);
      setUser(newUser);
      setRole(newRole);
    } else if (newRole === UserRole.SECRETARIAT) {
      // Legacy fallback for secretariat without specific user object
      setCurrentUser(null);
      setUser(null);
      setRole(UserRole.SECRETARIAT);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setUser(null);
    setRole(null);
  };

  const markNotificationRead = (id: string) => {
    if (!user) return;
    const updatedNotifications = (user.notifications || []).map(n => n.id === id ? { ...n, read: true } : n);
    updateUserProfile({ ...user, notifications: updatedNotifications });
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/register" element={<Registration />} />
        
        {!role ? (
          <Route path="*" element={
            <div className="min-h-screen bg-bg-main flex items-center justify-center p-4 relative overflow-hidden">
               {/* Background Glows */}
               <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-brand-primary/10 blur-[120px] -translate-x-1/2 -translate-y-1/2"></div>
               <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-brand-secondary/10 blur-[120px] translate-x-1/2 translate-y-1/2"></div>

              <div className="max-w-md w-full glass-card p-10 space-y-10 animate-in fade-in zoom-in duration-700 relative z-10">
                <div className="text-center space-y-4">
                  <div className="mx-auto w-20 h-20 bg-gradient-to-tr from-brand-primary to-brand-secondary rounded-3xl flex items-center justify-center shadow-2xl shadow-brand-primary/40 transform rotate-6 hover:rotate-0 transition-transform duration-500">
                    <Award className="text-white w-12 h-12" />
                  </div>
                  <div className="pt-4">
                    <h1 className="text-4xl font-extrabold text-text-primary font-display tracking-tightest">MBOT CMS</h1>
                    <p className="text-text-secondary text-sm font-medium mt-2">Professional Certificate System</p>
                  </div>
                </div>
                
                <div className="grid gap-5">
                  <Link 
                    to="/login?type=applicant"
                    className="w-full flex items-center justify-between p-6 bg-white border border-brand-primary/10 rounded-2xl hover:bg-white/50 hover:border-brand-primary/50 transition-all group shadow-xl"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center group-hover:bg-brand-primary/20 transition-colors">
                        <UserCircle className="w-7 h-7 text-brand-primary px-px" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-text-primary text-lg leading-none">Applicant Access</p>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full border border-brand-primary/20 flex items-center justify-center group-hover:bg-brand-primary group-hover:border-brand-primary transition-all">
                      <LayoutDashboard className="w-4 h-4 text-brand-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>

                  <Link 
                    to="/login?type=secretariat"
                    className="w-full flex items-center justify-between p-6 bg-white border border-brand-primary/10 rounded-2xl hover:bg-white/50 hover:border-brand-secondary/50 transition-all group shadow-xl"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-xl bg-brand-secondary/10 flex items-center justify-center group-hover:bg-brand-secondary/20 transition-colors">
                        <Settings className="w-7 h-7 text-brand-secondary px-px" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-text-primary text-lg leading-none">Secretariat Portal</p>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full border border-brand-primary/20 flex items-center justify-center group-hover:bg-brand-secondary group-hover:border-brand-secondary transition-all">
                      <LayoutDashboard className="w-4 h-4 text-brand-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>

                  <div className="pt-6 grid grid-cols-2 gap-6 border-t border-white/5">
                    <Link 
                      to="/register"
                      className="text-center text-[11px] font-bold text-brand-primary hover:text-white hover:bg-brand-primary hover:shadow-lg hover:shadow-brand-primary/30 transition-all uppercase tracking-widest py-3 bg-brand-primary/5 rounded-xl border border-brand-primary/10 hover:-translate-y-1 active:scale-95"
                    >
                      Apply Now
                    </Link>
                    <Link 
                      to="/register?type=secretariat"
                      className="text-center text-[11px] font-bold text-text-muted hover:text-white hover:bg-slate-800 hover:shadow-lg transition-all uppercase tracking-widest py-3 bg-white/5 rounded-xl border border-white/10 hover:-translate-y-1 active:scale-95"
                    >
                      Staff Entry
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          } />
        ) : (
          <Route path="*" element={
            <div className="flex bg-bg-main text-text-primary font-sans h-screen overflow-hidden">
              {/* Sidebar Navigation */}
              <aside className="w-72 bg-slate-900 border-r border-brand-primary/10 flex flex-col shrink-0 z-30 text-white overflow-y-auto">
                <div className="p-10 flex items-center gap-4 shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-2xl flex items-center justify-center font-black text-white shadow-xl shadow-brand-primary/20">M</div>
                  <span className="text-white font-extrabold tracking-tight text-2xl font-display uppercase italic">MBOT</span>
                </div>

                <div className="px-6 py-2 flex flex-col h-full min-h-0">
                  <div className="mb-6 px-4">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Main Menu</p>
                    <div className="h-px bg-white/5 w-full" />
                  </div>

                  <nav className="space-y-2">
                    {role === UserRole.APPLICANT ? (
                      <>
                        <NavItem to="/" icon={<LayoutDashboard />} label="Dashboard" />
                        <NavItem to="/assessment" icon={<CheckCircle />} label="Assessments" />
                        <NavItem to="/cpd" icon={<BookOpen />} label="CPD Tracker" />
                      </>
                    ) : role === UserRole.ASSESSOR ? (
                      <>
                        <NavItem to="/assessor" icon={<LayoutDashboard />} label="Assessments" />
                      </>
                    ) : (
                      <>
                        <NavItem to="/admin" icon={<LayoutDashboard />} label="Home" />
                        <NavItem to="/admin/applicants" icon={<Users />} label="Members" />
                        <NavItem to="/admin/applications" icon={<FileText />} label="Queue" />
                        <NavItem to="/admin/cpd" icon={<ShieldCheck />} label="CPD Approval" />
                        <NavItem to="/admin/reports" icon={<TrendingUp />} label="Reports" />
                        <NavItem to="/admin/questions" icon={<BookOpen />} label="Questions" />
                      </>
                    )}
                  </nav>

                  <div className="mt-auto pt-6 mb-8 border-t border-brand-primary/10">
                    <Link to="/profile" className="bg-white/5 p-5 rounded-3xl border border-brand-primary/10 hover:bg-white/10 transition-all block group">
                      <div className="flex items-center gap-4 mb-5">
                        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center font-bold text-slate-900 text-sm uppercase overflow-hidden border border-brand-primary/10 ring-2 ring-transparent group-hover:ring-brand-primary/50 transition-all">
                          {user?.profilePicture ? (
                            <img src={user.profilePicture} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            user ? user.fullName.charAt(0) : 'S'
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-text-primary leading-tight truncate">
                            {user ? user.fullName : 'SYSTEM ADMIN'}
                          </p>
                          <p className="text-[10px] text-brand-primary uppercase tracking-[0.1em] font-black mt-1">
                            {role === UserRole.SECRETARIAT ? 'Staff' : 'Member'}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          handleLogout();
                        }}
                        className="w-full py-3 text-[10px] font-black text-slate-400 border border-brand-primary/10 rounded-xl hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 transition-all uppercase tracking-widest"
                      >
                        Log Out
                      </button>
                    </Link>
                  </div>
                </div>
              </aside>

              {/* Main Content Area */}
              <main className="flex-1 flex flex-col bg-bg-main min-w-0 h-screen overflow-hidden relative border-l border-brand-primary/10">
                {/* Visual Elements */}
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-primary/10 blur-[120px] -mr-96 -mt-96 pointer-events-none rounded-full"></div>
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-brand-secondary/10 blur-[120px] -ml-40 -mb-40 pointer-events-none rounded-full"></div>
                
                {/* Header */}
                {!isCroppingGlobal && (
                  <header className="h-24 glass-panel border-b border-brand-primary/10 px-12 flex items-center justify-between shrink-0 sticky top-0 z-30">
                    <div>
                      <h1 className="text-2xl font-black text-text-primary font-display tracking-tight leading-none uppercase italic">
                        {role === UserRole.SECRETARIAT ? 'Admin Panel' : 'My Dashboard'}
                      </h1>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-2 h-2 rounded-full bg-brand-primary animate-pulse"></div>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">
                          {new Date().toLocaleDateString('en-MY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-10">
                      <div className="relative group hidden xl:block">
                        <Search size={16} className="text-text-muted absolute left-5 top-1/2 -translate-y-1/2 group-focus-within:text-brand-primary transition-colors" />
                        <input 
                          type="text" 
                          placeholder="SEARCH..." 
                          className="bg-white border border-brand-primary/10 rounded-2xl py-3.5 pl-14 pr-8 text-[11px] font-black text-text-primary w-80 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/30 outline-none transition-all placeholder:text-text-muted tracking-widest"
                          onChange={(e) => {
                            window.dispatchEvent(new CustomEvent('mbot-global-search', { detail: e.target.value }));
                          }}
                        />
                      </div>
                      
                      <div className="relative">
                        <button 
                          onClick={() => setShowNotifications(!showNotifications)}
                          className="relative group transition-transform active:scale-95"
                        >
                          <div className={cn(
                            "w-12 h-12 glass-card flex items-center justify-center text-text-secondary transition-all",
                            showNotifications ? "bg-brand-primary/20 text-brand-primary border-brand-primary/30" : "hover:text-white hover:bg-white/5"
                          )}>
                            <Bell size={22} strokeWidth={2.5} />
                          </div>
                          {(user?.notifications?.filter(n => !n.read).length || 0) > 0 && (
                            <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-brand-primary rounded-full border-2 border-bg-main ring-4 ring-brand-primary/10 scale-100 group-hover:scale-110 transition-transform"></span>
                          )}
                        </button>
  
                        {showNotifications && (
                          <div className="absolute right-0 mt-6 w-96 glass-card shadow-3xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-4 scale-100 origin-top-right">
                            <div className="p-8 bg-gradient-to-r from-brand-primary to-brand-secondary flex justify-between items-center">
                              <h3 className="text-white font-black uppercase tracking-[0.2em] text-[11px]">Notifications</h3>
                              <span className="text-[10px] font-black text-white/80 bg-black/20 px-3 py-1 rounded-full uppercase">{user?.notifications?.filter(n => !n.read).length || 0} New</span>
                            </div>
                            <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
                              {!user?.notifications || user.notifications.length === 0 ? (
                                <div className="p-16 text-center">
                                  <Bell className="mx-auto text-white/5 mb-6" size={48} />
                                  <p className="text-[11px] font-black uppercase text-text-muted tracking-[0.2em]">All Systems Nominal</p>
                                </div>
                              ) : (
                                user.notifications.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(n => (
                                  <div 
                                    key={n.id} 
                                    onClick={() => markNotificationRead(n.id)}
                                    className={cn(
                                      "p-6 border-b border-white/5 transition-all hover:bg-white/5 cursor-pointer",
                                      !n.read && "bg-brand-primary/5"
                                    )}
                                  >
                                    <div className="flex justify-between items-start mb-2">
                                      <p className={cn("text-[12px] font-black uppercase tracking-tight", !n.read ? "text-brand-primary" : "text-white")}>
                                        {n.title}
                                      </p>
                                      <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">{new Date(n.date).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-[11px] text-text-secondary font-medium leading-relaxed opacity-80">{n.message}</p>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <Link to="/profile" className="w-12 h-12 rounded-2xl glass-card overflow-hidden flex items-center justify-center hover:ring-2 hover:ring-brand-primary/50 transition-all group">
                        {user?.profilePicture ? (
                          <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                        ) : (
                          <UserCircle className="text-text-muted group-hover:text-brand-primary transition-colors" size={28} />
                        )}
                      </Link>
                    </div>
                  </header>
                )}

                {/* Page Content */}
                <div className="flex-1 overflow-y-auto p-12 custom-scrollbar scroll-smooth">
                  <Routes>
                    {role === UserRole.APPLICANT ? (
                      <>
                        <Route path="/" element={<ApplicantHome />} />
                        <Route path="/upgrade" element={<div className="p-8"><h2 className="text-2xl font-bold">P.Tech Upgrade</h2><p className="text-slate-500">Upgrade module integrated in Dashboard</p></div>} />
                        <Route path="/assessment" element={<Assessment />} />
                        <Route path="/cpd" element={<CPDTracker />} />
                        <Route path="/profile" element={<Profile />} />
                      </>
                    ) : role === UserRole.ASSESSOR ? (
                      <>
                        <Route path="/assessor" element={<AssessorHome />} />
                        <Route path="/profile" element={<Profile />} />
                      </>
                    ) : (
                      <>
                        <Route path="/admin" element={<SecretariatHome />} />
                        <Route path="/admin/applicants" element={<ApplicantList />} />
                        <Route path="/admin/applications" element={<ApplicationQueue />} />
                        <Route path="/admin/cpd" element={<CPDApproval />} />
                        <Route path="/admin/reports" element={<ReportsDashboard />} />
                        <Route path="/admin/questions" element={<QuestionBank />} />
                        <Route path="/profile" element={<Profile />} />
                      </>
                    )}
                    <Route path="*" element={<Navigate to={role === UserRole.APPLICANT ? "/" : role === UserRole.ASSESSOR ? "/assessor" : "/admin"} />} />
                  </Routes>
                </div>

                {/* Bottom Action Bar */}
                <footer className="h-16 glass-panel border-t border-brand-primary/10 px-12 flex items-center justify-between shrink-0 text-[10px] text-text-muted uppercase tracking-[0.2em] font-black">
                  <div className="flex gap-12">
                    <span className="flex items-center gap-2 text-brand-primary">
                       <div className="w-2 h-2 bg-brand-primary rounded-full animate-pulse shadow-[0_0_10px_rgba(14,165,233,0.5)]"></div>
                       SECURE CONNECTION
                    </span>
                    <span className="hidden sm:inline">MBOT CMS 2025</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-text-secondary">v2.1.0</span>
                    <div className="w-1.5 h-1.5 bg-brand-primary/20 rounded-full"></div>
                    <span className="text-brand-primary/40">ONLINE</span>
                  </div>
                </footer>
              </main>
            </div>
          } />
        )}
      </Routes>
    </Router>

  );
}

function NavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));

  return (
    <Link 
      to={to} 
      className={cn(
        "flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold text-sm group",
        isActive 
          ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20 border-l-4 border-brand-primary" 
          : "text-slate-400 hover:text-white hover:bg-white/5"
      )}
    >
      <div className={cn(
        "transition-colors",
        isActive ? "text-white" : "text-slate-400 group-hover:text-white"
      )}>
        {React.cloneElement(icon as React.ReactElement, { size: 20, strokeWidth: isActive ? 2.5 : 2 })}
      </div>
      <span className="tracking-wide">{label}</span>
      {isActive && (
        <div className="ml-auto w-1.5 h-1.5 bg-brand-primary rounded-full shadow-[0_0_8px_rgba(99,102,241,0.8)]"></div>
      )}
    </Link>
  );
}

