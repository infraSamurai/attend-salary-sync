import React from "react";
import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAttendanceLogic } from "@/hooks/useAttendanceLogic";
import { useDataSync } from "@/hooks/useDataSync";
import { useAuth } from "@/contexts/AuthContext";
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
  const { isAuthenticated } = useAuth();

  // Use data sync hook for teachers
  const { data: teachersData, loading: teachersLoading, isOnline, refresh: refreshTeachers } = useDataSync({
    url: '/api/data/teachers',
    enabled: isAuthenticated,
    onData: (responseData) => {
      if (responseData?.teachers) {
        setTeachers(responseData.teachers);
      }
    }
  });

  const {
    days,
    isHoliday,
    getAttendanceStatus,
    toggleAttendance,
    markAllPresentForDay,
    markAllAbsentForDay,
    getMonthStats,
    loading: attendanceLoading,
    refresh: refreshAttendance
  } = useAttendanceLogic(teachers, holidays, currentDate, isAuthenticated);

  const stats = getMonthStats();

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const handleRefresh = () => {
    refreshTeachers();
    refreshAttendance();
  };

  if (teachersLoading && teachers.length === 0) return (
    <div className="flex items-center justify-center p-8">
      <RefreshCw className="w-6 h-6 animate-spin mr-2" />
      Loading teachers...
    </div>
  );

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
                {!isOnline && <WifiOff className="w-4 h-4 text-red-500" />}
                {isOnline && <Wifi className="w-4 h-4 text-green-500" />}
              </CardTitle>
              <CardDescription className="flex flex-col">
                <span>Mark daily attendance for all teachers</span>
                <span className="block text-xs mt-1 text-blue-600 font-medium">
                  Manual sync mode - Click "Sync Now" to get latest data
                </span>
                {attendanceLoading && (
                  <div className="flex items-center mt-1 text-xs text-muted-foreground">
                    <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                    Syncing data...
                  </div>
                )}
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                onClick={handleRefresh}
                disabled={attendanceLoading || teachersLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${(attendanceLoading || teachersLoading) ? 'animate-spin' : ''}`} />
                {(attendanceLoading || teachersLoading) ? 'Syncing...' : 'Sync Now'}
              </Button>
              <AttendanceStats teachers={teachers} attendanceRate={stats.attendanceRate} totalLate={stats.totalLate} />
            </div>
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