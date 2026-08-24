export type Course = {
  id: string;
  semester: string;
  courseName: string;
  teacher: string;
  classroom: string;
  weekday: number; // 1-7
  startSection: number;
  endSection: number;
  weeks: number[];
  courseType?: string;
  rawText?: string;
};

export type AppSettings = {
  id?: number;
  currentSemester: string;
  semesterStartDates: Record<string, string>; // { "2026-2027-1": "2026-09-07" }
};
