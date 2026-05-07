import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Edit2, CheckCircle, HelpCircle, Filter, X, Save, AlertCircle } from 'lucide-react';
import { getQuestions, saveQuestions } from '../../lib/storage';
import { Question, AssessmentType } from '../../types';
import { cn } from '../../lib/utils';

const CATEGORIES = ['Act 768', 'OSHA', 'Ethics', 'Industry 4.0', 'General'];

export default function QuestionBank() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [activeTab, setActiveTab] = useState<AssessmentType>(AssessmentType.PROFESSIONAL_TECHNOLOGIST);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const notify = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const loadQuestions = () => {
    const all = getQuestions();
    const migrated = all.map(q => ({
      ...q,
      target: q.target || AssessmentType.PROFESSIONAL_TECHNOLOGIST
    }));
    setQuestions(migrated);
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  const resetToDefaults = () => {
    if (confirm("SYSTEM ACTION: Are you sure you want to synchronize the Knowledge Vault with the latest MBOT Official Defaults? This will reset all current modifications.")) {
      localStorage.removeItem('mbot_questions');
      loadQuestions();
      alert("Registry synchronized with latest official questions.");
    }
  };

  const [newQ, setNewQ] = useState<Omit<Question, 'id'>>({
    text: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    category: 'General',
    difficulty: 'Medium',
    target: AssessmentType.PROFESSIONAL_TECHNOLOGIST
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId) {
      setQuestions(prev => {
        const updated = prev.map(q => q.id === editingId ? { ...newQ, id: editingId } : q);
        saveQuestions(updated);
        return updated;
      });
      setEditingId(null);
      notify("REGISTRY UPDATED: Question successfully modified and redeployed.");
    } else {
      const question: Question = {
        ...newQ,
        id: `manual-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      };
      
      setQuestions(prev => {
        const updated = [...prev, question];
        saveQuestions(updated);
        return updated;
      });
      notify("QUESTION COMMITTED: New record successfully integrated into Knowledge Vault.");
    }
    
    setShowAdd(false);
    
    setNewQ({
      text: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      category: 'General',
      difficulty: 'Medium',
      target: activeTab
    });
  };

  const startEdit = (q: Question) => {
    setEditingId(q.id);
    setNewQ({
      text: q.text,
      options: [...q.options],
      correctAnswer: q.correctAnswer,
      category: q.category,
      difficulty: q.difficulty,
      target: q.target || AssessmentType.PROFESSIONAL_TECHNOLOGIST
    });
    setShowAdd(true);
  };

  const deleteQuestion = (id: string) => {
    setQuestions(prev => {
      const updated = prev.filter(q => q.id !== id);
      saveQuestions(updated);
      notify("REGISTRY UPDATE: Question successfully purged and changes committed.");
      return updated;
    });
    setDeletingId(null);
  };

  const filtered = questions.filter(q => {
    const matchesSearch = q.text.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || q.category === filterCategory;
    const matchesTarget = q.target === activeTab;
    return matchesSearch && matchesCategory && matchesTarget;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <h1 className="text-2xl font-bold text-slate-900 font-display uppercase tracking-tight">Question Bank</h1>
           <p className="text-slate-500 text-sm font-medium">Manage assessment questions and knowledge repository.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={resetToDefaults}
            className="flex items-center gap-3 bg-white border border-slate-200 text-slate-400 px-6 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm hover:text-blue-600 hover:border-blue-100 transition-all active:scale-95"
          >
            <AlertCircle size={16} /> Sync Vault
          </button>
          <button 
            onClick={() => {
              setNewQ(prev => ({ ...prev, target: activeTab }));
              setShowAdd(true);
            }}
            className="flex items-center gap-3 bg-slate-900 text-white px-6 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all active:scale-95"
          >
            <Plus size={16} /> Insert New Question
          </button>
        </div>
      </div>

      <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit">
        <button 
          onClick={() => setActiveTab(AssessmentType.PROFESSIONAL_TECHNOLOGIST)}
          className={cn(
            "px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
            activeTab === AssessmentType.PROFESSIONAL_TECHNOLOGIST ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
          )}
        >
          Ts. Assessment (GT)
        </button>
        <button 
          onClick={() => setActiveTab(AssessmentType.CERTIFIED_TECHNICIAN)}
          className={cn(
            "px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
            activeTab === AssessmentType.CERTIFIED_TECHNICIAN ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
          )}
        >
          Tc. Assessment (QT)
        </button>
      </div>

      {statusMsg && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top duration-500">
           <div className="bg-slate-900 border border-slate-800 text-white px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-4">
              <CheckCircle size={18} className="text-green-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">{statusMsg}</span>
           </div>
        </div>
      )}

      <div className="bg-white rounded-3xl p-3 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
           <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
           <input 
             type="text" 
             placeholder="Search by keyword or act section..." 
             value={searchTerm}
             onChange={e => setSearchTerm(e.target.value)}
             className="w-full pl-16 pr-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/10 outline-none text-xs font-semibold tracking-wider transition-all placeholder:text-slate-300"
           />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto px-4">
           <Filter size={16} className="text-slate-400" />
           <select 
             value={filterCategory}
             onChange={e => setFilterCategory(e.target.value)}
             className="bg-transparent border-none text-xs font-bold uppercase tracking-wider outline-none text-slate-600 cursor-pointer"
           >
              <option value="All">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
           </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {filtered.map((q, idx) => (
           <div key={q.id} className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group flex flex-col">
              <div className="flex justify-between items-start mb-6">
                 <div className="flex gap-2">
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase rounded-lg tracking-wider">{q.category}</span>
                    <span className={cn(
                      "px-3 py-1 text-[10px] font-bold uppercase rounded-lg tracking-wider",
                      q.difficulty === 'Easy' ? "bg-green-50 text-green-600" :
                      q.difficulty === 'Medium' ? "bg-orange-50 text-orange-600" : "bg-red-50 text-red-600"
                    )}>{q.difficulty}</span>
                 </div>
                 <div className="flex gap-2 relative z-20">
                    {deletingId === q.id ? (
                      <div className="flex gap-2 animate-in fade-in zoom-in duration-300">
                        <button 
                          onClick={() => deleteQuestion(q.id)}
                          className="px-4 py-2 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-red-200 hover:bg-red-700 active:scale-95 transition-all"
                        >
                          Confirm Purge
                        </button>
                        <button 
                          onClick={() => setDeletingId(null)}
                          className="px-4 py-2 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-200 active:scale-95 transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <button 
                          onClick={() => startEdit(q)}
                          className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all active:scale-90 bg-white border border-slate-100 hover:border-blue-100 shadow-sm"
                          title="Edit Question"
                        >
                           <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => setDeletingId(q.id)}
                          className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-90 bg-white border border-slate-100 hover:border-red-100 shadow-sm"
                          title="Purge Question"
                        >
                           <Trash2 size={18} />
                        </button>
                      </>
                    )}
                 </div>
              </div>
              <h3 className="font-bold text-slate-900 mb-6 leading-relaxed font-display text-lg flex-1 truncate-multiple">
                <span className="text-blue-200 mr-2 text-2xl">“</span>
                {q.text}
              </h3>
              <div className="space-y-3">
                 {q.options.map((opt, oIdx) => (
                   <div key={oIdx} className={cn(
                     "flex items-center gap-4 p-4 rounded-2xl text-xs font-bold border transition-all",
                     q.correctAnswer === oIdx ? "bg-green-50 border-green-200 text-green-700 shadow-sm" : "bg-slate-50 border-slate-100 text-slate-500"
                   )}>
                      <div className={cn(
                        "w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold",
                        q.correctAnswer === oIdx ? "bg-green-600 text-white" : "bg-slate-200 text-slate-400"
                      )}>
                        {String.fromCharCode(65 + oIdx)}
                      </div>
                      <span className="flex-1 truncate">{opt}</span>
                      {q.correctAnswer === oIdx && <CheckCircle size={16} className="text-green-600 shrink-0" />}
                   </div>
                 ))}
              </div>
           </div>
         ))}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
             <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                <div>
                   <h3 className="text-2xl font-black text-slate-900 font-display uppercase tracking-tight flex items-center gap-3">
                      <HelpCircle className="text-blue-600" size={28} />
                      Knowledge Question
                   </h3>
                   <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Registry Data Collection Terminal</p>
                </div>
                <button 
                  onClick={() => {
                    setShowAdd(false);
                    setEditingId(null);
                  }}
                  className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-900 shadow-sm border border-slate-100 transition-all hover:rotate-90"
                >
                  <X size={20} />
                </button>
             </div>
             
             <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Content Terminal</label>
                   <textarea 
                     required 
                     rows={3}
                     className="w-full p-8 bg-slate-50 border-none rounded-[2rem] outline-none focus:ring-2 focus:ring-blue-500/20 text-sm transition-all font-bold placeholder:text-slate-300"
                     value={newQ.text}
                     onChange={e => setNewQ({...newQ, text: e.target.value})}
                     placeholder="Enter complex assessment criteria or technical scenario..."
                   />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Category Section</label>
                      <select 
                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 text-[10px] font-black uppercase tracking-widest appearance-none cursor-pointer"
                        value={newQ.category}
                        onChange={e => setNewQ({...newQ, category: e.target.value as any})}
                      >
                         {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                   </div>
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Difficulty Level</label>
                      <select 
                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 text-[10px] font-black uppercase tracking-widest appearance-none cursor-pointer"
                        value={newQ.difficulty}
                        onChange={e => setNewQ({...newQ, difficulty: e.target.value as any})}
                      >
                         <option value="Easy">Routine Mastery (Easy)</option>
                         <option value="Medium">Standard Technical (Medium)</option>
                         <option value="Hard">Advanced Compliance (Hard)</option>
                      </select>
                   </div>
                </div>

                <div className="space-y-4">
                   <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-2 ml-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-display">Response Matrix (A-D)</label>
                        <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Provide exactly 4 distinct options</p>
                      </div>
                      <div className="bg-amber-50 px-4 py-2 rounded-xl border border-amber-100 flex items-center gap-2">
                         <AlertCircle size={12} className="text-amber-500" />
                         <span className="text-[9px] font-black text-amber-700 uppercase tracking-tight">IMPORTANT: Click the A, B, C, D buttons to mark the CORRECT answer before saving.</span>
                      </div>
                   </div>
                   <div className="grid gap-4">
                      {newQ.options.map((opt, idx) => (
                        <div key={idx} className="flex gap-4 items-center group">
                           <button
                             type="button"
                             onClick={() => setNewQ({...newQ, correctAnswer: idx})}
                             className={cn(
                               "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all",
                               newQ.correctAnswer === idx ? "bg-green-600 text-white shadow-lg" : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                             )}
                           >
                              {newQ.correctAnswer === idx ? <CheckCircle size={20} /> : <span className="text-xs font-black">{String.fromCharCode(65 + idx)}</span>}
                           </button>
                           <input 
                             required
                             type="text"
                             className="flex-1 px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 text-xs font-bold transition-all"
                             placeholder={`Enter response variable ${String.fromCharCode(65 + idx)}`}
                             value={opt}
                             onChange={e => {
                               const ops = [...newQ.options];
                               ops[idx] = e.target.value;
                               setNewQ({...newQ, options: ops});
                             }}
                           />
                        </div>
                      ))}
                   </div>
                </div>

                <div className="pt-6">
                  <button type="submit" className="w-full py-6 bg-slate-900 text-white text-[11px] font-black uppercase tracking-[0.3em] rounded-[2rem] hover:bg-slate-800 transition shadow-2xl flex items-center justify-center gap-3 active:scale-95">
                    <Save size={18} /> {editingId ? "Update Registry Record" : "Commit to Registry"}
                  </button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
