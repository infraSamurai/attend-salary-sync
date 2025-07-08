import { useState } from "react";
import { Plus, Calendar, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Holiday {
  date: string;
  name: string;
  type: 'festival' | 'school';
}

interface HolidayManagerProps {
  holidays: Holiday[];
  onHolidaysChange: (holidays: Holiday[]) => void;
  currentMonth: Date;
}

const HolidayManager = ({ holidays, onHolidaysChange, currentMonth }: HolidayManagerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newHoliday, setNewHoliday] = useState({
    name: '',
    date: '',
    type: 'festival' as 'festival' | 'school'
  });

  const currentMonthHolidays = holidays.filter(holiday => {
    const holidayDate = new Date(holiday.date);
    return holidayDate.getMonth() === currentMonth.getMonth() && 
           holidayDate.getFullYear() === currentMonth.getFullYear();
  });

  const addHoliday = () => {
    if (!newHoliday.name || !newHoliday.date) return;
    
    const holiday: Holiday = {
      ...newHoliday,
      date: new Date(newHoliday.date).toISOString()
    };
    
    onHolidaysChange([...holidays, holiday]);
    setNewHoliday({ name: '', date: '', type: 'festival' });
    setIsOpen(false);
  };

  const removeHoliday = (holidayToRemove: Holiday) => {
    onHolidaysChange(holidays.filter(h => h.date !== holidayToRemove.date));
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-sm font-medium">Holidays & Festivals</CardTitle>
            <CardDescription className="text-xs">
              Festival days count as present for all teachers
            </CardDescription>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="w-3 h-3 mr-1" />
                Add Holiday
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Holiday</DialogTitle>
                <DialogDescription>
                  Add a new holiday or festival day
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-sm">Holiday Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Diwali, School Sports Day"
                    value={newHoliday.name}
                    onChange={(e) => setNewHoliday(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="date" className="text-sm">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newHoliday.date}
                    onChange={(e) => setNewHoliday(prev => ({ ...prev, date: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="type" className="text-sm">Type</Label>
                  <Select 
                    value={newHoliday.type} 
                    onValueChange={(value: 'festival' | 'school') => 
                      setNewHoliday(prev => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="festival">Festival/Religious</SelectItem>
                      <SelectItem value="school">School Event</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex space-x-2 pt-2">
                  <Button onClick={addHoliday} size="sm" className="flex-1">
                    Add Holiday
                  </Button>
                  <Button onClick={() => setIsOpen(false)} variant="outline" size="sm">
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      {currentMonthHolidays.length > 0 && (
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2">
            {currentMonthHolidays.map((holiday) => (
              <Badge 
                key={holiday.date} 
                variant={holiday.type === 'festival' ? 'default' : 'secondary'}
                className="flex items-center space-x-1 text-xs"
              >
                <Calendar className="w-3 h-3" />
                <span>
                  {new Date(holiday.date).getDate()}: {holiday.name}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 ml-1 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => removeHoliday(holiday)}
                >
                  <Trash2 className="w-2 h-2" />
                </Button>
              </Badge>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default HolidayManager;