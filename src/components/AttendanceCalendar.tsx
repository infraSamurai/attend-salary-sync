
import { useState } from "react";
import { ChevronLeft, ChevronRight, Check, X, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AttendanceRecord {
  teacherId: string;
  date: string;
  status: 'present' | 'absent' | 'holiday';
}

interface Teacher {
  id: string;
  name: string;
  photo?: string;
}

const AttendanceCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  
  // Sample teachers data
  const teachers: Teacher[] = [
    { id: "1", name: "Sarah Johnson", photo: "/placeholder.svg" },
    { id: "2", name: "Michael Chen" },
    { id: "3", name: "Emily Davis" },
  ];

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    // Fill the rest to make 42 cells (6 rows × 7 days)
    while (days.length < 42) {
      days.push(null);
    }
    
    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getAttendanceStatus = (teacherId: string, day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const record = attendance.find(a => a.teacherId === teacherId && a.date === dateStr);
    return record?.status || null;
  };

  const toggleAttendance = (teacherId: string, day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    setAttendance(prev => {
      const existingRecord = prev.find(a => a.teacherId === teacherId && a.date === dateStr);
      
      if (existingRecord) {
        // Toggle between present and absent
        const newStatus = existingRecord.status === 'present' ? 'absent' : 'present';
        return prev.map(a => 
          a.teacherId === teacherId && a.date === dateStr 
            ? { ...a, status: newStatus }
            : a
        );
      } else {
        // Add new record as present
        return [...prev, { teacherId, date: dateStr, status: 'present' as const }];
      }
    });
  };

  const markAllPresent = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    setAttendance(prev => {
      const newAttendance = prev.filter(a => a.date !== dateStr);
      teachers.forEach(teacher => {
        newAttendance.push({ teacherId: teacher.id, date: dateStr, status: 'present' });
      });
      return newAttendance;
    });
  };

  const clearAll = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setAttendance(prev => prev.filter(a => a.date !== dateStr));
  };

  const days = getDaysInMonth(currentDate);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Monthly Attendance</CardTitle>
              <CardDescription>
                Track daily attendance for all teachers
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="text-lg font-semibold min-w-[140px] text-center">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </div>
              <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Calendar Header */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {dayNames.map((day) => (
              <div key={day} className="p-2 text-center font-medium text-gray-500 text-sm">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => (
              <div key={index} className="min-h-[120px] border rounded-lg p-2 bg-white">
                {day && (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{day}</span>
                      <div className="flex space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => markAllPresent(day)}
                        >
                          <Users className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => clearAll(day)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {teachers.map((teacher) => {
                        const status = getAttendanceStatus(teacher.id, day);
                        return (
                          <div
                            key={teacher.id}
                            className="flex items-center space-x-2 cursor-pointer p-1 rounded hover:bg-gray-50"
                            onClick={() => toggleAttendance(teacher.id, day)}
                          >
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={teacher.photo} />
                              <AvatarFallback className="text-xs">
                                {teacher.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 text-xs truncate">
                              {teacher.name.split(' ')[0]}
                            </div>
                            {status === 'present' && (
                              <Check className="w-4 h-4 text-green-600" />
                            )}
                            {status === 'absent' && (
                              <X className="w-4 h-4 text-red-600" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceCalendar;
