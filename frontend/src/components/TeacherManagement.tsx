
import React from "react";
import { useState, useEffect } from "react";
import localforage from "localforage";
import { Plus, Edit, Trash2, Search } from "lucide-react";
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
import AddTeacherDialog from "./AddTeacherDialog";

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

  // Load teachers from localForage on mount
  useEffect(() => {
    localforage.getItem<Teacher[]>("teachers").then((data) => {
      if (data) setTeachers(data);
    });
  }, []);

  // Save teachers to localForage whenever they change
  useEffect(() => {
    localforage.setItem("teachers", teachers);
  }, [teachers]);

  const filteredTeachers = teachers.filter(teacher =>
    teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.designation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddTeacher = (teacherData: Omit<Teacher, "id">) => {
    // Use a counter for unique IDs
    localforage.getItem<number>("teacher_id_counter").then((counter) => {
      const newId = (counter || 1).toString();
      const newTeacher = { ...teacherData, id: newId };
      setTeachers((prev) => [...prev, newTeacher]);
      localforage.setItem("teacher_id_counter", (counter || 1) + 1);
      setIsAddDialogOpen(false);
    });
  };

  const handleDeleteTeacher = (id: string) => {
    setTeachers(teachers.filter(teacher => teacher.id !== id));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div>
              <CardTitle>Teacher Management</CardTitle>
              <CardDescription>
                Manage teacher profiles and information
              </CardDescription>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Teacher
            </Button>
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
                {filteredTeachers.map((teacher) => (
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
                ))}
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
