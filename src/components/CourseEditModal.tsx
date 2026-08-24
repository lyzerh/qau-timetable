import React, { useState } from 'react';
import { Course } from '../models/types';
import { X } from 'lucide-react';

type Props = {
  course: Course;
  onSave: (course: Course) => void;
  onCancel: () => void;
};

export default function CourseEditModal({ course, onSave, onCancel }: Props) {
  const [formData, setFormData] = useState<Course>({ ...course });
  const [weeksStr, setWeeksStr] = useState(course.weeks.join(','));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['weekday', 'startSection', 'endSection'].includes(name) ? parseInt(value) || value : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Parse weeks
    const weeks = weeksStr.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    
    onSave({
      ...formData,
      weeks: weeks.sort((a, b) => a - b)
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-200">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
          <h2 className="text-lg font-bold uppercase tracking-wide text-slate-900">{course.id ? '编辑课程' : '新增课程'}</h2>
          <button onClick={onCancel} className="p-2 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 max-h-[70vh] overflow-y-auto bg-white">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">课程名称</label>
            <input 
              required
              type="text" 
              name="courseName" 
              value={formData.courseName} 
              onChange={handleChange}
              className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:border-[#2D5A27] focus:ring-1 focus:ring-[#2D5A27] font-bold text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">教师</label>
              <input 
                type="text" 
                name="teacher" 
                value={formData.teacher} 
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:border-[#2D5A27] font-medium text-slate-900"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">教室</label>
              <input 
                type="text" 
                name="classroom" 
                value={formData.classroom} 
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:border-[#2D5A27] font-medium text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">星期</label>
              <select 
                name="weekday" 
                value={formData.weekday} 
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:border-[#2D5A27] font-medium text-slate-900"
              >
                {[1,2,3,4,5,6,7].map(d => <option key={d} value={d}>周{d}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">开始节次</label>
              <input 
                required
                type="number" 
                min="1" max="15"
                name="startSection" 
                value={formData.startSection} 
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:border-[#2D5A27] font-medium text-slate-900"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">结束节次</label>
              <input 
                required
                type="number" 
                min="1" max="15"
                name="endSection" 
                value={formData.endSection} 
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:border-[#2D5A27] font-medium text-slate-900"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">周次 (用逗号分隔，如 1,2,3,5)</label>
            <input 
              required
              type="text" 
              value={weeksStr} 
              onChange={e => setWeeksStr(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:border-[#2D5A27] font-mono text-slate-900"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">课程性质 (选填)</label>
            <input 
              type="text" 
              name="courseType" 
              value={formData.courseType || ''} 
              onChange={handleChange}
              className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:border-[#2D5A27] font-medium text-slate-900"
            />
          </div>

          <div className="pt-4 flex gap-3 border-t border-slate-100 mt-6">
            <button 
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold uppercase tracking-wider rounded-md hover:bg-slate-50 transition-colors"
            >
              取消
            </button>
            <button 
              type="submit"
              className="flex-1 py-2.5 bg-[#2D5A27] text-white font-bold uppercase tracking-wider rounded-md hover:opacity-90 transition-colors shadow-sm"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
