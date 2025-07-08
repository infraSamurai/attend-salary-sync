import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Teacher } from "@/types/attendance";

interface AttendanceStatsProps {
  teachers: Teacher[];
  attendanceRate: number;
}

const AttendanceStats = ({ teachers, attendanceRate }: AttendanceStatsProps) => {
  return (
    <div className="flex items-center space-x-2">
      <Badge variant="secondary">
        <Users className="w-3 h-3 mr-1" />
        {teachers.length} Teachers
      </Badge>
      <Badge variant="outline">
        {attendanceRate}% Present
      </Badge>
    </div>
  );
};

export default AttendanceStats;