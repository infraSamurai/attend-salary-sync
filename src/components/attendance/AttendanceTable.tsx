import { Check, X, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Teacher, DayInfo } from "@/types/attendance";

interface AttendanceTableProps {
  teachers: Teacher[];
  days: DayInfo[];
  getAttendanceStatus: (teacherId: string, date: Date) => 'present' | 'absent' | 'late' | undefined;
  toggleAttendance: (teacherId: string, date: Date) => void;
  markAllPresentForDay: (date: Date) => void;
  markAllAbsentForDay: (date: Date) => void;
  isHoliday: (date: Date) => boolean;
}

const AttendanceTable = ({
  teachers,
  days,
  getAttendanceStatus,
  toggleAttendance,
  markAllPresentForDay,
  markAllAbsentForDay,
  isHoliday
}: AttendanceTableProps) => {
  return (
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
                const status = getAttendanceStatus(teacher.id, day.date);
                const isSunday = day.isSunday;
                const isHolidayDay = isHoliday(day.date);
                
                return (
                  <TableCell key={day.dayNumber} className="text-center p-1 sm:p-2">
                    {isSunday ? (
                      <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-gray-100 rounded text-xs text-gray-500">
                        OFF
                      </div>
                    ) : isHolidayDay ? (
                      <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-yellow-100 border border-yellow-300 rounded text-xs text-yellow-800 relative">
                        🎉
                        {status === 'absent' && (
                          <AlertCircle className="w-2 h-2 absolute -top-1 -right-1 text-red-500" />
                        )}
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full p-0 touch-manipulation ${
                          status === 'present'
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : status === 'late'
                            ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                            : status === 'absent'
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'hover:bg-gray-100'
                        }`}
                        onClick={() => toggleAttendance(teacher.id, day.date)}
                        title={status === 'late' ? 'Late arrival' : status || 'Not marked'}
                      >
                        {status === 'present' ? (
                          <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                        ) : status === 'late' ? (
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                        ) : status === 'absent' ? (
                          <X className="w-3 h-3 sm:w-4 sm:h-4" />
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
  );
};

export default AttendanceTable;