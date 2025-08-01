import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Database, HardDrive, AlertCircle, CheckCircle } from "lucide-react";
import localforage from "localforage";
import { useAuth } from "@/contexts/AuthContext";

interface StorageData {
  teachers: any[];
  attendance: any[];
  teacher_id_counter: number;
}

const StorageDebug: React.FC = () => {
  const [localData, setLocalData] = useState<StorageData>({ teachers: [], attendance: [], teacher_id_counter: 0 });
  const [serverData, setServerData] = useState<StorageData>({ teachers: [], attendance: [], teacher_id_counter: 0 });
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [migrating, setMigrating] = useState(false);
  const { user, token, isAuthenticated } = useAuth();

  const loadLocalData = async () => {
    try {
      const teachers = await localforage.getItem("teachers") as any[] || [];
      const attendance = await localforage.getItem("attendance") as any[] || [];
      const teacher_id_counter = await localforage.getItem("teacher_id_counter") as number || 0;
      
      setLocalData({ teachers, attendance, teacher_id_counter });
    } catch (error) {
      console.error('Error loading local data:', error);
    }
  };

  const loadServerData = async () => {
    if (!isAuthenticated) return;
    
    try {
      const [teachersResponse, attendanceResponse] = await Promise.all([
        fetch('/api/data/teachers', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch('/api/data/attendance', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
      ]);

      const teachers = teachersResponse.ok ? (await teachersResponse.json()).teachers || [] : [];
      const attendance = attendanceResponse.ok ? (await attendanceResponse.json()).attendance || [] : [];
      
      setServerData({ teachers, attendance, teacher_id_counter: 0 });
    } catch (error) {
      console.error('Error loading server data:', error);
    }
  };

  const refreshData = async () => {
    setLoading(true);
    await Promise.all([loadLocalData(), loadServerData()]);
    setLastRefresh(new Date());
    setLoading(false);
  };

  const forceMigrateToServer = async () => {
    if (!isAuthenticated) {
      alert('Please login first');
      return;
    }

    setMigrating(true);
    try {
      const migrationData = {
        teachers: localData.teachers,
        attendance: localData.attendance,
        teacher_id_counter: localData.teacher_id_counter
      };

      console.log('🚀 Force migration starting with data:', migrationData);

      const response = await fetch('/api/data/migrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(migrationData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Force migration successful:', result);
        alert(`Force migration successful!\n- ${result.migrated.teachers} teachers\n- ${result.migrated.attendance} attendance records`);
        await refreshData();
      } else {
        const errorText = await response.text();
        console.error('❌ Force migration failed:', response.status, errorText);
        alert(`Force migration failed!\nStatus: ${response.status}\nError: ${errorText}`);
      }
    } catch (error) {
      console.error('💥 Force migration exception:', error);
      alert(`Force migration failed with exception: ${error}`);
    } finally {
      setMigrating(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [isAuthenticated]);

  const DataDisplay = ({ title, data, icon }: { title: string; data: StorageData; icon: React.ReactNode }) => (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {icon}
        <h4 className="font-medium">{title}</h4>
      </div>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span>Teachers:</span>
          <Badge variant={data.teachers.length > 0 ? "default" : "secondary"}>
            {data.teachers.length}
          </Badge>
        </div>
        <div className="flex justify-between">
          <span>Attendance:</span>
          <Badge variant={data.attendance.length > 0 ? "default" : "secondary"}>
            {data.attendance.length}
          </Badge>
        </div>
        <div className="flex justify-between">
          <span>ID Counter:</span>
          <Badge variant="outline">{data.teacher_id_counter}</Badge>
        </div>
      </div>
    </div>
  );

  const isDataSynced = 
    localData.teachers.length === serverData.teachers.length &&
    localData.attendance.length === serverData.attendance.length;

  return (
    <Card className="max-w-2xl mx-auto mt-8">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Storage Debug
            </CardTitle>
            <CardDescription>
              Compare LocalStorage vs Server Storage
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {isDataSynced ? (
              <Badge className="bg-green-100 text-green-800 border-green-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                Synced
              </Badge>
            ) : (
              <Badge variant="destructive">
                <AlertCircle className="w-3 h-3 mr-1" />
                Out of Sync
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DataDisplay 
            title="LocalForage (Browser)" 
            data={localData}
            icon={<HardDrive className="w-4 h-4 text-blue-600" />}
          />
          <DataDisplay 
            title="Server Storage" 
            data={serverData}
            icon={<Database className="w-4 h-4 text-green-600" />}
          />
        </div>

        <div className="border-t pt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              User: <Badge variant="outline">{user?.username || 'Not logged in'}</Badge>
              Role: <Badge variant="outline">{user?.role || 'None'}</Badge>
            </div>
            {lastRefresh && (
              <div className="text-xs text-gray-500">
                Last refresh: {lastRefresh.toLocaleTimeString()}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={refreshData} 
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
            
            <Button 
              onClick={forceMigrateToServer} 
              disabled={migrating || !isAuthenticated || localData.teachers.length === 0}
              variant="default"
              size="sm"
            >
              {migrating ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Database className="w-4 h-4 mr-2" />
              )}
              Force Sync to Server
            </Button>
          </div>

          {!isAuthenticated && (
            <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded border border-amber-200">
              <AlertCircle className="w-4 h-4 inline mr-2" />
              Please login to view server data and perform migrations
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StorageDebug;