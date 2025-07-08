import { useState } from "react";
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
  
  // Mock teachers data - in real app this would come from props or context
  const teachers: Teacher[] = [
    { id: "1", name: "Sarah Johnson", designation: "Mathematics", photo: "/placeholder.svg" },
    { id: "2", name: "Michael Chen", designation: "Science" },
    { id: "3", name: "Emily Davis", designation: "English" },
    { id: "4", name: "Robert Wilson", designation: "History" },
    { id: "5", name: "Lisa Anderson", designation: "Physics" },
    { id: "6", name: "David Brown", designation: "Chemistry" },
    { id: "7", name: "Maria Garcia", designation: "Spanish" },
    { id: "8", name: "James Miller", designation: "PE" },
    { id: "9", name: "Anna Taylor", designation: "Art" },
    { id: "10", name: "Kevin Lee", designation: "Music" },
  ];

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
            <AttendanceStats teachers={teachers} attendanceRate={stats.attendanceRate} />
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