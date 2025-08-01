import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Upload, AlertCircle } from "lucide-react";
import localforage from "localforage";

// Import the backup data
import backupData from "../attendsync-backup.json";

const DataLoader: React.FC = () => {
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasExistingData, setHasExistingData] = useState(false);

  useEffect(() => {
    checkExistingData();
  }, []);

  const checkExistingData = async () => {
    try {
      const teachers = await localforage.getItem("teachers");
      const attendance = await localforage.getItem("attendance");
      
      if (teachers && Array.isArray(teachers) && teachers.length > 0) {
        setHasExistingData(true);
      }
      
      if (attendance && Array.isArray(attendance) && attendance.length > 0) {
        setHasExistingData(true);
      }
    } catch (error) {
      console.error("Error checking existing data:", error);
    }
  };

  const loadBackupData = async () => {
    setIsLoading(true);
    try {
      // Load each data type from the backup to LocalForage
      if (backupData.teachers) {
        await localforage.setItem("teachers", backupData.teachers);
        console.log(`Loaded ${backupData.teachers.length} teachers to LocalForage`);
      }
      
      if (backupData.attendance) {
        await localforage.setItem("attendance", backupData.attendance);
        console.log(`Loaded ${backupData.attendance.length} attendance records to LocalForage`);
      }
      
      if (backupData.teacher_id_counter) {
        await localforage.setItem("teacher_id_counter", backupData.teacher_id_counter);
        console.log(`Set teacher ID counter to ${backupData.teacher_id_counter}`);
      }

      // Set any other data that might be in the backup
      const otherKeys = Object.keys(backupData).filter(key => 
        !['teachers', 'attendance', 'teacher_id_counter'].includes(key)
      );
      
      for (const key of otherKeys) {
        await localforage.setItem(key, (backupData as any)[key]);
        console.log(`Loaded ${key} data to LocalForage`);
      }

      // Now migrate the data to the server-side storage via API
      try {
        const authToken = localStorage.getItem('auth_token');
        const token = localStorage.getItem('token');
        const finalToken = authToken || token;
        
        console.log('🔍 DEBUG: Migration attempt starting...');
        console.log('🔑 auth_token:', authToken ? 'exists' : 'missing');
        console.log('🔑 token:', token ? 'exists' : 'missing');
        console.log('🔑 final token:', finalToken ? 'exists' : 'missing');
        console.log('📊 Data to migrate:', {
          teachers: backupData.teachers?.length || 0,
          attendance: backupData.attendance?.length || 0,
          teacher_id_counter: backupData.teacher_id_counter
        });

        const response = await fetch('/api/data/migrate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${finalToken}`,
          },
          body: JSON.stringify(backupData),
        });

        console.log('🌐 Migration response status:', response.status);
        console.log('🌐 Migration response headers:', Object.fromEntries(response.headers.entries()));

        if (response.ok) {
          const result = await response.json();
          console.log('✅ Data migrated to server successfully:', result);
          alert(`Data loaded and migrated successfully!\n- ${result.migrated.teachers} teachers\n- ${result.migrated.attendance} attendance records\n\nPlease refresh the page to see the data.`);
        } else {
          const responseText = await response.text();
          console.error('❌ Migration failed - Response text:', responseText);
          
          let errorData = {};
          try {
            errorData = JSON.parse(responseText);
          } catch (e) {
            console.error('Failed to parse error response as JSON');
          }
          
          console.error('❌ Migration failed:', response.status, errorData);
          
          if (response.status === 403) {
            alert("Data loaded to local storage successfully, but server migration failed.\nYou need admin or manager privileges to migrate data to the server.\nPlease login as admin or manager and try again.\n\nDEBUG: Check browser console for details.");
          } else if (response.status === 401) {
            alert("Data loaded to local storage successfully, but server migration failed.\nYou are not logged in. Please login and try again.\n\nDEBUG: Check browser console for details.");
          } else {
            alert(`Data loaded to local storage successfully, but server migration failed.\nError: ${errorData.error || 'Unknown error'}\nStatus: ${response.status}\n\nDEBUG: Check browser console for details.`);
          }
        }
      } catch (migrateError) {
        console.error('💥 Migration exception:', migrateError);
        alert("Data loaded to local storage successfully, but server migration failed. Please check your connection and try again.\n\nDEBUG: Check browser console for details.");
      }

      setDataLoaded(true);
      setHasExistingData(true);
    } catch (error) {
      console.error("Error loading backup data:", error);
      alert("Error loading data. Please check the console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  const clearAllData = async () => {
    if (window.confirm("Are you sure you want to clear all existing data? This cannot be undone.")) {
      try {
        await localforage.clear();
        setHasExistingData(false);
        setDataLoaded(false);
        alert("All data cleared successfully!");
      } catch (error) {
        console.error("Error clearing data:", error);
        alert("Error clearing data. Please check the console for details.");
      }
    }
  };

  const refreshPage = () => {
    window.location.reload();
  };

  return (
    <Card className="max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Data Management
        </CardTitle>
        <CardDescription>
          Load your backup data or manage existing data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasExistingData && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
            <AlertCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-700">
              Existing data found in storage
            </span>
          </div>
        )}

        <div className="space-y-2">
          <h4 className="font-medium">Backup Data Available:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• {backupData.teachers?.length || 0} Teachers</li>
            <li>• {backupData.attendance?.length || 0} Attendance Records</li>
            <li>• July 2025 attendance data</li>
          </ul>
        </div>

        <div className="space-y-2">
          <Button 
            onClick={loadBackupData} 
            disabled={isLoading} 
            className="w-full"
          >
            {isLoading ? "Loading..." : "Load Backup Data"}
          </Button>
          
          {hasExistingData && (
            <Button 
              onClick={clearAllData} 
              variant="destructive" 
              size="sm" 
              className="w-full"
            >
              Clear All Data
            </Button>
          )}
          
          {dataLoaded && (
            <Button 
              onClick={refreshPage} 
              variant="outline" 
              className="w-full"
            >
              Refresh Page
            </Button>
          )}
        </div>

        <div className="text-xs text-gray-500 mt-4">
          <p>This component loads data from the backup JSON file located in the frontend directory.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataLoader;