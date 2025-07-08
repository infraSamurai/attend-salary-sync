import { useState, useEffect } from "react";
import { AttendanceRecord, Holiday, Teacher, DayInfo } from "@/types/attendance";

export const useAttendanceLogic = (teachers: Teacher[], holidays: Holiday[], currentDate: Date) => {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

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
    return record?.isPresent;
  };

  const toggleAttendance = (teacherId: string, date: Date) => {
    const dateString = date.toISOString();
    const existingIndex = attendance.findIndex(
      a => a.teacherId === teacherId && a.date === dateString
    );

    if (existingIndex >= 0) {
      const updated = [...attendance];
      updated[existingIndex].isPresent = !updated[existingIndex].isPresent;
      setAttendance(updated);
    } else {
      setAttendance([...attendance, {
        teacherId,
        date: dateString,
        isPresent: true
      }]);
    }
  };

  const markAllPresentForDay = (date: Date) => {
    const dateString = date.toISOString();
    const updated = [...attendance];
    
    teachers.forEach(teacher => {
      const existingIndex = updated.findIndex(
        a => a.teacherId === teacher.id && a.date === dateString
      );
      
      if (existingIndex >= 0) {
        updated[existingIndex].isPresent = true;
      } else {
        updated.push({
          teacherId: teacher.id,
          date: dateString,
          isPresent: true
        });
      }
    });
    
    setAttendance(updated);
  };

  const markAllAbsentForDay = (date: Date) => {
    const dateString = date.toISOString();
    const updated = [...attendance];
    
    teachers.forEach(teacher => {
      const existingIndex = updated.findIndex(
        a => a.teacherId === teacher.id && a.date === dateString
      );
      
      if (existingIndex >= 0) {
        updated[existingIndex].isPresent = false;
      } else {
        updated.push({
          teacherId: teacher.id,
          date: dateString,
          isPresent: false
        });
      }
    });
    
    setAttendance(updated);
  };

  const getMonthStats = () => {
    const totalWorkingDays = days.filter(d => !d.isSunday).length;
    const totalPossibleAttendance = teachers.length * totalWorkingDays;
    const totalPresent = attendance.filter(a => a.isPresent).length;
    const attendanceRate = totalPossibleAttendance > 0 ? (totalPresent / totalPossibleAttendance) * 100 : 0;
    
    return { totalWorkingDays, attendanceRate: Math.round(attendanceRate) };
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

            if (satAttendance === false && monAttendance === false) {
              // Mark Sunday as absent (even though it's normally off)
              const sunRecord = updated.find(a => 
                a.teacherId === teacher.id && 
                new Date(a.date).toDateString() === sunDate.toDateString()
              );
              
              if (!sunRecord) {
                updated.push({
                  teacherId: teacher.id,
                  date: sunDate.toISOString(),
                  isPresent: false
                });
                hasChanges = true;
              }
            }
          }
        });

        // Rule: Holiday days count as present (unless Sunday)
        days.forEach(day => {
          if (isHoliday(day.date) && !day.isSunday) {
            const existingRecord = updated.find(a => 
              a.teacherId === teacher.id && 
              new Date(a.date).toDateString() === day.date.toDateString()
            );

            if (!existingRecord) {
              updated.push({
                teacherId: teacher.id,
                date: day.date.toISOString(),
                isPresent: true
              });
              hasChanges = true;
            } else if (!existingRecord.isPresent) {
              existingRecord.isPresent = true;
              hasChanges = true;
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
    getMonthStats
  };
};