import React, { useState, useEffect } from 'react';
import { UserCircle, Camera, Save, Lock, Mail, Phone, MapPin, Award, CheckCircle2, AlertCircle, X, User } from 'lucide-react';
import { getCurrentUser, updateUserProfile, getCurrentRole } from '../lib/storage';
import { Applicant, Staff, UserRole } from '../types';
import { cn } from '../lib/utils';
import ProfilePhotoUploader from './common/ProfilePhotoUploader';

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    const currentRole = getCurrentRole();
    if (currentUser) {
      setUser(currentUser);
      setRole(currentRole);
      setFormData({
        fullName: currentUser.fullName,
        email: currentUser.email,
        phone: currentUser.phone || '',
        password: '',
        confirmPassword: '',
      });
    }
  }, []);

  const handlePfpChange = (dataUrl: string) => {
    handleSavePfp(dataUrl);
  };

  const handleSavePfp = (base64: string) => {
    const updatedUser = { ...user, profilePicture: base64 };
    updateUserProfile(updatedUser);
    setUser(updatedUser);
    setMessage({ type: 'success', text: 'Profile identity portrait updated.' });
    setTimeout(() => {
      setMessage(null);
    }, 3000);
  };

  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password && formData.password !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    const updatedUser = { ...user, fullName: formData.fullName, phone: formData.phone };
    if (formData.password) {
      updatedUser.password = formData.password;
    }

    updateUserProfile(updatedUser);
    setUser(updatedUser);
    setIsEditing(false);
    setMessage({ type: 'success', text: 'Profile information updated successfully.' });
    setTimeout(() => {
      setMessage(null);
      window.location.reload();
    }, 1500);
  };

  if (!user) return <div className="p-8">Loading profile...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-3xl -mr-32 -mt-32"></div>
        
        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
          <ProfilePhotoUploader
            currentImage={user.profilePicture}
            onImageCropped={handlePfpChange}
            initials={user.fullName.charAt(0)}
            className="w-32 h-32"
          />

          <div className="text-center md:text-left space-y-1">
            <h1 className="text-3xl font-bold text-slate-900 font-display italic tracking-tight">{user.fullName}</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{role === UserRole.SECRETARIAT ? 'Secretariat Staff' : 'Professional Candidate'}</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-2">
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <Mail size={14} className="text-blue-500" /> {user.email}
              </div>
              {user.phone && (
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <Phone size={14} className="text-blue-500" /> {user.phone}
                </div>
              )}
            </div>
          </div>

          <button 
            onClick={() => setIsEditing(!isEditing)}
            className="md:ml-auto px-6 py-2.5 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition shadow-lg active:scale-95"
          >
            {isEditing ? 'Cancel Edit' : 'Edit Profile'}
          </button>
        </div>
      </div>

      {message && (
        <div className={cn(
          "p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2",
          message.type === 'success' ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"
        )}>
          {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span className="text-sm font-bold uppercase tracking-wide">{message.text}</span>
        </div>
      )}

      {isEditing && (
        <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-10 pb-4 border-b border-slate-100">
             <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
               <Lock size={14} className="text-blue-500" /> Professional Identity Vault
             </h2>
             <span className="px-4 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100 shadow-sm">
                System Registry Editing
             </span>
          </div>
          
          <form onSubmit={handleSaveInfo} className="space-y-10">
            <div className="grid md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Legal Identity Designator</label>
                <div className="relative">
                   <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                   <input 
                     required
                     type="text" 
                     value={formData.fullName}
                     onChange={e => setFormData({...formData, fullName: e.target.value})}
                     className="w-full pl-16 pr-8 py-5 bg-slate-50/50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:bg-white focus:border-blue-200 outline-none text-sm transition-all font-bold placeholder:text-slate-300"
                     placeholder="Full Legal Name"
                   />
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Communication Line (Phone)</label>
                <div className="relative">
                   <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                   <input 
                     type="text" 
                     value={formData.phone}
                     onChange={e => setFormData({...formData, phone: e.target.value})}
                     className="w-full pl-16 pr-8 py-5 bg-slate-50/50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:bg-white focus:border-blue-200 outline-none text-sm transition-all font-bold placeholder:text-slate-300"
                     placeholder="+60..."
                   />
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-10">
               <div className="p-8 bg-slate-50/80 rounded-[2rem] border border-slate-100/50 backdrop-blur-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Original Registry Input</p>
                  <div className="space-y-4">
                     <div className="flex justify-between items-center py-2 border-b border-slate-100/50">
                        <span className="text-[10px] font-bold text-slate-500">Qualification</span>
                        <span className="text-[10px] font-black text-slate-900 uppercase">{(user as Applicant).qualification || 'N/A'}</span>
                     </div>
                     <div className="flex justify-between items-center py-2 border-b border-slate-100/50">
                        <span className="text-[10px] font-bold text-slate-500">Domain</span>
                        <span className="text-[10px] font-black text-slate-900 uppercase">{(user as Applicant).field || 'N/A'}</span>
                     </div>
                     <p className="text-[9px] text-slate-400 italic mt-2">To modify regulatory data, please contact the Secretariat Registry Office.</p>
                  </div>
               </div>
               
               <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">New Auth Code</label>
                    <input 
                      type="password" 
                      value={formData.password}
                      onChange={e => setFormData({...formData, password: e.target.value})}
                      placeholder="Enter only if changing"
                      className="w-full px-8 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500/10 outline-none text-xs font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Re-type Code</label>
                    <input 
                      type="password" 
                      value={formData.confirmPassword}
                      onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                      className="w-full px-8 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500/10 outline-none text-xs font-bold"
                    />
                  </div>
               </div>
            </div>

            <button 
              type="submit"
              className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.4em] hover:bg-slate-800 shadow-2xl flex items-center justify-center gap-4 transition-all active:scale-[0.98] group"
            >
              <Save size={18} className="group-hover:scale-110 transition-transform" /> Synchronize Remote Records
            </button>
          </form>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-2xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl -mr-16 -mt-16 group-hover:bg-blue-500/20 transition-all"></div>
           <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4 leading-none">Security Statistics</p>
           <div className="space-y-4 relative z-10">
              <div className="flex justify-between items-center py-3 border-b border-white/5">
                 <span className="text-xs text-slate-400 font-bold">2FA Status</span>
                 <span className="text-[10px] font-black text-red-400 uppercase tracking-widest px-2 py-0.5 bg-red-400/10 rounded-full">Inactive</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-white/5">
                 <span className="text-xs text-slate-400 font-bold">Last Login</span>
                 <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">{new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-white/5">
                 <span className="text-xs text-slate-400 font-bold">Terminal IP</span>
                 <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest italic">192.168.1.1</span>
              </div>
           </div>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl flex flex-col items-center justify-center text-center space-y-4">
           <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
              <MapPin size={32} />
           </div>
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Regional Node</p>
              <h3 className="text-lg font-black text-slate-900 font-display italic">Kuala Lumpur, MY</h3>
              <p className="text-xs text-slate-500 mt-2">Verified Professional Endpoint</p>
           </div>
        </div>
      </div>
    </div>
  );
}
