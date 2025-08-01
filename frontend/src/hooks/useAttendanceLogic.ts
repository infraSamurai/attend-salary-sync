import { useState, useEffect, useCallback } from "react";
import { AttendanceRecord, Holiday, Teacher, DayInfo } from "@/types/attendance";
import { useDataSync } from "./useDataSync";
import { useAttendanceBroadcast } from "./useBroadcastSync";

export const useAttendanceLogic = (teachers: Teacher[], holidays: Holiday[], currentDate: Date, isAuthenticated = true) => {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  // Use data sync hook for real-time attendance updates
  const { data, loading, error, refresh } = useDataSync({
    url: '/api/data/attendance',
    enabled: isAuthenticated,
    onData: (responseData) => {
      if (responseData?.attendance) {
        setAttendance(responseData.attendance);
      }
    }
  });

  // Use broadcast channel for same-device synchronization
  const { broadcast } = useAttendanceBroadcast();

  // Listen for broadcast messages from other tabs
  useEffect(() => {
    const handleAttendanceChanged = () => {
      refresh(); // Refresh data when other tabs make changes
    };

    window.addEventListener('attendance-changed', handleAttendanceChanged);
    return () => window.removeEventListener('attendance-changed', handleAttendanceChanged);
  }, [refresh]);

  const getDaysInMonth = (date: Date): DayInfo[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDay = new Date(year, month, day);
      days.push({
        date: currentDay,
        dayNumber: day,
        isWeekend: currentDay.getDay() === 0 || currentDay.getDay() === 6,
        isSunday: currentDay.getDay() === 0
      });
    }
    return days;
  };

  const days = getDaysInMonth(currentDate);

  const isHoliday = (date: Date) => {
    return holidays.some(holiday => 
      new Date(holiday.date).toDateString() === date.toDateString()
    );
  };

  const getAttendanceStatus = (teacherId: string, date: Date) => {
    const dateString = date.toDateString();
    const record = attendance.find(
      a => a.teacherId === teacherId && new Date(a.date).toDateString() === dateString
    );
    return record?.status;
  };

  const toggleAttendance = useCallback(async (teacherId: string, date: Date) => {
    const dateString = date.toISOString().split('T')[0]; // Use YYYY-MM-DD format
    const existingRecord = attendance.find(
      a => a.teacherId === teacherId && a.date === dateString
    );

    let newStatus = 'present';
    if (existingRecord) {
      const current = existingRecord.status;
      // Cycle: absent -> present -> late -> absent
      if (current === 'absent') {
        newStatus = 'present';
      } else if (current === 'present') {
        newStatus = 'late';
      } else {
        newStatus = 'absent';
      }
    }

    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const response = await fetch('/api/data/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          teacherId,
          date: dateString,
          status: newStatus
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Broadcast the change to other tabs
      broadcast('attendance-updated', { teacherId, date: dateString, status: newStatus });
      
      // Refresh data to get latest state
      refresh();
    } catch (error) {
      console.error('Failed to update attendance:', error);
    }
  }, [attendance, broadcast, refresh]);

  const markAllPresentForDay = useCallback(async (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const promises = teachers.map(teacher => 
        fetch('/api/data/attendance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
          },
          body: JSON.stringify({
            teacherId: teacher.id,
            date: dateString,
            status: 'present'
          }),
        })
      );

      await Promise.all(promises);
      
      // Broadcast the change to other tabs
      broadcast('attendance-updated', { date: dateString, status: 'present', bulk: true });
      
      // Refresh data to get latest state
      refresh();
    } catch (error) {
      console.error('Failed to mark all present:', error);
    }
  }, [teachers, broadcast, refresh]);

  const markAllAbsentForDay = useCallback(async (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const promises = teachers.map(teacher => 
        fetch('/api/data/attendance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
          },
          body: JSON.stringify({
            teacherId: teacher.id,
            date: dateString,
            status: 'absent'
          }),
        })
      );

      await Promise.all(promises);
      
      // Broadcast the change to other tabs
      broadcast('attendance-updated', { date: dateString, status: 'absent', bulk: true });
      
      // Refresh data to get latest state
      refresh();
    } catch (error) {
      console.error('Failed to mark all absent:', error);
    }
  }, [teachers, broadcast, refresh]);

  const getMonthStats = () => {
    const totalWorkingDays = days.filter(d => !d.isSunday).length;
    const totalPossibleAttendance = teachers.length * totalWorkingDays;
    const totalPresent = attendance.filter(a => a.status === 'present' || a.status === 'late').length;
    const totalLate = attendance.filter(a => a.status === 'late').length;
    const attendanceRate = totalPossibleAttendance > 0 ? (totalPresent / totalPossibleAttendance) * 100 : 0;
    
    return { totalWorkingDays, attendanceRate: Math.round(attendanceRate), totalLate };
  };

  // Apply special attendance rules
  useEffect(() => {
    const applySpecialRules = () => {
      const updated = [...attendance];
      let hasChanges = false;

      teachers.forEach(teacher => {
        // Rule: If absent on Saturday and Monday, mark Sunday as absent too
        days.forEach(day => {
          if (day.date.getDay() === 6) { // Saturday
            const satDate = day.date;
            const sunDate = new Date(satDate);
            sunDate.setDate(sunDate.getDate() + 1);
            const monDate = new Date(satDate);
            monDate.setDate(monDate.getDate() + 2);

            const satAttendance = getAttendanceStatus(teacher.id, satDate);
            const monAttendance = getAttendanceStatus(teacher.id, monDate);

            if (satAttendance === 'absent' && monAttendance === 'absent') {
              // Mark Sunday as absent (even though it's normally off)
              const sunRecord = updated.find(a => 
                a.teacherId === teacher.id && 
                new Date(a.date).toDateString() === sunDate.toDateString()
              );
              
              if (!sunRecord) {
                updated.push({
                  teacherId: teacher.id,
                  date: sunDate.toISOString(),
                  status: 'absent'
                });
                hasChanges = true;
              }
            }
          }
        });

        // Rule: Holiday days count as present (unless Sunday or exception)
        days.forEach(day => {
          if (isHoliday(day.date) && !day.isSunday) {
            // Check holiday exception rule: if previous day AND next day are absent, holiday is also absent
            const prevDate = new Date(day.date);
            prevDate.setDate(prevDate.getDate() - 1);
            const nextDate = new Date(day.date);
            nextDate.setDate(nextDate.getDate() + 1);

            const prevAttendance = getAttendanceStatus(teacher.id, prevDate);
            const nextAttendance = getAttendanceStatus(teacher.id, nextDate);

            // If both previous and next day are absent, mark holiday as absent
            if (prevAttendance === 'absent' && nextAttendance === 'absent') {
              const existingRecord = updated.find(a => 
                a.teacherId === teacher.id && 
                new Date(a.date).toDateString() === day.date.toDateString()
              );

              if (!existingRecord) {
                updated.push({
                  teacherId: teacher.id,
                  date: day.date.toISOString(),
                  status: 'absent'
                });
                hasChanges = true;
              } else if (existingRecord.status !== 'absent') {
                existingRecord.status = 'absent';
                hasChanges = true;
              }
            } else {
              // Normal holiday rule: mark as present
              const existingRecord = updated.find(a => 
                a.teacherId === teacher.id && 
                new Date(a.date).toDateString() === day.date.toDateString()
              );

              if (!existingRecord) {
                updated.push({
                  teacherId: teacher.id,
                  date: day.date.toISOString(),
                  status: 'present'
                });
                hasChanges = true;
              } else if (existingRecord.status === 'absent') {
                existingRecord.status = 'present';
                hasChanges = true;
              }
            }
          }
        });
      });

      if (hasChanges) {
        setAttendance(updated);
      }
    };

    applySpecialRules();
  }, [attendance.length, holidays]); // Only run when attendance records count changes or holidays change

  return {
    attendance,
    days,
    isHoliday,
    getAttendanceStatus,
    toggleAttendance,
    markAllPresentForDay,
    markAllAbsentForDay,
    getMonthStats,
    loading,
    error,
    refresh
  };
};