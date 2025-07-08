import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Teacher } from "@/types/attendance";

interface AttendanceStatsProps {
  teachers: Teacher[];
  attendanceRate: number;
  totalLate: number;
}

const AttendanceStats = ({ teachers, attendanceRate, totalLate }: AttendanceStatsProps) => {
  return (
    <div className="flex items-center space-x-2">
      <Badge variant="secondary">
        <Users className="w-3 h-3 mr-1" />
        {teachers.length} Teachers
      </Badge>
      <Badge variant="outline">
        {attendanceRate}% Present
      </Badge>
      {totalLate > 0 && (
        <Badge variant="outline" className="bg-yellow-50 border-yellow-200 text-yellow-700">
          {totalLate} Late
        </Badge>
      )}
    </div>
  );
};

export default AttendanceStats;