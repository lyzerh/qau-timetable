/**
 * Parses week string into an array of week numbers.
 * Supports:
 * "1-16"
 * "1-5,7-11"
 * "1,3,5,7"
 * "1-8(单)"
 * "2-16(双)"
 * "1-5,7,9-12"
 * "1-16周"
 * "1-16周(单)"
 * "2-16周(双)"
 */
export function parseWeeks(text: string): number[] {
  const weeks = new Set<number>();
  if (!text) return [];

  // Extract the main part before "(周)" or "(单)" etc.
  const isOdd = text.includes('单');
  const isEven = text.includes('双');

  // Replace anything that is not a digit, comma, or dash
  const cleanText = text.replace(/[^\d,-]/g, '').trim();

  if (!cleanText) return [];

  const parts = cleanText.split(',');

  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);

      if (!isNaN(start) && !isNaN(end)) {
        for (let i = start; i <= end; i++) {
          if (isOdd && i % 2 === 0) continue;
          if (isEven && i % 2 !== 0) continue;
          weeks.add(i);
        }
      }
    } else {
      const num = parseInt(part, 10);
      if (!isNaN(num)) {
        if (isOdd && num % 2 === 0) continue;
        if (isEven && num % 2 !== 0) continue;
        weeks.add(num);
      }
    }
  }

  return Array.from(weeks).sort((a, b) => a - b);
}
