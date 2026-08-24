import React, { useState } from 'react';
import Papa from 'papaparse';
import { Course } from '../models/types';

// We might want to support JSON/CSV parsing as required by the prompt
export function parseJson(text: string): Course[] {
  try {
    const data = JSON.parse(text);
    if (Array.isArray(data)) {
      return data;
    }
    return [];
  } catch (e) {
    return [];
  }
}

export function parseCsv(text: string): Course[] {
   // Assuming simple format exported by this app
   const result = Papa.parse<Course>(text, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
   });
   
   if (result.errors.length > 0 || !result.data) {
     return [];
   }
   
   return result.data.map(row => ({
      ...row,
      weeks: typeof row.weeks === 'string' ? JSON.parse(row.weeks) : row.weeks
   }));
}
