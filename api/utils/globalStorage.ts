// Global storage that persists across API requests in the same Vercel deployment
// This works because Node.js modules are cached and reused across requests

// Global storage objects
let globalTeachers: any[] | null = null;
let globalAttendance: any[] | null = null;
let globalTeacherIdCounter: number | null = null;

// Default data - same as the backup
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

export function getGlobalTeachers(): any[] {
  if (globalTeachers === null) {
    console.log('🔄 Initializing global teachers storage with defaults');
    globalTeachers = [...DEFAULT_TEACHERS];
  }
  console.log('📖 getGlobalTeachers() returning:', globalTeachers.length, 'teachers');
  return globalTeachers;
}

export function setGlobalTeachers(teachers: any[]): void {
  console.log('💾 setGlobalTeachers() saving:', teachers.length, 'teachers');
  globalTeachers = [...teachers];
  console.log('✅ Global teachers updated:', globalTeachers.length, 'teachers');
}

export function getGlobalAttendance(): any[] {
  if (globalAttendance === null) {
    console.log('🔄 Initializing global attendance storage with defaults');
    globalAttendance = [...DEFAULT_ATTENDANCE];
  }
  console.log('📖 getGlobalAttendance() returning:', globalAttendance.length, 'records');
  return globalAttendance;
}

export function setGlobalAttendance(attendance: any[]): void {
  console.log('💾 setGlobalAttendance() saving:', attendance.length, 'records');
  globalAttendance = [...attendance];
  console.log('✅ Global attendance updated:', globalAttendance.length, 'records');
}

export function getGlobalTeacherIdCounter(): number {
  if (globalTeacherIdCounter === null) {
    console.log('🔄 Initializing global teacher ID counter');
    globalTeacherIdCounter = Math.max(...getGlobalTeachers().map(t => parseInt(t.id))) + 1;
  }
  return globalTeacherIdCounter;
}

export function setGlobalTeacherIdCounter(counter: number): void {
  console.log('💾 setGlobalTeacherIdCounter() setting:', counter);
  globalTeacherIdCounter = counter;
}

// Debug function to check global state
export function getGlobalStorageStatus() {
  return {
    teachers: globalTeachers?.length || 0,
    attendance: globalAttendance?.length || 0,
    teacherIdCounter: globalTeacherIdCounter || 0,
    teachersInitialized: globalTeachers !== null,
    attendanceInitialized: globalAttendance !== null,
    counterInitialized: globalTeacherIdCounter !== null
  };
}