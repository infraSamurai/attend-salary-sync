export interface Teacher {
  id: string;
  name: string;
  designation: string;
  photo?: string;
}

export interface AttendanceRecord {
  teacherId: string;
  date: string;
  status: 'present' | 'absent' | 'late';
}

export interface Holiday {
  date: string;
  name: string;
  type: 'festival' | 'school';
}

export interface DayInfo {
  date: Date;
  dayNumber: number;
  isWeekend: boolean;
  isSunday: boolean;
}