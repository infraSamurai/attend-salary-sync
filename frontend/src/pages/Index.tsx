
import { useState, useEffect } from "react";
import { Calendar, Users, Calculator, FileText, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TeacherManagement from "@/components/TeacherManagement";
import AttendanceCalendar from "@/components/AttendanceCalendar";
import SalaryCalculator from "@/components/SalaryCalculator";
import Reports from "@/components/Reports";
import SettingsDialog from "@/components/SettingsDialog";
import DataLoader from "@/components/DataLoader";
import LoginScreen from "@/components/LoginScreen";
import { useAuth } from "@/contexts/AuthContext";
import React from "react";
import localforage from "localforage";

const Index = () => {
  const { isAuthenticated, isLoading, user, logout, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState("attendance");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [hasData, setHasData] = useState<boolean | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      checkForData();
    }
  }, [isAuthenticated]);

  const checkForData = async () => {
    try {
      const teachers = await localforage.getItem("teachers");
      const attendance = await localforage.getItem("attendance");
      
      if ((teachers && Array.isArray(teachers) && teachers.length > 0) || 
          (attendance && Array.isArray(attendance) && attendance.length > 0)) {
        setHasData(true);
      } else {
        setHasData(false);
      }
    } catch (error) {
      console.error("Error checking for data:", error);
      setHasData(false);
    }
  };

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AttendSync</h1>
                <p className="text-sm text-gray-500">Attendance & Salary Management</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-600 mr-4">
                Welcome, <span className="font-medium">{user?.name}</span>
                <div className="text-xs text-gray-500 capitalize">{user?.role}</div>
              </div>
              <Button variant="outline" size="sm" onClick={async () => {
                // Export all localForage data
                const keys = await localforage.keys();
                const exportData: Record<string, any> = {};
                for (const key of keys) {
                  exportData[key] = await localforage.getItem(key);
                }
                const blob = new Blob([JSON.stringify(exportData)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'attendsync-backup.json';
                link.click();
                URL.revokeObjectURL(url);
              }}>
                Export Backup
              </Button>
              <Button variant="outline" size="sm" onClick={() => {
                // Import localForage data
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = 'application/json';
                fileInput.onchange = async (event: any) => {
                  const file = event.target.files[0];
                  if (!file) return;
                  const text = await file.text();
                  const importedData = JSON.parse(text);
                  for (const key in importedData) {
                    await localforage.setItem(key, importedData[key]);
                  }
                  alert('Data restored! Please refresh the page.');
                };
                fileInput.click();
              }}>
                Import Backup
              </Button>
              {hasPermission('manage_settings') && (
                <Button variant="outline" size="sm" onClick={() => setIsSettingsOpen(true)}>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Show DataLoader if no data is found */}
        {hasData === false && (
          <DataLoader />
        )}
        
        {/* Show main app if data exists or still checking */}
        {hasData !== false && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full lg:w-auto">
            {hasPermission('read_attendance') && (
              <TabsTrigger value="attendance" className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">Attendance</span>
              </TabsTrigger>
            )}
            {hasPermission('read_teachers') && (
              <TabsTrigger value="teachers" className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Teachers</span>
              </TabsTrigger>
            )}
            {hasPermission('read_salary') && (
              <TabsTrigger value="salary" className="flex items-center space-x-2">
                <Calculator className="w-4 h-4" />
                <span className="hidden sm:inline">Salary</span>
              </TabsTrigger>
            )}
            {hasPermission('read_reports') && (
              <TabsTrigger value="reports" className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Reports</span>
              </TabsTrigger>
            )}
          </TabsList>

          {hasPermission('read_attendance') && (
            <TabsContent value="attendance" className="mt-6">
              <AttendanceCalendar />
            </TabsContent>
          )}

          {hasPermission('read_teachers') && (
            <TabsContent value="teachers" className="mt-6">
              <TeacherManagement />
            </TabsContent>
          )}

          {hasPermission('read_salary') && (
            <TabsContent value="salary" className="mt-6">
              <SalaryCalculator />
            </TabsContent>
          )}

          {hasPermission('read_reports') && (
            <TabsContent value="reports" className="mt-6">
              <Reports />
            </TabsContent>
          )}
        </Tabs>
        )}
      </main>

      {/* Settings Dialog */}
      {hasPermission('manage_settings') && (
        <SettingsDialog 
          open={isSettingsOpen} 
          onOpenChange={setIsSettingsOpen} 
        />
      )}
    </div>
  );
};

export default Index;
