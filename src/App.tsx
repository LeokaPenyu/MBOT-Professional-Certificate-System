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
            <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
              <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="text-center space-y-2">
                  <div className="mx-auto w-16 h-16 bg-blue-700 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
                    <Award className="text-white w-10 h-10" />
                  </div>
                  <h1 className="text-3xl font-bold text-slate-900 pt-4 font-display tracking-tight">MBOT CMS</h1>
                  <p className="text-slate-500 text-sm">Professional Certificate Management</p>
                </div>
                
                <div className="grid gap-4">
                  <Link 
                    to="/login?type=applicant"
                    className="w-full flex items-center justify-center gap-3 p-5 bg-white border-2 border-slate-100 rounded-2xl hover:border-blue-700 hover:bg-blue-50 transition-all group shadow-sm bg-slate-50/50"
                  >
                    <UserCircle className="w-8 h-8 text-slate-300 group-hover:text-blue-700 transition-colors" />
                    <div className="text-left">
                      <p className="font-bold text-slate-900 leading-none">Applicant Access</p>
                      <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-bold">Certification & CPD</p>
                    </div>
                  </Link>

                  <Link 
                    to="/login?type=secretariat"
                    className="w-full flex items-center justify-center gap-3 p-5 bg-white border-2 border-slate-100 rounded-2xl hover:border-indigo-950 hover:bg-indigo-50 transition-all group shadow-sm bg-slate-50/50"
                  >
                    <Settings className="w-8 h-8 text-slate-300 group-hover:text-indigo-950 transition-colors" />
                    <div className="text-left">
                      <p className="font-bold text-slate-900 leading-none">Secretariat Portal</p>
                      <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-bold">Administration & Review</p>
                    </div>
                  </Link>

                  <div className="pt-4 grid grid-cols-2 gap-4 border-t border-slate-50">
                    <Link 
                      to="/register"
                      className="text-center text-[10px] font-black text-blue-700 hover:underline uppercase tracking-widest py-2"
                    >
                      New Application
                    </Link>
                    <Link 
                      to="/register?type=secretariat"
                      className="text-center text-[10px] font-black text-slate-400 hover:underline uppercase tracking-widest py-2 border-l border-slate-100"
                    >
                      Staff Onboarding
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          } />
        ) : (
          <Route path="*" element={
            <div className="flex bg-slate-50 text-slate-900 font-sans h-screen overflow-hidden">
              {/* Sidebar Navigation */}
              <aside className="w-64 bg-slate-900 flex flex-col shrink-0">
                <div className="p-8 flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-700 rounded-xl flex items-center justify-center font-black text-white shadow-lg shadow-blue-500/20">M</div>
                  <span className="text-white font-bold tracking-tight text-xl font-display">MBOT</span>
                </div>

                <div className="px-4 py-2 flex flex-col h-full">
                  <div className="mb-8 px-4">
                    <div className="h-px bg-slate-800 w-full" />
                  </div>

                  <nav className="space-y-1">
                    {role === UserRole.APPLICANT ? (
                      <>
                        <NavItem to="/" icon={<LayoutDashboard />} label="Dashboard" />
                        <NavItem to="/assessment" icon={<CheckCircle />} label="Assessments" />
                        <NavItem to="/cpd" icon={<BookOpen />} label="CPD Matrix" />
                      </>
                    ) : role === UserRole.ASSESSOR ? (
                      <>
                        <NavItem to="/assessor" icon={<LayoutDashboard />} label="Evaluation Terminal" />
                      </>
                    ) : (
                      <>
                        <NavItem to="/admin" icon={<LayoutDashboard />} label="Control Center" />
                        <NavItem to="/admin/applicants" icon={<Users />} label="Member Registry" />
                        <NavItem to="/admin/applications" icon={<FileText />} label="Verification Queue" />
                        <NavItem to="/admin/cpd" icon={<ShieldCheck />} label="CPD Audit Queue" />
                        <NavItem to="/admin/reports" icon={<TrendingUp />} label="Intel & Reports" />
                        <NavItem to="/admin/questions" icon={<BookOpen />} label="Knowledge Vault" />
                      </>
                    )}
                  </nav>

                  <div className="mt-auto pt-4 mb-4 border-t border-slate-800">
                    <Link to="/profile" className="bg-slate-800/50 p-4 rounded-3xl border border-slate-800 hover:bg-slate-800 transition-all block group">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-white text-xs uppercase overflow-hidden border border-slate-600">
                          {user?.profilePicture ? (
                            <img src={user.profilePicture} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            user ? user.fullName.charAt(0) : 'S'
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white leading-tight truncate group-hover:text-blue-400 transition-colors">
                            {user ? user.fullName : 'MBOT STAFF'}
                          </p>
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mt-0.5">
                            {role === UserRole.SECRETARIAT ? 'GOV AUTHORITY' : 'TECHNOLOGIST'}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          handleLogout();
                        }}
                        className="w-full py-2.5 text-[10px] font-bold text-slate-400 border border-slate-700/50 rounded-xl hover:bg-red-500 hover:text-white hover:border-red-500 transition-all uppercase tracking-wider"
                      >
                        Terminate Session
                      </button>
                    </Link>
                  </div>
                </div>
              </aside>

              {/* Main Content Area */}
              <main className="flex-1 flex flex-col bg-slate-50 min-w-0 h-screen overflow-hidden relative">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 blur-[100px] -mr-48 -mt-48 pointer-events-none"></div>
                
                {/* Header */}
                {!isCroppingGlobal && (
                  <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 px-10 flex items-center justify-between shrink-0 sticky top-0 z-20">
                    <div>
                      <h1 className="text-xl font-bold text-slate-800 font-display">
                        {role === UserRole.SECRETARIAT ? 'Registry Oversight' : 'Personal Terminal'}
                      </h1>
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                        {new Date().toLocaleDateString('en-MY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="relative group hidden lg:block">
                        <Search size={14} className="text-slate-300 absolute left-5 top-1/2 -translate-y-1/2 group-hover:text-blue-500 transition-colors" />
                        <input 
                          type="text" 
                          placeholder="Search system..." 
                          className="bg-slate-50 border-none rounded-2xl py-2.5 pl-12 pr-6 text-xs font-bold w-64 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-300 tracking-wider"
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
                            "w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 transition-all",
                            showNotifications ? "bg-blue-50 text-blue-600" : "group-hover:text-blue-600 group-hover:bg-blue-50"
                          )}>
                            <Bell size={20} />
                          </div>
                          {(user?.notifications?.filter(n => !n.read).length || 0) > 0 && (
                            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-blue-600 rounded-full border-2 border-white ring-4 ring-blue-600/10 scale-100 group-hover:scale-110 transition-transform"></span>
                          )}
                        </button>
  
                        {showNotifications && (
                          <div className="absolute right-0 mt-4 w-80 bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-4">
                            <div className="p-6 bg-slate-900 flex justify-between items-center">
                              <h3 className="text-white font-black uppercase tracking-widest text-[10px]">Registry Alerts</h3>
                              <span className="text-[9px] font-bold text-blue-400">{user?.notifications?.filter(n => !n.read).length || 0} New</span>
                            </div>
                            <div className="max-h-[400px] overflow-y-auto">
                              {!user?.notifications || user.notifications.length === 0 ? (
                                <div className="p-10 text-center">
                                  <Bell className="mx-auto text-slate-100 mb-4" size={32} />
                                  <p className="text-[10px] font-black uppercase text-slate-400">All sets clear</p>
                                </div>
                              ) : (
                                user.notifications.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(n => (
                                  <div 
                                    key={n.id} 
                                    onClick={() => markNotificationRead(n.id)}
                                    className={cn(
                                      "p-5 border-b border-slate-50 transition-colors hover:bg-slate-50 cursor-pointer",
                                      !n.read && "bg-blue-50/30"
                                    )}
                                  >
                                    <div className="flex justify-between items-start mb-1">
                                      <p className={cn("text-[11px] font-black uppercase tracking-tight", !n.read ? "text-blue-600" : "text-slate-900")}>
                                        {n.title}
                                      </p>
                                      <span className="text-[8px] font-black text-slate-400">{new Date(n.date).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{n.message}</p>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <Link to="/profile" className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shadow-sm hover:ring-2 hover:ring-blue-500/20 transition-all">
                        {user?.profilePicture ? (
                          <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <UserCircle className="text-slate-400" size={24} />
                        )}
                      </Link>
                    </div>
                  </header>
                )}

                {/* Page Content */}
                <div className="flex-1 overflow-y-auto p-10 custom-scrollbar scroll-smooth">
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
                <footer className="h-12 bg-white border-t border-slate-50 px-10 flex items-center justify-between shrink-0 text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                  <div className="flex gap-10">
                    <span className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                       System: Authenticated
                    </span>
                    <span>Node: MY-KUL-SEC-01</span>
                    <span>Terminal Hash: 0xFCA{Math.floor(Math.random() * 999)}</span>
                  </div>
                  <span>MBOT CMS PRO v2.4.0 • CLOUD RUN</span>
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
        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm",
        isActive 
          ? "bg-slate-800 text-white shadow-sm" 
          : "text-slate-400 hover:text-white hover:bg-slate-800"
      )}
    >
      {React.cloneElement(icon as React.ReactElement, { size: 18 })}
      <span>{label}</span>
    </Link>
  );
}

