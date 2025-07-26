import React, { useState, useEffect } from "react";
import { DollarSign, Download, TrendingDown, Calculator, PieChart } from "lucide-react";
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RechartsPieChart, Cell } from "recharts";
import localforage from "localforage";
import { Teacher, AttendanceRecord } from "@/types/attendance";

interface SalaryData {
  teacherId: string;
  teacherName: string;
  baseSalary: number;
  daysPresent: number;
  daysAbsent: number;
  daysLate: number;
  totalWorkingDays: number;
  deductions: number;
  netSalary: number;
  attendanceBonus: number;
}

interface MonthlySalaryData {
  month: string;
  totalPayroll: number;
  totalDeductions: number;
  averageSalary: number;
}

const SalaryReports: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("current-month");
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [salaryData, setSalaryData] = useState<SalaryData[]>([]);
  const [monthlySalaryData, setMonthlySalaryData] = useState<MonthlySalaryData[]>([]);
  const [settings, setSettings] = useState({ defaultBaseSalary: 30000, deductionPerAbsentDay: 1000 });
  const [overallStats, setOverallStats] = useState({
    totalPayroll: 0,
    totalDeductions: 0,
    averageSalary: 0,
    highestPaid: "",
    lowestPaid: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (teachers.length) {
      calculateSalaryData();
    }
  }, [teachers, attendance, selectedPeriod, settings]);

  const loadData = async () => {
    const [teachersData, attendanceData, settingsData] = await Promise.all([
      localforage.getItem<Teacher[]>("teachers"),
      localforage.getItem<AttendanceRecord[]>("attendance"),
      localforage.getItem<any>("appSettings"),
    ]);

    setTeachers(teachersData || []);
    setAttendance(attendanceData || []);
    if (settingsData) {
      setSettings({
        defaultBaseSalary: settingsData.defaultBaseSalary || 30000,
        deductionPerAbsentDay: settingsData.deductionPerAbsentDay || 1000,
      });
    }
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

  const getWorkingDaysInRange = (startDate: Date, endDate: Date) => {
    const days = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      if (isWorkingDay(d)) {
        days.push(new Date(d));
      }
    }
    return days;
  };

  const calculateSalaryData = () => {
    const { startDate, endDate } = getDateRange();
    const workingDays = getWorkingDaysInRange(startDate, endDate);
    
    const salaries: SalaryData[] = teachers.map(teacher => {
      const teacherAttendance = attendance.filter(record => {
        const recordDate = new Date(record.date);
        return record.teacherId === teacher.id && 
               recordDate >= startDate && 
               recordDate <= endDate;
      });

      const daysPresent = teacherAttendance.filter(r => r.status === 'present').length;
      const daysLate = teacherAttendance.filter(r => r.status === 'late').length;
      const daysAbsent = teacherAttendance.filter(r => r.status === 'absent').length;
      const totalWorkingDays = workingDays.length;
      
      // Calculate salary
      const baseSalary = settings.defaultBaseSalary;
      const deductions = daysAbsent * settings.deductionPerAbsentDay;
      
      // Attendance bonus: 5% bonus if attendance > 95%, 2% if > 90%
      const attendanceRate = totalWorkingDays > 0 ? ((daysPresent + daysLate) / totalWorkingDays) * 100 : 0;
      let attendanceBonus = 0;
      if (attendanceRate > 95) {
        attendanceBonus = baseSalary * 0.05;
      } else if (attendanceRate > 90) {
        attendanceBonus = baseSalary * 0.02;
      }
      
      const netSalary = baseSalary - deductions + attendanceBonus;

      return {
        teacherId: teacher.id,
        teacherName: teacher.name,
        baseSalary,
        daysPresent,
        daysAbsent,
        daysLate,
        totalWorkingDays,
        deductions,
        netSalary: Math.max(0, netSalary), // Ensure non-negative
        attendanceBonus,
      };
    });

    setSalaryData(salaries);

    // Calculate overall stats
    const totalPayroll = salaries.reduce((sum, salary) => sum + salary.netSalary, 0);
    const totalDeductions = salaries.reduce((sum, salary) => sum + salary.deductions, 0);
    const averageSalary = salaries.length > 0 ? totalPayroll / salaries.length : 0;
    
    const sortedSalaries = [...salaries].sort((a, b) => b.netSalary - a.netSalary);
    const highestPaid = sortedSalaries[0]?.teacherName || "";
    const lowestPaid = sortedSalaries[sortedSalaries.length - 1]?.teacherName || "";

    setOverallStats({
      totalPayroll: Math.round(totalPayroll),
      totalDeductions: Math.round(totalDeductions),
      averageSalary: Math.round(averageSalary),
      highestPaid,
      lowestPaid,
    });

    // Generate monthly data for charts
    if (selectedPeriod === "current-year" || selectedPeriod === "last-3-months") {
      generateMonthlySalaryData();
    }
  };

  const generateMonthlySalaryData = () => {
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

      let totalPayroll = 0;
      let totalDeductions = 0;

      teachers.forEach(teacher => {
        const teacherAttendance = monthAttendance.filter(r => r.teacherId === teacher.id);
        const daysAbsent = teacherAttendance.filter(r => r.status === 'absent').length;
        const deductions = daysAbsent * settings.deductionPerAbsentDay;
        totalDeductions += deductions;
        totalPayroll += Math.max(0, settings.defaultBaseSalary - deductions);
      });

      const averageSalary = teachers.length > 0 ? totalPayroll / teachers.length : 0;

      months.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        totalPayroll: Math.round(totalPayroll),
        totalDeductions: Math.round(totalDeductions),
        averageSalary: Math.round(averageSalary),
      });
    }

    setMonthlySalaryData(months);
  };

  const exportToCSV = () => {
    const headers = [
      "Teacher Name", "Base Salary", "Days Present", "Days Absent", "Days Late", 
      "Deductions", "Attendance Bonus", "Net Salary"
    ];
    const csvData = [headers];
    
    salaryData.forEach(salary => {
      csvData.push([
        salary.teacherName,
        salary.baseSalary.toString(),
        salary.daysPresent.toString(),
        salary.daysAbsent.toString(),
        salary.daysLate.toString(),
        salary.deductions.toString(),
        salary.attendanceBonus.toString(),
        salary.netSalary.toString(),
      ]);
    });

    const csvContent = csvData.map(row => row.join(",")).join("\\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `salary-report-${selectedPeriod}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getSalaryStatus = (netSalary: number, baseSalary: number) => {
    const ratio = netSalary / baseSalary;
    if (ratio >= 1.02) return { status: "Excellent", color: "bg-green-100 text-green-800" };
    if (ratio >= 0.95) return { status: "Good", color: "bg-blue-100 text-blue-800" };
    if (ratio >= 0.8) return { status: "Fair", color: "bg-yellow-100 text-yellow-800" };
    return { status: "Poor", color: "bg-red-100 text-red-800" };
  };

  // Data for pie chart
  const pieData = [
    { name: 'Net Salary', value: overallStats.totalPayroll, fill: '#10b981' },
    { name: 'Deductions', value: overallStats.totalDeductions, fill: '#ef4444' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Salary Reports</h2>
          <p className="text-gray-600">Comprehensive payroll analytics and insights</p>
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
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Payroll</p>
                <p className="text-2xl font-bold">{formatCurrency(overallStats.totalPayroll)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingDown className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Deductions</p>
                <p className="text-2xl font-bold">{formatCurrency(overallStats.totalDeductions)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calculator className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Average Salary</p>
                <p className="text-2xl font-bold">{formatCurrency(overallStats.averageSalary)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <PieChart className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Teachers</p>
                <p className="text-2xl font-bold">{teachers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {monthlySalaryData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Monthly Payroll Trend</CardTitle>
              <CardDescription>Total payroll and deductions over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlySalaryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Bar dataKey="totalPayroll" fill="#10b981" />
                  <Bar dataKey="totalDeductions" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Payroll Distribution</CardTitle>
            <CardDescription>Net salary vs deductions breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <defs>
                  <pattern id="green" patternUnits="userSpaceOnUse" width="4" height="4">
                    <rect width="4" height="4" fill="#10b981" />
                  </pattern>
                  <pattern id="red" patternUnits="userSpaceOnUse" width="4" height="4">
                    <rect width="4" height="4" fill="#ef4444" />
                  </pattern>
                </defs>
                <Cell dataKey="value" />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      {overallStats.highestPaid && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-green-600 mb-2">Highest Paid This Period</h3>
              <p className="text-2xl font-bold">{overallStats.highestPaid}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-orange-600 mb-2">Needs Attention</h3>
              <p className="text-2xl font-bold">{overallStats.lowestPaid}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Salary Table */}
      <Card>
        <CardHeader>
          <CardTitle>Individual Salary Details</CardTitle>
          <CardDescription>Complete breakdown of teacher salaries</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Teacher Name</TableHead>
                <TableHead>Base Salary</TableHead>
                <TableHead>Present</TableHead>
                <TableHead>Absent</TableHead>
                <TableHead>Late</TableHead>
                <TableHead>Deductions</TableHead>
                <TableHead>Bonus</TableHead>
                <TableHead>Net Salary</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salaryData.map((salary) => {
                const salaryStatus = getSalaryStatus(salary.netSalary, salary.baseSalary);
                return (
                  <TableRow key={salary.teacherId}>
                    <TableCell className="font-medium">{salary.teacherName}</TableCell>
                    <TableCell>{formatCurrency(salary.baseSalary)}</TableCell>
                    <TableCell>{salary.daysPresent}</TableCell>
                    <TableCell>{salary.daysAbsent}</TableCell>
                    <TableCell>{salary.daysLate}</TableCell>
                    <TableCell className="text-red-600">
                      -{formatCurrency(salary.deductions)}
                    </TableCell>
                    <TableCell className="text-green-600">
                      +{formatCurrency(salary.attendanceBonus)}
                    </TableCell>
                    <TableCell className="font-bold">
                      {formatCurrency(salary.netSalary)}
                    </TableCell>
                    <TableCell>
                      <Badge className={salaryStatus.color}>
                        {salaryStatus.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalaryReports;