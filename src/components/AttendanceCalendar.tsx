
import { useState } from "react";
import { ChevronLeft, ChevronRight, Check, X, Users, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Teacher {
  id: string;
  name: string;
  designation: string;
  photo?: string;
}

interface AttendanceRecord {
  teacherId: string;
  date: string;
  isPresent: boolean;
}

const AttendanceCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  
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

  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  const getDaysInMonth = (date: Date) => {
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

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
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

  const stats = getMonthStats();

  return (
    <div className="space-y-6">
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
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">
                <Users className="w-3 h-3 mr-1" />
                {teachers.length} Teachers
              </Badge>
              <Badge variant="outline">
                {stats.attendanceRate}% Present
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <h3 className="text-lg font-semibold">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Attendance Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-background min-w-[200px]">Teacher</TableHead>
                  {days.map((day) => (
                    <TableHead key={day.dayNumber} className="text-center min-w-[60px] p-2">
                      <div className="flex flex-col items-center space-y-1">
                        <span className="text-xs font-medium">{day.dayNumber}</span>
                        <span className={`text-xs ${day.isWeekend ? 'text-red-500' : 'text-gray-500'}`}>
                          {day.date.toLocaleDateString('en-US', { weekday: 'short' })}
                        </span>
                        {!day.isSunday && (
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0 text-xs"
                              onClick={() => markAllPresentForDay(day.date)}
                              title="Mark all present"
                            >
                              ✓
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0 text-xs"
                              onClick={() => markAllAbsentForDay(day.date)}
                              title="Mark all absent"
                            >
                              ✗
                            </Button>
                          </div>
                        )}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {teachers.map((teacher) => (
                  <TableRow key={teacher.id}>
                    <TableCell className="sticky left-0 bg-background">
                      <div className="flex items-center space-x-3 min-w-[180px]">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={teacher.photo} alt={teacher.name} />
                          <AvatarFallback className="text-xs">
                            {teacher.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-sm">{teacher.name}</div>
                          <div className="text-xs text-gray-500">{teacher.designation}</div>
                        </div>
                      </div>
                    </TableCell>
                    {days.map((day) => {
                      const isPresent = getAttendanceStatus(teacher.id, day.date);
                      const isSunday = day.isSunday;
                      
                      return (
                        <TableCell key={day.dayNumber} className="text-center p-2">
                          {isSunday ? (
                            <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded text-xs text-gray-500">
                              OFF
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`w-10 h-10 rounded-full p-0 ${
                                isPresent === true
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                  : isPresent === false
                                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                  : 'hover:bg-gray-100'
                              }`}
                              onClick={() => toggleAttendance(teacher.id, day.date)}
                            >
                              {isPresent === true ? (
                                <Check className="w-4 h-4" />
                              ) : isPresent === false ? (
                                <X className="w-4 h-4" />
                              ) : (
                                <span className="text-xs text-gray-400">-</span>
                              )}
                            </Button>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-100 rounded flex items-center justify-center">
                <Check className="w-3 h-3 text-green-700" />
              </div>
              <span>Present</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-100 rounded flex items-center justify-center">
                <X className="w-3 h-3 text-red-700" />
              </div>
              <span>Absent</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-500">
                OFF
              </div>
              <span>Sunday (Non-working)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceCalendar;
