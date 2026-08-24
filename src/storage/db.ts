import Dexie, { Table } from 'dexie';
import { Course, AppSettings } from '../models/types';

export class QauScheduleDB extends Dexie {
  courses!: Table<Course, string>;
  settings!: Table<AppSettings, number>;

  constructor() {
    super('QauScheduleDB');
    this.version(1).stores({
      courses: 'id, semester, weekday', // Primary key and indexed props
      settings: '++id, currentSemester'
    });
  }
}

export const db = new QauScheduleDB();

// Initialize default settings if not exist
export const initSettings = async () => {
  const count = await db.settings.count();
  if (count === 0) {
    await db.settings.add({
      currentSemester: '',
      semesterStartDates: {}
    });
  }
};
