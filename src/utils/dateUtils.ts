import { differenceInCalendarDays, parseISO, isValid, addDays, subDays } from 'date-fns';

export function calculateCurrentWeek(today: Date, semesterStartDateStr: string): number {
  if (!semesterStartDateStr) return 0;
  
  const startDate = parseISO(semesterStartDateStr);
  if (!isValid(startDate)) return 0;

  // Make sure to compare dates consistently. 
  // Get difference in days
  const diffDays = differenceInCalendarDays(today, startDate);
  
  if (diffDays < 0) return 0; // Not started yet

  return Math.floor(diffDays / 7) + 1;
}

export function getWeekStartAndEnd(semesterStartDateStr: string, week: number): { start: Date, end: Date } | null {
   if (!semesterStartDateStr || week < 1) return null;
   const startDate = parseISO(semesterStartDateStr);
   if (!isValid(startDate)) return null;

   const daysToAdd = (week - 1) * 7;
   const startOfWeek = addDays(startDate, daysToAdd);
   const endOfWeek = addDays(startOfWeek, 6);
   return { start: startOfWeek, end: endOfWeek };
}
