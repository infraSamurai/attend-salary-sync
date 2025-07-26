import React, { useState, useEffect } from "react";
import { Calendar, Download, TrendingUp, Users, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import localforage from "localforage";
import { Teacher, AttendanceRecord, Holiday } from "@/types/attendance";

interface AttendanceStats {
  teacherId: string;
  teacherName: string;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  attendanceRate: number;
}

interface MonthlyData {
  month: string;
  attendanceRate: number;
  totalPresent: number;
  totalAbsent: number;
}

const AttendanceReports: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("current-month");
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [overallStats, setOverallStats] = useState({
    totalTeachers: 0,
    averageAttendance: 0,
    totalWorkingDays: 0,
    totalLateArrivals: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (teachers.length && attendance.length) {
      calculateStats();
    }
  }, [teachers, attendance, selectedPeriod]);

  const loadData = async () => {
    const [teachersData, attendanceData, holidaysData] = await Promise.all([
      localforage.getItem<Teacher[]>("teachers"),
      localforage.getItem<AttendanceRecord[]>("attendance"),
      localforage.getItem<Holiday[]>("holidays"),
    ]);

    setTeachers(teachersData || []);
    setAttendance(attendanceData || []);
    setHolidays(holidaysData || []);
  };

  const getDateRange = () => {
    const now = new Date();
    let startDate: Date, endDate: Date;

    switch (selectedPeriod) {
      case "current-month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case "last-month":
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case "current-year":
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      case "last-3-months":
        startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    return { startDate, endDate };
  };

  const isWorkingDay = (date: Date) => {
    const day = date.getDay();
    return day !== 0; // Sunday is not a working day
  };

  const isHoliday = (date: Date) => {
    return holidays.some(holiday => 
      new Date(holiday.date).toDateString() === date.toDateString()
    );
  };

  const getWorkingDaysInRange = (startDate: Date, endDate: Date) => {
    const days = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      if (isWorkingDay(d) && !isHoliday(d)) {
        days.push(new Date(d));
      }
    }
    return days;
  };

  const calculateStats = () => {
    const { startDate, endDate } = getDateRange();
    const workingDays = getWorkingDaysInRange(startDate, endDate);
    
    const stats: AttendanceStats[] = teachers.map(teacher => {
      const teacherAttendance = attendance.filter(record => {
        const recordDate = new Date(record.date);
        return record.teacherId === teacher.id && 
               recordDate >= startDate && 
               recordDate <= endDate;
      });

      const presentDays = teacherAttendance.filter(r => r.status === 'present' || r.status === 'late').length;
      const absentDays = teacherAttendance.filter(r => r.status === 'absent').length;
      const lateDays = teacherAttendance.filter(r => r.status === 'late').length;
      const totalDays = workingDays.length;
      const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

      return {
        teacherId: teacher.id,
        teacherName: teacher.name,
        totalDays,
        presentDays,
        absentDays,
        lateDays,
        attendanceRate: Math.round(attendanceRate * 100) / 100,
      };
    });

    setAttendanceStats(stats);

    // Calculate overall stats
    const totalTeachers = teachers.length;
    const averageAttendance = stats.length > 0 
      ? stats.reduce((sum, stat) => sum + stat.attendanceRate, 0) / stats.length 
      : 0;
    const totalWorkingDays = workingDays.length;
    const totalLateArrivals = stats.reduce((sum, stat) => sum + stat.lateDays, 0);

    setOverallStats({
      totalTeachers,
      averageAttendance: Math.round(averageAttendance * 100) / 100,
      totalWorkingDays,
      totalLateArrivals,
    });

    // Generate monthly data for charts
    if (selectedPeriod === "current-year" || selectedPeriod === "last-3-months") {
      generateMonthlyData();
    }
  };

  const generateMonthlyData = () => {
    const now = new Date();
    const months = [];
    const startMonth = selectedPeriod === "current-year" ? 0 : now.getMonth() - 2;
    const endMonth = selectedPeriod === "current-year" ? 11 : now.getMonth();

    for (let i = startMonth; i <= endMonth; i++) {
      const monthStart = new Date(now.getFullYear(), i, 1);
      const monthEnd = new Date(now.getFullYear(), i + 1, 0);
      const workingDays = getWorkingDaysInRange(monthStart, monthEnd);
      
      const monthAttendance = attendance.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= monthStart && recordDate <= monthEnd;
      });

      const totalPresent = monthAttendance.filter(r => r.status === 'present' || r.status === 'late').length;
      const totalAbsent = monthAttendance.filter(r => r.status === 'absent').length;
      const totalPossible = teachers.length * workingDays.length;
      const attendanceRate = totalPossible > 0 ? (totalPresent / totalPossible) * 100 : 0;

      months.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        attendanceRate: Math.round(attendanceRate * 100) / 100,
        totalPresent,
        totalAbsent,
      });
    }

    setMonthlyData(months);
  };

  const exportToCSV = () => {
    const headers = ["Teacher Name", "Total Days", "Present Days", "Absent Days", "Late Days", "Attendance Rate"];
    const csvData = [headers];
    
    attendanceStats.forEach(stat => {
      csvData.push([
        stat.teacherName,
        stat.totalDays.toString(),
        stat.presentDays.toString(),
        stat.absentDays.toString(),
        stat.lateDays.toString(),
        `${stat.attendanceRate}%`,
      ]);
    });

    const csvContent = csvData.map(row => row.join(",")).join("\\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `attendance-report-${selectedPeriod}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getAttendanceColor = (rate: number) => {
    if (rate >= 90) return "text-green-600";
    if (rate >= 75) return "text-yellow-600";
    return "text-red-600";
  };

  const getAttendanceBadge = (rate: number) => {
    if (rate >= 90) return "bg-green-100 text-green-800";
    if (rate >= 75) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Attendance Reports</h2>
          <p className="text-gray-600">Comprehensive attendance analytics and insights</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current-month">Current Month</SelectItem>
              <SelectItem value="last-month">Last Month</SelectItem>
              <SelectItem value="last-3-months">Last 3 Months</SelectItem>
              <SelectItem value="current-year">Current Year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportToCSV} variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Teachers</p>
                <p className="text-2xl font-bold">{overallStats.totalTeachers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Average Attendance</p>
                <p className="text-2xl font-bold">{overallStats.averageAttendance}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Working Days</p>
                <p className="text-2xl font-bold">{overallStats.totalWorkingDays}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Late Arrivals</p>
                <p className="text-2xl font-bold">{overallStats.totalLateArrivals}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {monthlyData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Attendance Trend</CardTitle>
              <CardDescription>Attendance rate percentage over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="attendanceRate" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Present vs Absent</CardTitle>
              <CardDescription>Comparison of present and absent days</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="totalPresent" fill="#10b981" />
                  <Bar dataKey="totalAbsent" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Report Table */}
      <Card>
        <CardHeader>
          <CardTitle>Teacher Attendance Details</CardTitle>
          <CardDescription>Individual teacher attendance statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Teacher Name</TableHead>
                <TableHead>Total Days</TableHead>
                <TableHead>Present</TableHead>
                <TableHead>Absent</TableHead>
                <TableHead>Late</TableHead>
                <TableHead>Attendance Rate</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendanceStats.map((stat) => (
                <TableRow key={stat.teacherId}>
                  <TableCell className="font-medium">{stat.teacherName}</TableCell>
                  <TableCell>{stat.totalDays}</TableCell>
                  <TableCell>{stat.presentDays}</TableCell>
                  <TableCell>{stat.absentDays}</TableCell>
                  <TableCell>{stat.lateDays}</TableCell>
                  <TableCell className={getAttendanceColor(stat.attendanceRate)}>
                    {stat.attendanceRate}%
                  </TableCell>
                  <TableCell>
                    <Badge className={getAttendanceBadge(stat.attendanceRate)}>
                      {stat.attendanceRate >= 90 ? "Excellent" : 
                       stat.attendanceRate >= 75 ? "Good" : "Needs Improvement"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceReports;