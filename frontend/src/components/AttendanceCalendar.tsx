import React from "react";
import { useState, useEffect } from "react";
import localforage from "localforage";
import { Calendar as CalendarIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAttendanceLogic } from "@/hooks/useAttendanceLogic";
import { Teacher, Holiday } from "@/types/attendance";
import HolidayManager from "./HolidayManager";
import CalendarNavigation from "./attendance/CalendarNavigation";
import AttendanceStats from "./attendance/AttendanceStats";
import AttendanceTable from "./attendance/AttendanceTable";
import AttendanceLegend from "./attendance/AttendanceLegend";

const AttendanceCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [holidays, setHolidays] = useState<Holiday[]>([
    { date: new Date(2024, 9, 31).toISOString(), name: "Diwali", type: "festival" },
    { date: new Date(2024, 2, 13).toISOString(), name: "Holi", type: "festival" },
  ]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    localforage.getItem<Teacher[]>("teachers").then((data) => {
      setTeachers(data || []);
      setLoading(false);
    });
  }, []);

  const {
    days,
    isHoliday,
    getAttendanceStatus,
    toggleAttendance,
    markAllPresentForDay,
    markAllAbsentForDay,
    getMonthStats
  } = useAttendanceLogic(teachers, holidays, currentDate);

  const stats = getMonthStats();

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  if (loading) return <div>Loading teachers...</div>;

  return (
    <div className="space-y-6">
      <HolidayManager 
        holidays={holidays} 
        onHolidaysChange={setHolidays}
        currentMonth={currentDate}
      />
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <CalendarIcon className="w-5 h-5" />
                <span>Attendance Calendar</span>
              </CardTitle>
              <CardDescription>
                Mark daily attendance for all teachers
              </CardDescription>
            </div>
            <AttendanceStats teachers={teachers} attendanceRate={stats.attendanceRate} totalLate={stats.totalLate} />
          </div>
        </CardHeader>
        <CardContent>
          <CalendarNavigation currentDate={currentDate} onNavigate={navigateMonth} />
          
          <AttendanceTable
            teachers={teachers}
            days={days}
            getAttendanceStatus={getAttendanceStatus}
            toggleAttendance={toggleAttendance}
            markAllPresentForDay={markAllPresentForDay}
            markAllAbsentForDay={markAllAbsentForDay}
            isHoliday={isHoliday}
          />

          <AttendanceLegend />
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceCalendar;