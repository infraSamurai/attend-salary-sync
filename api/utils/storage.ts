import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = '/tmp';
const TEACHERS_FILE = path.join(DATA_DIR, 'teachers.json');
const ATTENDANCE_FILE = path.join(DATA_DIR, 'attendance.json');

// Default data
const DEFAULT_TEACHERS = [
  {
    id: '1',
    name: 'Jyotsana',
    designation: 'Principal',
    baseSalary: 12000,
    joinDate: '2025-04-01',
    contact: '999999999',
    photo: ''
  },
  {
    id: '2',
    name: 'Pritam',
    designation: 'Computer Teacher',
    baseSalary: 10000,
    joinDate: '2025-04-01',
    contact: '99999999',
    photo: ''
  }
];

const DEFAULT_ATTENDANCE: any[] = [];

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

// Generic file operations
async function readJsonFile<T>(filePath: string, defaultData: T): Promise<T> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch {
    // File doesn't exist or is invalid, return default data
    await writeJsonFile(filePath, defaultData);
    return defaultData;
  }
}

async function writeJsonFile<T>(filePath: string, data: T): Promise<void> {
  try {
    await ensureDataDir();
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing JSON file:', error);
    throw error;
  }
}

// Teachers storage
export async function getTeachers(): Promise<any[]> {
  return readJsonFile(TEACHERS_FILE, DEFAULT_TEACHERS);
}

export async function saveTeachers(teachers: any[]): Promise<void> {
  await writeJsonFile(TEACHERS_FILE, teachers);
}

export async function addTeacher(teacher: any): Promise<any> {
  const teachers = await getTeachers();
  const newTeacher = {
    ...teacher,
    id: Date.now().toString(),
  };
  teachers.push(newTeacher);
  await saveTeachers(teachers);
  return newTeacher;
}

export async function updateTeacher(id: string, updates: any): Promise<any | null> {
  const teachers = await getTeachers();
  const index = teachers.findIndex(t => t.id === id);
  if (index === -1) return null;
  
  teachers[index] = { ...teachers[index], ...updates };
  await saveTeachers(teachers);
  return teachers[index];
}

export async function deleteTeacher(id: string): Promise<boolean> {
  const teachers = await getTeachers();
  const initialLength = teachers.length;
  const filteredTeachers = teachers.filter(t => t.id !== id);
  
  if (filteredTeachers.length === initialLength) return false;
  
  await saveTeachers(filteredTeachers);
  return true;
}

// Attendance storage
export async function getAttendance(): Promise<any[]> {
  return readJsonFile(ATTENDANCE_FILE, DEFAULT_ATTENDANCE);
}

export async function saveAttendance(attendance: any[]): Promise<void> {
  await writeJsonFile(ATTENDANCE_FILE, attendance);
}

export async function addOrUpdateAttendance(attendanceRecord: any): Promise<any> {
  const attendance = await getAttendance();
  const existingIndex = attendance.findIndex(
    record => record.teacherId === attendanceRecord.teacherId && record.date === attendanceRecord.date
  );

  if (existingIndex !== -1) {
    // Update existing record
    attendance[existingIndex] = { ...attendance[existingIndex], ...attendanceRecord };
    await saveAttendance(attendance);
    return attendance[existingIndex];
  } else {
    // Add new record
    attendance.push(attendanceRecord);
    await saveAttendance(attendance);
    return attendanceRecord;
  }
}

export async function deleteAttendance(teacherId: string, date: string): Promise<boolean> {
  const attendance = await getAttendance();
  const initialLength = attendance.length;
  const filteredAttendance = attendance.filter(
    record => !(record.teacherId === teacherId && record.date === date)
  );
  
  if (filteredAttendance.length === initialLength) return false;
  
  await saveAttendance(filteredAttendance);
  return true;
}