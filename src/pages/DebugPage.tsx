import React, { useState } from 'react';
import { parseWeeks } from '../parser/qau/weekParser';
import { parseQauHtml } from '../parser/qau';

const testSampleHtml = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html>
<body>
  <select name="xnxq01id" id="xnxq01id">
    <option value="2026-2027-1" selected="selected">2026-2027-1</option>
  </select>
  <table id="kbtable">
    <tr>
      <th>空白</th>
      <th>星期一</th>
      <th>星期二</th>
      <th>星期三</th>
      <th>星期四</th>
      <th>星期五</th>
      <th>星期六</th>
      <th>星期日</th>
    </tr>
    <tr>
      <th>第1,2节</th>
      <td></td>
      <td>
        <div class="kbcontent">
          课程名称A<br>
          <font title="老师">教师A</font><br>
          <font title="周次(节次)">1-5,7-11(周)(必修)</font><br>
          <font title="教室">教室A</font><br>
        </div>
      </td>
      <td></td>
      <td>
        <div class="kbcontent">
          课程名称B<br>
          <font title="老师">教师B</font><br>
          <font title="周次(节次)">1-3,6-12(周)(必修)</font><br>
          <font title="教室">教室B</font><br>
        </div>
      </td>
      <td></td>
      <td></td>
      <td></td>
    </tr>
    <tr>
      <th>第3,4节</th>
      <td></td><td></td><td></td><td></td><td></td><td></td><td></td>
    </tr>
    <tr>
      <th>第5节</th>
      <td></td><td></td><td></td><td></td><td></td><td></td><td></td>
    </tr>
    <tr>
      <th>第6,7节</th>
      <td>
        <div class="kbcontent">
          课程名称C<br>
          <font title="老师">教师C</font><br>
          <font title="周次(节次)">1-4,7-18(周)(必修)</font><br>
          <font title="教室">教室C</font><br>
        </div>
      </td>
      <td></td><td></td><td></td><td></td><td></td><td></td>
    </tr>
    <tr>
      <th>第8,9节</th>
      <td></td><td></td><td></td><td></td><td></td><td></td><td></td>
    </tr>
    <tr>
      <th>第10,11节</th>
      <td></td><td></td><td></td><td></td><td></td><td></td><td></td>
    </tr>
    <tr>
      <th>备注:</th>
      <td colspan="7">000000 某某专业科研训练与课程论文 某某专业班级 1-18周;</td>
    </tr>
  </table>
</body>
</html>
`;

export default function DebugPage() {
  const [testResult, setTestResult] = useState<any>(null);

  const runTest = (text: string, title: string) => {
    const weeks = parseWeeks(text);
    return { title, text, result: JSON.stringify(weeks) };
  };

  const weekTests = [
    runTest("1-5,7-11(周)(必修)", "Test 1"),
    runTest("1-16(单)", "Test 2"),
    runTest("2-16(双)", "Test 3"),
    runTest("1,3,5,7", "Test 4"),
    runTest("1-5,7,9-12", "Test 5"),
  ];

  const handleRunHtmlFixture = () => {
     const res = parseQauHtml(testSampleHtml);
     setTestResult(res);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto pb-24 space-y-8">
      <h1 className="text-2xl font-bold">Developer Debug - Parser</h1>
      
      <div className="space-y-4 bg-white p-6 rounded-2xl border border-neutral-200">
        <h2 className="text-lg font-semibold">Week Parser Tests</h2>
        <table className="w-full text-sm text-left">
           <thead>
              <tr className="border-b">
                 <th className="py-2">Test</th>
                 <th>Input</th>
                 <th>Output</th>
              </tr>
           </thead>
           <tbody>
              {weekTests.map((t, i) => (
                 <tr key={i} className="border-b">
                    <td className="py-2">{t.title}</td>
                    <td className="font-mono text-xs">{t.text}</td>
                    <td className="font-mono text-xs">{t.result}</td>
                 </tr>
              ))}
           </tbody>
        </table>
      </div>

      <div className="space-y-4 bg-white p-6 rounded-2xl border border-neutral-200">
        <h2 className="text-lg font-semibold">HTML Fixture Test</h2>
        <button 
           onClick={handleRunHtmlFixture}
           className="px-4 py-2 bg-neutral-800 text-white rounded-lg text-sm"
        >
           Run Fixture
        </button>
        
        {testResult && (
           <div className="mt-4 space-y-4">
              <div>
                 <h3 className="font-medium text-sm text-neutral-500">Semester</h3>
                 <p>{testResult.semester}</p>
              </div>
              <div>
                 <h3 className="font-medium text-sm text-neutral-500">Metadata (Notes)</h3>
                 <p className="bg-blue-50 p-2 rounded">{testResult.metadata}</p>
              </div>
              {testResult.debugInfo && (
                 <div>
                    <h3 className="font-medium text-sm text-neutral-500 mb-2">Debug Info</h3>
                    <div className="text-sm font-mono bg-neutral-900 text-green-400 p-4 rounded-xl space-y-1">
                       <p>tableFound: {testResult.debugInfo.tableFound ? 'true' : 'false'}</p>
                       <p>rowCount: {testResult.debugInfo.rowCount}</p>
                       <p>courseCellCount: {testResult.debugInfo.courseCellCount}</p>
                       <p>parsedCourseCount: {testResult.debugInfo.parsedCourseCount}</p>
                       <br/>
                       {testResult.debugInfo.rows.map((row: any, i: number) => (
                          <p key={i}>row {i + 1}: section = {row.section} courseCells = {row.courseCells}</p>
                       ))}
                    </div>
                 </div>
              )}
              <div>
                 <h3 className="font-medium text-sm text-neutral-500">Parsed Courses ({testResult.courses.length})</h3>
                 <pre className="text-xs bg-neutral-50 p-4 rounded-xl overflow-auto border border-neutral-200 max-h-96">
                    {JSON.stringify(testResult.courses, null, 2)}
                 </pre>
              </div>
           </div>
        )}
      </div>
    </div>
  );
}
