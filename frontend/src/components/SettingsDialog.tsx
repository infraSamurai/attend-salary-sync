import React, { useState, useEffect } from "react";
import { Settings, School, DollarSign, Database, Palette } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import localforage from "localforage";

interface AppSettings {
  schoolName: string;
  academicYear: string;
  workingDaysPerWeek: number;
  defaultBaseSalary: number;
  deductionPerAbsentDay: number;
  theme: "light" | "dark" | "system";
  dateFormat: "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";
}

const defaultSettings: AppSettings = {
  schoolName: "My School",
  academicYear: "2024-25",
  workingDaysPerWeek: 6,
  defaultBaseSalary: 30000,
  deductionPerAbsentDay: 1000,
  theme: "system",
  dateFormat: "DD/MM/YYYY",
};

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({ open, onOpenChange }) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [storageInfo, setStorageInfo] = useState<any>(null);

  useEffect(() => {
    // Load settings from localStorage
    localforage.getItem<AppSettings>("appSettings").then((data) => {
      if (data) setSettings({ ...defaultSettings, ...data });
    });

    // Get storage information
    getStorageInfo();
  }, []);

  const getStorageInfo = async () => {
    try {
      const keys = await localforage.keys();
      let totalSize = 0;
      const items: any = {};

      for (const key of keys) {
        const value = await localforage.getItem(key);
        const size = new Blob([JSON.stringify(value)]).size;
        items[key] = { count: Array.isArray(value) ? value.length : 1, size };
        totalSize += size;
      }

      setStorageInfo({ keys: keys.length, totalSize, items });
    } catch (error) {
      console.error("Error getting storage info:", error);
    }
  };

  const saveSettings = async () => {
    await localforage.setItem("appSettings", settings);
  };

  const handleSettingChange = (key: keyof AppSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const clearAllData = async () => {
    if (window.confirm("Are you sure you want to clear all data? This action cannot be undone.")) {
      await localforage.clear();
      setStorageInfo(null);
      alert("All data cleared successfully!");
      window.location.reload();
    }
  };

  const resetSettings = async () => {
    setSettings(defaultSettings);
    await localforage.setItem("appSettings", defaultSettings);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Settings
          </DialogTitle>
          <DialogDescription>
            Configure your AttendSync application settings
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <School className="w-4 h-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="salary" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Salary
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Data
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>School Information</CardTitle>
                <CardDescription>Basic information about your institution</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="schoolName">School Name</Label>
                  <Input
                    id="schoolName"
                    value={settings.schoolName}
                    onChange={(e) => handleSettingChange("schoolName", e.target.value)}
                    placeholder="Enter school name"
                  />
                </div>
                <div>
                  <Label htmlFor="academicYear">Academic Year</Label>
                  <Input
                    id="academicYear"
                    value={settings.academicYear}
                    onChange={(e) => handleSettingChange("academicYear", e.target.value)}
                    placeholder="2024-25"
                  />
                </div>
                <div>
                  <Label htmlFor="workingDays">Working Days Per Week</Label>
                  <Select
                    value={settings.workingDaysPerWeek.toString()}
                    onValueChange={(value) => handleSettingChange("workingDaysPerWeek", parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 Days</SelectItem>
                      <SelectItem value="6">6 Days</SelectItem>
                      <SelectItem value="7">7 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="salary" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Salary Configuration</CardTitle>
                <CardDescription>Default salary settings and calculation rules</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="baseSalary">Default Base Salary (₹)</Label>
                  <Input
                    id="baseSalary"
                    type="number"
                    value={settings.defaultBaseSalary}
                    onChange={(e) => handleSettingChange("defaultBaseSalary", parseInt(e.target.value) || 0)}
                    placeholder="30000"
                  />
                </div>
                <div>
                  <Label htmlFor="deduction">Deduction Per Absent Day (₹)</Label>
                  <Input
                    id="deduction"
                    type="number"
                    value={settings.deductionPerAbsentDay}
                    onChange={(e) => handleSettingChange("deductionPerAbsentDay", parseInt(e.target.value) || 0)}
                    placeholder="1000"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Appearance Settings</CardTitle>
                <CardDescription>Customize the look and feel of the application</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="theme">Theme</Label>
                  <Select
                    value={settings.theme}
                    onValueChange={(value: "light" | "dark" | "system") => handleSettingChange("theme", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Select
                    value={settings.dateFormat}
                    onValueChange={(value: any) => handleSettingChange("dateFormat", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Data Management</CardTitle>
                <CardDescription>Manage your application data and storage</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {storageInfo && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Storage Usage</h4>
                    <div className="text-sm text-gray-600">
                      <p>Total items: {storageInfo.keys}</p>
                      <p>Storage used: {formatBytes(storageInfo.totalSize)}</p>
                      {Object.entries(storageInfo.items).map(([key, info]: [string, any]) => (
                        <p key={key} className="ml-4">
                          {key}: {info.count} items ({formatBytes(info.size)})
                        </p>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button variant="outline" onClick={resetSettings}>
                    Reset Settings
                  </Button>
                  <Button variant="destructive" onClick={clearAllData}>
                    Clear All Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={async () => { await saveSettings(); onOpenChange(false); }}>
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;