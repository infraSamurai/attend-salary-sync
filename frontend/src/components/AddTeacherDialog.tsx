
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Teacher {
  name: string;
  designation: string;
  baseSalary: number;
  joinDate: string;
  contact: string;
  photo?: string;
}

interface AddTeacherDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddTeacher: (teacher: Teacher) => void;
}

const AddTeacherDialog = ({ open, onOpenChange, onAddTeacher }: AddTeacherDialogProps) => {
  const [formData, setFormData] = useState<Teacher>({
    name: "",
    designation: "",
    baseSalary: 0,
    joinDate: "",
    contact: "",
    photo: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddTeacher(formData);
    setFormData({
      name: "",
      designation: "",
      baseSalary: 0,
      joinDate: "",
      contact: "",
      photo: ""
    });
  };

  const handleInputChange = (field: keyof Teacher, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Teacher</DialogTitle>
          <DialogDescription>
            Fill in the teacher's information below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter teacher's full name"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="designation">Designation</Label>
              <Input
                id="designation"
                value={formData.designation}
                onChange={(e) => handleInputChange("designation", e.target.value)}
                placeholder="e.g., Mathematics Teacher"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="baseSalary">Base Salary (₹)</Label>
              <Input
                id="baseSalary"
                type="number"
                value={formData.baseSalary || ""}
                onChange={(e) => handleInputChange("baseSalary", parseInt(e.target.value) || 0)}
                placeholder="45000"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="joinDate">Join Date</Label>
              <Input
                id="joinDate"
                type="date"
                value={formData.joinDate}
                onChange={(e) => handleInputChange("joinDate", e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contact">Contact Number</Label>
              <Input
                id="contact"
                value={formData.contact}
                onChange={(e) => handleInputChange("contact", e.target.value)}
                placeholder="+1-234-567-8900"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="photo">Photo URL (Optional)</Label>
              <Input
                id="photo"
                value={formData.photo}
                onChange={(e) => handleInputChange("photo", e.target.value)}
                placeholder="https://example.com/photo.jpg"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Teacher</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTeacherDialog;
