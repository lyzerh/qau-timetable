import React, { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../storage/db';
import { useStore } from '../store/useStore';
import { calculateCurrentWeek, getWeekStartAndEnd } from '../utils/dateUtils';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Search, Plus, MapPin, User, Clock, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Course } from '../models/types';
import { cn } from '../components/Layout';
import CourseEditModal from '../components/CourseEditModal';

const SECTIONS = [
  { id: 1, name: '第1,2节', start: 1, end: 2, time: '08:00 - 09:40' },
  { id: 2, name: '第3,4节', start: 3, end: 4, time: '10:00 - 11:40' },
  { id: 3, name: '第5节', start: 5, end: 5, time: '14:00 - 14:50' },
  { id: 4, name: '第6,7节', start: 6, end: 7, time: '15:00 - 16:40' },
  { id: 5, name: '第8,9节', start: 8, end: 9, time: '17:00 - 18:40' },
  { id: 6, name: '第10,11节', start: 10, end: 11, time: '19:00 - 20:40' },
];

const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const COLORS = [
  'bg-blue-500/10 border-blue-500 text-blue-900',
  'bg-green-600/10 border-green-600 text-green-900',
  'bg-purple-500/10 border-purple-500 text-purple-900',
  'bg-orange-500/10 border-orange-500 text-orange-900',
  'bg-rose-500/10 border-rose-500 text-rose-900',
  'bg-cyan-600/10 border-cyan-600 text-cyan-900',
  'bg-amber-500/10 border-amber-500 text-amber-900',
];

