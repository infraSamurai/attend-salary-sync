
import React, { useState, useEffect } from "react";
import localforage from "localforage";
import { Calculator, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SalaryData {
  teacherId: string;
  teacherName: string;
  baseSalary: number;
  daysPresent: number;
  daysAbsent: number;
  computedSalary: number;
  deductions: number;
}

const SalaryCalculator = () => {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [teachers, setTeachers] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [salaryData, setSalaryData] = useState<any[]>([]);

  useEffect(() => {
    localforage.getItem("teachers").then((data) => setTeachers(data || []));
    localforage.getItem("attendance").then((data) => setAttendance(data || []));
  }, []);

  useEffect(() => {
    // Compute salary data for the selected month
    if (!teachers.length) return;
    const [year, month] = selectedMonth.split("-").map(Number);
    const daysInMonth = 30; // Always use 30 days for salary calculation
    // Build a list of all days in the month
    const allDays: Date[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      allDays.push(new Date(year, month - 1, day));
    }
    const monthAttendance = attendance.filter((a: any) => {
      const d = new Date(a.date);
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    });
    const data = teachers.map((teacher: any) => {
      // For each day, determine status
      let daysPresent = 0;
      let daysAbsent = 0;
      let daysLeave = 0;
      for (const day of allDays) {
        const isSunday = day.getDay() === 0;
        const record = monthAttendance.find((a: any) => a.teacherId === teacher.id && new Date(a.date).toDateString() === day.toDateString());
        if (isSunday) {
          // If there is an explicit absent record for Sunday, count as absent
          if (record && record.status === 'absent') {
            daysAbsent++;
          } else {
            daysPresent++;
          }
        } else {
          // For non-Sundays, present or late count as present, absent as absent
          if (record && (record.status === 'present' || record.status === 'late')) {
            daysPresent++;
          } else {
            daysAbsent++;
          }
        }
      }
      // 1 leave allowed per month (first absent is leave, not deducted)
      if (daysAbsent > 0) {
        daysLeave = 1;
        daysAbsent = daysAbsent - 1;
      }
      // Bonus: if no absents or leaves, add 1 day salary
      let bonus = 0;
      if (daysAbsent === 0 && daysLeave === 0) {
        bonus = 1;
      }
      const dailyWage = teacher.baseSalary ? teacher.baseSalary / 30 : 0;
      const computedSalary = dailyWage * (daysPresent + bonus) + dailyWage * daysLeave; // leave is paid, bonus is paid
      const deductions = dailyWage * daysAbsent;
      return {
        teacherId: teacher.id,
        teacherName: teacher.name,
        baseSalary: teacher.baseSalary || 0,
        daysPresent,
        daysAbsent,
        daysLeave,
        bonus,
        computedSalary: Math.round(computedSalary),
        deductions: Math.round(deductions)
      };
    });
    setSalaryData(data);
  }, [teachers, attendance, selectedMonth]);

  const months = [
    { value: "2024-01", label: "January 2024" },
    { value: "2024-02", label: "February 2024" },
    { value: "2024-03", label: "March 2024" },
    { value: "2024-04", label: "April 2024" },
    { value: "2024-05", label: "May 2024" },
    { value: "2024-06", label: "June 2024" },
  ];

  const totalBaseSalary = salaryData.reduce((sum, data) => sum + data.baseSalary, 0);
  const totalComputedSalary = salaryData.reduce((sum, data) => sum + data.computedSalary, 0);
  const totalDeductions = salaryData.reduce((sum, data) => sum + data.deductions, 0);

  const exportToCsv = () => {
    const csvContent = [
      ["Teacher Name", "Base Salary", "Days Present", "Days Absent", "Computed Salary", "Deductions", "Net Salary"],
      ...salaryData.map(data => [
        data.teacherName,
        data.baseSalary,
        data.daysPresent,
        data.daysAbsent,
        data.computedSalary,
        data.deductions,
        data.computedSalary - data.deductions
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `salary-report-${selectedMonth}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Calculator className="w-5 h-5" />
                <span>Salary Calculator</span>
              </CardTitle>
              <CardDescription>
                Calculate monthly salaries based on attendance
              </CardDescription>
            </div>
            <div className="flex items-center space-x-3">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={exportToCsv}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">₹{totalBaseSalary.toLocaleString()}</div>
                <p className="text-sm text-gray-600">Total Base Salary</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">₹{totalComputedSalary.toLocaleString()}</div>
                <p className="text-sm text-gray-600">Total Computed Salary</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-red-600">₹{totalDeductions.toLocaleString()}</div>
                <p className="text-sm text-gray-600">Total Deductions</p>
              </CardContent>
            </Card>
          </div>

          {/* Salary Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Base Salary</TableHead>
                  <TableHead>Days Present</TableHead>
                  <TableHead>Days Absent</TableHead>
                  <TableHead>Computed Salary</TableHead>
                  <TableHead>Deductions</TableHead>
                  <TableHead>Net Salary</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Leave</TableHead>
                  <TableHead>Bonus</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salaryData.map((data) => {
                  const netSalary = data.computedSalary - data.deductions;
                  const attendancePercentage = (data.daysPresent / 30) * 100;
                  
                  return (
                    <TableRow key={data.teacherId}>
                      <TableCell>
                        <div className="font-medium">{data.teacherName}</div>
                      </TableCell>
                      <TableCell>₹{data.baseSalary.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={data.daysPresent >= 25 ? "default" : "destructive"}>
                          {data.daysPresent} days
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={data.daysAbsent <= 3 ? "secondary" : "destructive"}>
                          {data.daysAbsent} days
                        </Badge>
                      </TableCell>
                      <TableCell>₹{data.computedSalary.toLocaleString()}</TableCell>
                      <TableCell className="text-red-600">
                        ₹{data.deductions.toLocaleString()}
                      </TableCell>
                      <TableCell className="font-medium">
                        ₹{netSalary.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={attendancePercentage >= 90 ? "default" : 
                                   attendancePercentage >= 75 ? "secondary" : "destructive"}
                        >
                          {attendancePercentage.toFixed(0)}%
                        </Badge>
                      </TableCell>
                      <TableCell>{data.daysLeave}</TableCell>
                      <TableCell>{data.bonus}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalaryCalculator;
