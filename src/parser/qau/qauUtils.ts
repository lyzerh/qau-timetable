export function parseSemester(semesterSelect: Element | null): string {
  let semester = '';
  if (semesterSelect) {
    const selectedOption = semesterSelect.querySelector('option[selected="selected"], option[selected]');
    if (selectedOption) {
      semester = selectedOption.textContent?.trim() || '';
    } else {
      const options = Array.from(semesterSelect.querySelectorAll('option'));
      for (const opt of options) {
        const val = opt.textContent?.trim() || '';
        if (/\d{4}-\d{4}-\d/.test(val)) {
          semester = val;
          break;
        }
      }
    }
  }
  return semester;
}

export function parseSection(sectionText: string): { startSection: number, endSection: number } | null {
  const sectionMatches = sectionText.match(/(\d+)/g);
  if (!sectionMatches || sectionMatches.length === 0) {
    return null;
  }
  const startSection = parseInt(sectionMatches[0], 10);
  const endSection = parseInt(sectionMatches[sectionMatches.length - 1], 10);
  return { startSection, endSection };
}