export default function SchedulePage() {
  const navigate = useNavigate();
  const settings = useLiveQuery(() => db.settings.toCollection().first());
  const allCourses = useLiveQuery(() => db.courses.toArray());
  
  const { viewingWeek, setViewingWeek } = useStore();
  const [viewMode, setViewMode] = useState<'week' | 'today' | 'all'>('week');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const today = new Date();
  const todayWeekday = today.getDay() === 0 ? 7 : today.getDay();

  // Calculated properties
  const currentSemester = settings?.currentSemester;
  const startDateStr = currentSemester ? settings?.semesterStartDates?.[currentSemester] : undefined;
  
  const actualCurrentWeek = useMemo(() => {
    return calculateCurrentWeek(today, startDateStr || '');
  }, [startDateStr]); // Removed today from deps to avoid recalculating every render if not needed

  // The week we are actually showing on UI
  const displayWeek = viewingWeek !== null ? viewingWeek : (actualCurrentWeek || 1);

  // Filter courses for current semester
  const semesterCourses = useMemo(() => {
    if (!allCourses || !currentSemester) return [];
    return allCourses.filter(c => c.semester === currentSemester);
  }, [allCourses, currentSemester]);

  // Determine if a course should be shown in the current view
  const displayCourses = useMemo(() => {
    let filtered = semesterCourses;
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return filtered.filter(c => 
        c.courseName.toLowerCase().includes(q) || 
        c.teacher.toLowerCase().includes(q) || 
        c.classroom.toLowerCase().includes(q)
      );
    }

    if (viewMode === 'week') {
      filtered = filtered.filter(c => c.weeks.includes(displayWeek));
    } else if (viewMode === 'today') {
      filtered = filtered.filter(c => c.weeks.includes(displayWeek) && c.weekday === todayWeekday);
    }

    return filtered;
  }, [semesterCourses, viewMode, displayWeek, todayWeekday, searchQuery]);

  if (!settings || !allCourses) return <div className="p-8">Loading...</div>;

  if (!currentSemester) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-white space-y-6">
        <div className="w-24 h-24 bg-[#2D5A27]/10 text-[#2D5A27] rounded-full flex items-center justify-center">
          <CalendarIcon />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">还没有课表</h2>
          <p className="text-slate-500 max-w-sm mx-auto">
            从青岛农业大学教务系统保存“学期理论课表”HTML，然后上传到这里。
          </p>
        </div>
        <button 
          onClick={() => navigate('/import')}
          className="px-8 py-3 bg-[#2D5A27] text-white font-medium rounded-2xl shadow-sm hover:opacity-90 transition-colors"
        >
          导入课表
        </button>
      </div>
    );
  }

  const weekDates = getWeekStartAndEnd(startDateStr || '', displayWeek);
  const isActualCurrentWeek = displayWeek === actualCurrentWeek;

  const handlePrevWeek = () => setViewingWeek(displayWeek > 1 ? displayWeek - 1 : 1);
  const handleNextWeek = () => setViewingWeek(displayWeek + 1);
  const handleCurrentWeek = () => setViewingWeek(null);

  const getCourseColor = (courseName: string) => {
    let hash = 0;
    for (let i = 0; i < courseName.length; i++) {
      hash = courseName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return COLORS[Math.abs(hash) % COLORS.length];
  };

  const openCourseDetails = (course: Course) => setSelectedCourse(course);
  
  const handleEditSave = async (updatedCourse: Course) => {
    if (updatedCourse.id) {
      await db.courses.put(updatedCourse);
    } else {
      updatedCourse.id = Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
      await db.courses.add(updatedCourse);
    }
    setIsEditing(false);
    setSelectedCourse(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定删除该课程吗？')) {
      await db.courses.delete(id);
      setIsEditing(false);
      setSelectedCourse(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Header & Controls */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 pt-4 px-4 pb-2 space-y-4">
        
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#2D5A27] rounded-xl flex items-center justify-center text-white font-bold text-xl">青</div>
              <div>
                 <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold tracking-tight text-slate-900">第 {displayWeek} 周 <span className="text-xs font-normal text-slate-400 ml-2 hidden sm:inline">QAU Schedule</span></h1>
                    {!isActualCurrentWeek && actualCurrentWeek > 0 && (
                       <button onClick={handleCurrentWeek} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded-full font-bold hover:bg-slate-200 uppercase">
                          回到本周
                       </button>
                    )}
                 </div>
                 <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                    {weekDates ? `${format(weekDates.start, 'MM月dd日')} - ${format(weekDates.end, 'MM月dd日')}` : currentSemester}
                    {actualCurrentWeek === 0 && ' (未开学)'}
                 </p>
              </div>
           </div>
           
           <div className="flex items-center bg-slate-100 p-1 rounded-lg">
              <button onClick={handlePrevWeek} className="p-1.5 hover:bg-white rounded-md transition-colors text-slate-600"><ChevronLeft size={16}/></button>
              <button onClick={handleNextWeek} className="p-1.5 hover:bg-white rounded-md transition-colors text-slate-600"><ChevronRight size={16}/></button>
           </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-lg">
             <button 
                onClick={() => setViewMode('today')}
                className={cn("px-4 py-1.5 text-xs font-bold rounded-md transition-colors uppercase tracking-wider", viewMode === 'today' ? "bg-white shadow-sm text-slate-900" : "text-slate-500")}
             >
                今天
             </button>
             <button 
                onClick={() => setViewMode('week')}
                className={cn("px-4 py-1.5 text-xs font-bold rounded-md transition-colors uppercase tracking-wider", viewMode === 'week' ? "bg-white shadow-sm text-slate-900" : "text-slate-500")}
             >
                本周
             </button>
             <button 
                onClick={() => setViewMode('all')}
                className={cn("px-4 py-1.5 text-xs font-bold rounded-md transition-colors uppercase tracking-wider", viewMode === 'all' ? "bg-white shadow-sm text-slate-900" : "text-slate-500")}
             >
                全部
             </button>
          </div>
          
          <div className="flex-1 relative">
             <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
             <input 
                type="text" 
                placeholder="搜索课程..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 text-sm rounded-lg pl-9 pr-3 py-1.5 outline-none focus:ring-2 focus:ring-[#2D5A27]/20 transition-all text-slate-900 placeholder:text-slate-400"
             />
          </div>
          <button 
             onClick={() => {
                setEditingCourse({
                   id: '',
                   semester: currentSemester,
                   courseName: '',
                   teacher: '',
                   classroom: '',
                   weekday: 1,
                   startSection: 1,
                   endSection: 2,
                   weeks: [displayWeek]
                });
                setIsEditing(true);
             }}
             className="p-1.5 bg-[#2D5A27] text-white rounded-lg shadow-sm hover:opacity-90 transition-colors"
          >
             <Plus size={20} />
          </button>
        </div>
      </div>

      {/* Schedule Grid */}
      <div className="flex-1 overflow-y-auto">
         {viewMode === 'all' || searchQuery ? (
            // List View
            <div className="p-4 space-y-3">
               {displayCourses.length === 0 ? (
                  <div className="text-center text-neutral-500 py-10">没有找到课程</div>
               ) : (
                  displayCourses.map(course => (
                     <div 
                        key={course.id} 
                        onClick={() => openCourseDetails(course)}
                        className={cn("p-4 rounded-2xl border cursor-pointer transition-transform active:scale-[0.98]", getCourseColor(course.courseName))}
                     >
                        <h3 className="font-bold text-base mb-1">{course.courseName}</h3>
                        <div className="text-sm opacity-90 flex items-center gap-4">
                           <span className="flex items-center gap-1"><MapPin size={14}/> {course.classroom || '未安排'}</span>
                           <span className="flex items-center gap-1"><User size={14}/> {course.teacher || '未知'}</span>
                        </div>
                        <div className="text-xs opacity-75 mt-2 flex items-center gap-1">
                           <Clock size={12} />
                           星期{course.weekday} 第{course.startSection}-{course.endSection}节 · {course.weeks.length}周
                        </div>
                     </div>
                  ))
               )}
            </div>
         ) : (
            // Grid View
            <div className="flex min-w-max md:min-w-0 pb-6 relative h-full bg-[#F1F5F9]">
               
               {/* Time Column */}
               <div className="w-12 flex-shrink-0 border-r border-slate-200 bg-white z-10 sticky left-0">
                  <div className="h-10 border-b border-slate-200 flex items-center justify-center">
                     <span className="text-[10px] font-bold text-slate-400">{format(today, 'MM月')}</span>
                  </div>
                  {SECTIONS.map((sec, i) => (
                     <div key={sec.id} className="h-28 border-b border-slate-200 flex flex-col items-center justify-center text-center relative">
                        <span className="text-[10px] font-bold text-slate-400">{sec.start}</span>
                        <div className="w-4 border-t border-slate-300 my-0.5 opacity-50"></div>
                        <span className="text-[10px] font-bold text-slate-400">{sec.end}</span>
                        {i === 2 && <div className="absolute -bottom-3 left-1 text-[8px] text-slate-300">午休</div>}
                     </div>
                  ))}
               </div>

               {/* Days Columns */}
               <div className="flex-1 flex">
                  {WEEKDAYS.map((dayName, dayIndex) => {
                     const currentDayNum = dayIndex + 1;
                     const isToday = currentDayNum === todayWeekday && isActualCurrentWeek;
                     const hideDay = viewMode === 'today' && !isToday;
                     
                     if (hideDay) return null;

                     let dayDateStr = '';
                     if (weekDates) {
                        const date = new Date(weekDates.start);
                        date.setDate(date.getDate() + dayIndex);
                        dayDateStr = format(date, 'dd');
                     }

                     return (
                        <div key={currentDayNum} className={cn("flex-1 min-w-[50px] border-r border-slate-200 relative", isToday ? "bg-green-50/50" : "")}>
                           {/* Day Header */}
                           <div className="h-10 border-b border-slate-200 flex flex-col items-center justify-center sticky top-0 bg-white/90 z-0">
                              <span className={cn("text-[10px] font-bold uppercase", isToday ? "text-[#2D5A27] opacity-70" : "text-slate-400")}>{dayName}</span>
                              <span className={cn("text-sm font-bold", isToday ? "text-[#2D5A27]" : "text-slate-900")}>{dayDateStr}</span>
                           </div>

                           {/* Slots */}
                           {SECTIONS.map(sec => {
                              const coursesInSlot = displayCourses.filter(c => c.weekday === currentDayNum && c.startSection === sec.start);
                              
                              return (
                                 <div key={sec.id} className="h-28 relative border-b border-slate-200 p-0.5">
                                    {coursesInSlot.map((course, idx) => {
                                       // Calculate height based on endSection
                                       const sectionSpan = course.endSection - course.startSection + 1;
                                       
                                       return (
                                          <div 
                                             key={course.id}
                                             onClick={() => openCourseDetails(course)}
                                             className={cn(
                                                "absolute top-0.5 left-0.5 right-0.5 rounded border-l-4 p-2 flex flex-col overflow-hidden cursor-pointer shadow-sm backdrop-blur-[1px] hover:shadow-md transition-shadow",
                                                getCourseColor(course.courseName),
                                                idx > 0 ? "mt-1 z-10 scale-95 origin-top shadow-md" : "z-0"
                                             )}
                                             style={{ height: `calc(${sectionSpan * 50}% - 4px)` }}
                                          >
                                             <span className="text-[11px] font-bold leading-tight mb-1 line-clamp-2">{course.courseName}</span>
                                             
                                             <div className="mt-auto space-y-0.5">
                                                <span className="text-[9px] opacity-90 truncate flex items-center gap-0.5 leading-none">
                                                   <MapPin size={9} className="shrink-0" />
                                                   {course.classroom || '待定'}
                                                </span>
                                                {sectionSpan >= 2 && (
                                                   <>
                                                      <span className="text-[9px] opacity-90 truncate flex items-center gap-0.5 leading-none">
                                                         <User size={9} className="shrink-0" />
                                                         {course.teacher || '未知'}
                                                      </span>
                                                   </>
                                                )}
                                             </div>
                                          </div>
                                       );
                                    })}
                                 </div>
                              );
                           })}
                        </div>
                     )
                  })}
               </div>

            </div>
         )}
      </div>

      {/* Course Details Modal */}
      {selectedCourse && (
         <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-sm shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
               <div className={cn("p-6 text-center border-b border-slate-100", getCourseColor(selectedCourse.courseName))}>
                  <h2 className="text-xl font-bold mb-1">{selectedCourse.courseName}</h2>
                  <p className="text-sm opacity-80 font-medium">{selectedCourse.courseType || '课程'}</p>
               </div>
               
               <div className="p-6 space-y-4 text-sm text-slate-700">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                        <MapPin size={16} />
                     </div>
                     <div>
                        <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">教室</p>
                        <p className="font-medium text-slate-900">{selectedCourse.classroom || '未安排'}</p>
                     </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                        <User size={16} />
                     </div>
                     <div>
                        <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">教师</p>
                        <p className="font-medium text-slate-900">{selectedCourse.teacher || '未安排'}</p>
                     </div>
                  </div>

                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                        <Clock size={16} />
                     </div>
                     <div>
                        <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">时间</p>
                        <p className="font-medium text-slate-900">
                           星期{selectedCourse.weekday}，第{selectedCourse.startSection}-{selectedCourse.endSection}节
                        </p>
                     </div>
                  </div>

                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                        <CalendarIcon size={16} />
                     </div>
                     <div>
                        <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">周次</p>
                        <p className="font-medium text-slate-900 leading-tight">
                           {selectedCourse.weeks.join(', ')} 周
                        </p>
                     </div>
                  </div>

                  {selectedCourse.rawText && (
                     <div className="flex items-start gap-3 pt-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                           <Info size={16} />
                        </div>
                        <div>
                           <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">原始解析数据</p>
                           <p className="text-xs text-slate-700 bg-slate-50 p-2 rounded-lg mt-1 break-all border border-slate-100">
                              {selectedCourse.rawText}
                           </p>
                        </div>
                     </div>
                  )}
               </div>

               <div className="p-4 bg-slate-50 flex gap-3 border-t border-slate-100">
                  <button 
                     onClick={() => { setSelectedCourse(null); setEditingCourse(selectedCourse); setIsEditing(true); }}
                     className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition-colors"
                  >
                     编辑
                  </button>
                  <button 
                     onClick={() => handleDelete(selectedCourse.id)}
                     className="py-2.5 px-4 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors"
                  >
                     <TrashIcon />
                  </button>
                  <button 
                     onClick={() => setSelectedCourse(null)}
                     className="flex-1 py-2.5 bg-[#2D5A27] text-white font-bold rounded-xl hover:opacity-90 transition-colors shadow-sm"
                  >
                     关闭
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* Edit Modal */}
      {isEditing && editingCourse && (
         <CourseEditModal 
            course={editingCourse} 
            onSave={handleEditSave}
            onCancel={() => { setIsEditing(false); setEditingCourse(null); }}
         />
      )}
    </div>
  );
}

// Minimal Icons to keep imports clean
function CalendarIcon({ size = 24, className }: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>
}

function TrashIcon({ size = 20, className }: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
}
