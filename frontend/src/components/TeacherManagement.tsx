
import React from "react";
import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Search, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import AddTeacherDialog from "./AddTeacherDialog";
import { useDataSync } from "@/hooks/useDataSync";
import { useTeacherBroadcast } from "@/hooks/useBroadcastSync";
import { useAuth } from "@/contexts/AuthContext";

interface Teacher {
  id: string;
  name: string;
  designation: string;
  baseSalary: number;
  joinDate: string;
  contact: string;
  photo?: string;
}

const TeacherManagement = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  // Use data sync hook for real-time updates
  const { data, loading, error, lastUpdated, isOnline, refresh } = useDataSync({
    url: '/api/data/teachers',
    enabled: isAuthenticated,
    onData: (responseData) => {
      if (responseData?.teachers) {
        setTeachers(responseData.teachers);
      }
    },
    onError: (error) => {
      if (error.message !== 'Not authenticated') {
        toast({
          title: "Sync Error",
          description: `Failed to sync teachers: ${error.message}`,
          variant: "destructive",
        });
      }
    }
  });

  // Use broadcast channel for same-device synchronization
  const { broadcast } = useTeacherBroadcast();

  // Listen for broadcast messages from other tabs
  useEffect(() => {
    const handleTeachersChanged = () => {
      refresh(); // Refresh data when other tabs make changes
    };

    window.addEventListener('teachers-changed', handleTeachersChanged);
    return () => window.removeEventListener('teachers-changed', handleTeachersChanged);
  }, [refresh]);

  const filteredTeachers = teachers.filter(teacher =>
    teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.designation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddTeacher = async (teacherData: Omit<Teacher, "id">) => {
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const response = await fetch('/api/data/teachers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(teacherData),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Broadcast the change to other tabs
      broadcast('teacher-added', teacherData);
      
      // Refresh data to get latest state
      refresh();
      setIsAddDialogOpen(false);
      
      toast({
        title: "Success",
        description: "Teacher added successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to add teacher: ${(error as Error).message}`,
        variant: "destructive",
      });
    }
  };

  const handleDeleteTeacher = async (id: string) => {
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const response = await fetch(`/api/data/teachers?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Broadcast the change to other tabs
      broadcast('teacher-deleted', { id });
      
      // Refresh data to get latest state
      refresh();
      
      toast({
        title: "Success",
        description: "Teacher deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to delete teacher: ${(error as Error).message}`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2">
                Teacher Management
                {!isOnline && <WifiOff className="w-4 h-4 text-red-500" />}
                {isOnline && <Wifi className="w-4 h-4 text-green-500" />}
              </CardTitle>
              <CardDescription>
                Manage teacher profiles and information
                {lastUpdated && (
                  <span className="block text-xs mt-1">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </span>
                )}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={refresh}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Teacher
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-6">
            <Search className="w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search teachers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Base Salary</TableHead>
                  <TableHead>Join Date</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && teachers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Loading teachers...
                    </TableCell>
                  </TableRow>
                ) : filteredTeachers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No teachers found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTeachers.map((teacher) => (
                    <TableRow key={teacher.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={teacher.photo} alt={teacher.name} />
                            <AvatarFallback>
                              {teacher.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{teacher.name}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{teacher.designation}</Badge>
                      </TableCell>
                      <TableCell>₹{teacher.baseSalary.toLocaleString()}</TableCell>
                      <TableCell>{new Date(teacher.joinDate).toLocaleDateString()}</TableCell>
                      <TableCell>{teacher.contact}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteTeacher(teacher.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AddTeacherDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAddTeacher={handleAddTeacher}
      />
    </div>
  );
};

export default TeacherManagement;
