import { Course } from '../../models/types';
import { parseWeeks } from './weekParser';
import { parseSemester, parseSection } from './qauUtils';

export { parseWeeks, parseSemester, parseSection };

export type ParseResult = {
  courses: Course[];
  semester: string;
  errors: string[];
  warnings: string[];
  metadata: string;
  debugInfo?: any;
};

export function parseQauHtml(html: string): ParseResult {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const errors: string[] = [];
  const warnings: string[] = [];
  const courses: Course[] = [];
  const debugInfo: any = {
    tableFound: false,
    rowCount: 0,
    courseCellCount: 0,
    parsedCourseCount: 0,
    rows: []
  };

  // 1. Check for kbtable
  const kbTable = doc.querySelector('#kbtable');
  if (!kbTable) {
    errors.push("无法识别课表，请上传青岛农业大学教务系统‘学期理论课表’页面保存的 HTML 文件。");
    return { courses, semester: '', errors, warnings, metadata: '', debugInfo };
  }

  debugInfo.tableFound = true;

  // 2. Parse Semester
  const semesterSelect = doc.querySelector('#xnxq01id');
  let semester = parseSemester(semesterSelect);

  // 3. Extract Rows
  const rows = Array.from(kbTable.querySelectorAll('tr'));
  debugInfo.rowCount = rows.length;

  // 4. Parse Metadata (Remarks) from the last row
  let metadata = '';
  const lastRow = rows[rows.length - 1];
  if (lastRow) {
    const firstCell = lastRow.querySelector('td, th');
    if (firstCell && firstCell.textContent?.trim().includes('备注')) {
      const cells = lastRow.querySelectorAll('td, th');
      if (cells.length >= 2) {
        metadata = cells[1].textContent?.trim() || '';
      } else {
        metadata = lastRow.textContent?.replace('备注:', '').trim() || '';
      }
    }
  }

  // 5. Iterate over rows (skip header row)
  let isFirstRow = true;

  rows.forEach((row) => {
    if (isFirstRow) {
      isFirstRow = false;
      return;
    }

    const cells = Array.from(row.querySelectorAll('td, th'));
    if (cells.length === 0) return;
    
    // Skip remarks row if it happens to be hit here
    if (cells[0].textContent?.trim().includes('备注')) return;

    // Parse section from the first column
    const sectionText = cells[0].textContent?.trim() || '';
    const sectionResult = parseSection(sectionText);
    if (!sectionResult) {
      return; // Not a valid section row
    }

    const { startSection, endSection } = sectionResult;
    let courseCellsInRow = 0;

    // Parse each weekday column (index 1 to 7 corresponding to Mon to Sun)
    for (let i = 1; i <= 7; i++) {
      const cell = cells[i];
      if (!cell) continue;

      let detail = cell.querySelector('.kbcontent');
      let textContent = detail?.textContent?.replace(/\u00a0/g, " ").trim();

      if (!detail || !textContent) {
        detail = cell.querySelector('.kbcontent1');
        textContent = detail?.textContent?.replace(/\u00a0/g, " ").trim();
      }

      if (!detail || !textContent) {
        continue;
      }

      const htmlContent = detail.innerHTML;
      const parts = htmlContent.split(/<hr[^>]*>|-{5,}/i);

      parts.forEach((part) => {
        if (!part.replace(/<[^>]*>?/gm, '').trim()) return;

        const dummy = document.createElement('div');
        dummy.innerHTML = part;

        let courseName = '';
        for (const child of Array.from(dummy.childNodes)) {
          if (child.nodeType === Node.TEXT_NODE) {
            const txt = child.textContent?.replace(/\u00a0/g, " ").trim();
            if (txt) {
              courseName = txt;
              break;
            }
          }
        }

        if (!courseName) {
          courseName = dummy.textContent?.replace(/\u00a0/g, " ").trim() || '';
        }

        if (!courseName) return;

        courseCellsInRow++;
        debugInfo.courseCellCount++;

        let teacher = '';
        const teacherEl = dummy.querySelector('font[title="老师"]');
        if (teacherEl) teacher = teacherEl.textContent?.trim() || '';

        let classroom = '';
        const classroomEl = dummy.querySelector('font[title="教室"]');
        if (classroomEl) classroom = classroomEl.textContent?.trim() || '';

        let weeks: number[] = [];
        let courseType = '';
        const weeksEl = dummy.querySelector('font[title="周次(节次)"]');
        if (weeksEl) {
          const fullWeekText = weeksEl.textContent?.trim() || '';
          
          const typeMatch = fullWeekText.match(/\((必修|选修|限选|公共必修|专业必修)\)/) || fullWeekText.match(/（(必修|选修|限选|公共必修|专业必修)）/);
          if (typeMatch) {
            courseType = typeMatch[1];
          }

          weeks = parseWeeks(fullWeekText);
          if (weeks.length === 0) {
             warnings.push(`无法识别周次：[${courseName}] -> ${fullWeekText}`);
          }
        } else {
           warnings.push(`无法识别周次：[${courseName}] 缺少周次标签`);
        }

        courses.push({
          id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
          semester,
          courseName,
          teacher,
          classroom,
          weekday: i,
          startSection,
          endSection,
          weeks,
          courseType,
          rawText: dummy.textContent?.replace(/\s+/g, ' ').trim()
        });

        debugInfo.parsedCourseCount++;
      });
    }

    debugInfo.rows.push({
       section: sectionText,
       courseCells: courseCellsInRow
    });
  });

  return { courses, semester, errors, warnings, metadata, debugInfo };
}
