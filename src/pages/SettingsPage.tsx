import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../storage/db';
import { Trash2, Edit2, Check, Download, Smartphone } from 'lucide-react';
import Papa from 'papaparse';

export default function SettingsPage() {
  const settings = useLiveQuery(() => db.settings.toCollection().first());
  const allCourses = useLiveQuery(() => db.courses.toArray());
  
  const [editingSemester, setEditingSemester] = useState<string | null>(null);
  const [newSemesterName, setNewSemesterName] = useState('');
  
  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsAppInstalled(true);
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    
    window.addEventListener('beforeinstallprompt', handler);
    
    const appInstalledHandler = () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
    };
    
    window.addEventListener('appinstalled', appInstalledHandler);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', appInstalledHandler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert("当前浏览器不支持直接安装，请使用浏览器菜单中的“添加到主屏幕”。");
      return;
    }
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  if (!settings || !allCourses) return <div className="p-8">Loading...</div>;

  const uniqueSemesters = Array.from(new Set(allCourses.map(c => c.semester).concat(settings.currentSemester).filter(Boolean)));

  const handleSetCurrent = async (semester: string) => {
    await db.settings.update(settings.id!, { currentSemester: semester });
  };

  const handleDateChange = async (semester: string, date: string) => {
    const newDates = { ...settings.semesterStartDates, [semester]: date };
    await db.settings.update(settings.id!, { semesterStartDates: newDates });
  };

  const handleDeleteSemester = async (semester: string) => {
    if (!confirm(`确定删除学期 ${semester} 及其所有课程吗？`)) return;
    await db.courses.where('semester').equals(semester).delete();
    if (settings.currentSemester === semester) {
       const remaining = uniqueSemesters.filter(s => s !== semester);
       await db.settings.update(settings.id!, { currentSemester: remaining[0] || '' });
    }
  };

  const handleRenameSave = async (oldName: string) => {
    if (!newSemesterName.trim() || newSemesterName === oldName) {
       setEditingSemester(null);
       return;
    }
    const courses = await db.courses.where('semester').equals(oldName).toArray();
    
    // Update courses
    const updatedCourses = courses.map(c => ({ ...c, semester: newSemesterName }));
    await db.courses.where('semester').equals(oldName).delete();
    await db.courses.bulkAdd(updatedCourses);

    // Update settings
    let newDates = { ...settings.semesterStartDates };
    if (newDates[oldName]) {
       newDates[newSemesterName] = newDates[oldName];
       delete newDates[oldName];
    }
    
    await db.settings.update(settings.id!, {
       currentSemester: settings.currentSemester === oldName ? newSemesterName : settings.currentSemester,
       semesterStartDates: newDates
    });
    setEditingSemester(null);
  };

  const exportCurrentSemesterCsv = () => {
    const currentCourses = allCourses.filter(c => c.semester === settings.currentSemester);
    const csv = Papa.unparse(currentCourses.map(c => ({
       ...c,
       weeks: JSON.stringify(c.weeks) // Array can't be easily put in CSV directly without quoting, stringify it
    })));
    downloadFile(`courses_${settings.currentSemester}.csv`, csv, 'text/csv');
  };

  const exportAllJson = () => {
    const data = JSON.stringify(allCourses, null, 2);
    downloadFile('all_courses.json', data, 'application/json');
  };

  const downloadFile = (filename: string, content: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-8 pb-24">
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 mb-6">Settings</h1>
      
      <section className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm space-y-6">
         <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2">学期管理</h2>
         
         {uniqueSemesters.length === 0 ? (
            <p className="text-neutral-500 text-sm">暂无学期，请先导入课表。</p>
         ) : (
            <div className="space-y-4">
               {uniqueSemesters.map(sem => {
                  const isCurrent = sem === settings.currentSemester;
                  const isEditing = editingSemester === sem;
                  const startDate = settings.semesterStartDates[sem] || '';
                  
                  return (
                     <div key={sem} className={`p-4 rounded-md border transition-colors ${isCurrent ? 'border-[#2D5A27] bg-[#2D5A27]/5' : 'border-slate-200 bg-slate-50'}`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                           <div className="flex items-center gap-3">
                              {isEditing ? (
                                 <div className="flex items-center gap-2">
                                    <input 
                                       type="text" 
                                       value={newSemesterName}
                                       onChange={e => setNewSemesterName(e.target.value)}
                                       className="border border-slate-300 rounded-md px-2 py-1 text-sm outline-none focus:border-[#2D5A27] font-bold text-slate-900"
                                       autoFocus
                                    />
                                    <button onClick={() => handleRenameSave(sem)} className="p-1.5 text-[#2D5A27] hover:bg-[#2D5A27]/10 rounded-md">
                                       <Check size={18} />
                                    </button>
                                 </div>
                              ) : (
                                 <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-900">{sem}</span>
                                    {isCurrent && <span className="text-[10px] bg-[#2D5A27] text-white px-2 py-0.5 rounded uppercase tracking-widest font-bold">当前学期</span>}
                                    <button onClick={() => { setEditingSemester(sem); setNewSemesterName(sem); }} className="p-1 text-slate-400 hover:text-slate-700 rounded-md">
                                       <Edit2 size={14} />
                                    </button>
                                 </div>
                              )}
                           </div>
                           
                           <div className="flex items-center gap-2 self-start sm:self-auto">
                              {!isCurrent && (
                                 <button onClick={() => handleSetCurrent(sem)} className="text-[10px] font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-md transition-colors uppercase tracking-widest">
                                    设为当前
                                 </button>
                              )}
                              <button onClick={() => handleDeleteSemester(sem)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors">
                                 <Trash2 size={18} />
                              </button>
                           </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white p-3 rounded-md border border-slate-200 shadow-sm">
                           <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest whitespace-nowrap">开学日期</label>
                           <input 
                              type="date" 
                              value={startDate}
                              onChange={(e) => handleDateChange(sem, e.target.value)}
                              className="w-full sm:w-auto flex-1 bg-transparent border border-slate-200 rounded-md px-3 py-1.5 text-sm outline-none focus:border-[#2D5A27] font-bold text-slate-900"
                           />
                           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">（用于自动计算当前第几周）</p>
                        </div>
                     </div>
                  );
               })}
            </div>
         )}
      </section>

      <section className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm space-y-4">
         <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2">数据导出</h2>
         <div className="flex flex-col sm:flex-row gap-3">
            <button 
               onClick={exportCurrentSemesterCsv}
               disabled={!settings.currentSemester}
               className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-50 border border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-xs rounded-md hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
               <Download size={16} />
               导出当前学期 (CSV)
            </button>
            <button 
               onClick={exportAllJson}
               disabled={allCourses.length === 0}
               className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-50 border border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-xs rounded-md hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
               <Download size={16} />
               导出全部数据 (JSON)
            </button>
         </div>
      </section>
      
      <section className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm space-y-4">
         <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2">应用设置</h2>
         <div className="flex flex-col sm:flex-row gap-3">
            <button 
               onClick={handleInstallClick}
               disabled={isAppInstalled}
               className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#2D5A27] text-white font-bold uppercase tracking-wider text-xs rounded-md hover:bg-[#2D5A27]/90 transition-colors disabled:opacity-50 disabled:bg-slate-300 disabled:text-slate-600"
            >
               <Smartphone size={16} />
               {isAppInstalled ? '已安装' : '安装应用'}
            </button>
         </div>
         {!isAppInstalled && !deferredPrompt && (
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center mt-2">
             如遇安装失败，请使用浏览器菜单中的“添加到主屏幕”。
           </p>
         )}
      </section>

      <div className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-8">
        所有数据均保存在您的浏览器本地 (IndexedDB) 中。
      </div>
    </div>
  );
}
