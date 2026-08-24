import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { parseQauHtml, ParseResult } from '../parser/qau';
import { parseCsv, parseJson } from '../parser/otherParsers';
import { db } from '../storage/db';
import { Course } from '../models/types';
import { cn } from '../components/Layout';

export default function ImportPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [jsonCsvResult, setJsonCsvResult] = useState<Course[] | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualSemester, setManualSemester] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setError(null);
    setParseResult(null);
    setJsonCsvResult(null);
    setIsParsing(true);

    try {
      const text = await selectedFile.text();
      const name = selectedFile.name.toLowerCase();
      
      if (name.endsWith('.html') || name.endsWith('.htm')) {
        const result = parseQauHtml(text);
        if (result.errors.length > 0) {
          setError(result.errors.join('\n'));
        } else {
          setParseResult(result);
          if (result.semester) {
             setManualSemester(result.semester);
          }
        }
      } else if (name.endsWith('.csv')) {
        const courses = parseCsv(text);
        setJsonCsvResult(courses);
      } else if (name.endsWith('.json')) {
        const courses = parseJson(text);
        setJsonCsvResult(courses);
      } else {
         setError("不支持的文件格式。请上传 .html, .csv 或 .json 文件。");
      }
    } catch (err: any) {
      setError(`解析失败: ${err.message}`);
    } finally {
      setIsParsing(false);
    }
  };

  const handleConfirmImport = async () => {
    try {
      let coursesToSave: Course[] = [];
      let semesterToUse = manualSemester;

      if (parseResult) {
        if (!manualSemester) {
          setError("请填写或确认学期名称 (例如: 2026-2027-1)");
          return;
        }
        semesterToUse = manualSemester;
        coursesToSave = parseResult.courses.map(c => ({ ...c, semester: semesterToUse }));
      } else if (jsonCsvResult) {
        if (jsonCsvResult.length === 0) {
           setError("文件内没有有效的课程数据。");
           return;
        }
        coursesToSave = jsonCsvResult;
        semesterToUse = coursesToSave[0].semester;
      }

      if (coursesToSave.length === 0) {
         setError("没有可以保存的课程。");
         return;
      }

      // Add courses
      await db.courses.bulkPut(coursesToSave);
      
      // Update Settings
      const settings = await db.settings.toCollection().first();
      if (settings) {
         let startDates = settings.semesterStartDates || {};
         // Set default start date if not exists
         if (!startDates[semesterToUse]) {
            startDates[semesterToUse] = new Date().toISOString().split('T')[0];
         }
         await db.settings.update(settings.id!, {
            currentSemester: semesterToUse,
            semesterStartDates: startDates
         });
      }

      navigate('/');
    } catch (err: any) {
       setError(`保存失败: ${err.message}`);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 pb-20">
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 mb-6">Import Schedule</h1>
      
      {!parseResult && !jsonCsvResult && (
        <div className="bg-white p-8 md:p-12 rounded-lg border border-slate-200 shadow-sm text-center">
          <div className="w-16 h-16 bg-[#2D5A27]/10 text-[#2D5A27] rounded-full flex items-center justify-center mx-auto mb-4">
            <Upload size={32} />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2 uppercase tracking-wide">上传课表文件</h2>
          <p className="text-slate-500 mb-6 text-sm md:text-base">
            从青岛农业大学教务系统保存“学期理论课表”网页 (HTML)，然后在此处上传。支持 .html, .csv, .json 格式。
          </p>
          <label className="inline-flex items-center justify-center px-8 py-3 bg-[#2D5A27] hover:opacity-90 text-white font-bold uppercase tracking-wider rounded-md cursor-pointer transition-colors shadow-sm">
            选择文件
            <input type="file" className="hidden" accept=".html,.htm,.csv,.json" onChange={handleFileUpload} />
          </label>
          
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-start gap-3 text-left">
               <AlertCircle size={20} className="shrink-0 mt-0.5" />
               <p className="text-sm font-medium">{error}</p>
            </div>
          )}
        </div>
      )}

      {isParsing && <div className="text-center py-10 text-neutral-500">正在解析...</div>}

      {/* Parse Preview */}
      {(parseResult || jsonCsvResult) && (
        <div className="space-y-6">
          <div className="bg-white p-6 md:p-8 rounded-lg border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-3 text-[#2D5A27] mb-4">
              <CheckCircle2 size={24} />
              <h2 className="text-xl font-bold uppercase tracking-wide">解析成功</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-md">
                 <p className="text-[10px] text-slate-500 mb-1 font-bold uppercase tracking-widest">共发现课程</p>
                 <p className="text-2xl font-bold text-slate-900">
                    {parseResult ? parseResult.courses.length : jsonCsvResult?.length} 门
                 </p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-md">
                 <p className="text-[10px] text-slate-500 mb-1 font-bold uppercase tracking-widest">目标学期</p>
                 {parseResult ? (
                   <input 
                      type="text" 
                      value={manualSemester} 
                      onChange={e => setManualSemester(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 font-bold focus:ring-2 focus:ring-[#2D5A27]/20 outline-none"
                      placeholder="手动填写学期"
                   />
                 ) : (
                   <p className="text-xl font-bold text-slate-900">{jsonCsvResult?.[0]?.semester || '未知'}</p>
                 )}
              </div>
            </div>

            {parseResult?.warnings && parseResult.warnings.length > 0 && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md space-y-2 mt-4">
                <div className="flex items-center gap-2 text-yellow-800 font-bold uppercase tracking-wide">
                  <AlertCircle size={18} />
                  <span>部分课程存在异常</span>
                </div>
                <ul className="list-disc pl-5 text-sm text-yellow-700 space-y-1 font-medium">
                  {parseResult.warnings.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
                <p className="text-[10px] text-yellow-600 font-bold uppercase tracking-widest pt-2">您可以导入后在课表页面手动编辑这些课程。</p>
              </div>
            )}
            
            {parseResult?.metadata && (
               <div className="p-4 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
                 <span className="font-bold uppercase tracking-wide text-xs">课表备注：</span> <span className="font-medium">{parseResult.metadata}</span>
               </div>
            )}
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={() => { setParseResult(null); setJsonCsvResult(null); setFile(null); }}
              className="flex-1 py-3.5 bg-white border border-slate-200 text-slate-700 font-bold uppercase tracking-wider rounded-md hover:bg-slate-50 transition-colors shadow-sm"
            >
              取消
            </button>
            <button 
              onClick={handleConfirmImport}
              className="flex-1 py-3.5 bg-[#2D5A27] text-white font-bold uppercase tracking-wider rounded-md hover:opacity-90 transition-colors shadow-sm"
            >
              确认导入
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
