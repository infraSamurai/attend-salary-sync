import React, { useState } from "react";
import { FileText, BarChart3, DollarSign, TrendingUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AttendanceReports from "./AttendanceReports";
import SalaryReports from "./SalaryReports";

const Reports: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <FileText className="w-8 h-8 text-blue-600" />
          Reports & Analytics
        </h1>
        <p className="text-gray-600 mt-2">
          Comprehensive insights into attendance patterns, salary calculations, and institutional performance
        </p>
      </div>

      {/* Quick Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Report Types</p>
                <p className="text-2xl font-bold">2</p>
                <p className="text-xs text-gray-500">Attendance & Salary</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Data Insights</p>
                <p className="text-2xl font-bold">Live</p>
                <p className="text-xs text-gray-500">Real-time analytics</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Export Options</p>
                <p className="text-2xl font-bold">CSV</p>
                <p className="text-xs text-gray-500">Download reports</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Reports Section */}
      <Tabs defaultValue="attendance" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="attendance" className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>Attendance Reports</span>
          </TabsTrigger>
          <TabsTrigger value="salary" className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4" />
            <span>Salary Reports</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="mt-6">
          <AttendanceReports />
        </TabsContent>

        <TabsContent value="salary" className="mt-6">
          <SalaryReports />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;