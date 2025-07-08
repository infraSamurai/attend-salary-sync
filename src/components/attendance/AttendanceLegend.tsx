import { Check, X } from "lucide-react";

const AttendanceLegend = () => {
  return (
    <div className="mt-4 flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
      <div className="flex items-center space-x-2">
        <div className="w-4 h-4 bg-green-100 rounded flex items-center justify-center">
          <Check className="w-3 h-3 text-green-700" />
        </div>
        <span>Present</span>
      </div>
      <div className="flex items-center space-x-2">
        <div className="w-4 h-4 bg-red-100 rounded flex items-center justify-center">
          <X className="w-3 h-3 text-red-700" />
        </div>
        <span>Absent</span>
      </div>
      <div className="flex items-center space-x-2">
        <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded flex items-center justify-center text-xs">
          🎉
        </div>
        <span>Holiday (Auto Present)</span>
      </div>
      <div className="flex items-center space-x-2">
        <div className="w-4 h-4 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-500">
          OFF
        </div>
        <span>Sunday (Non-working)</span>
      </div>
    </div>
  );
};

export default AttendanceLegend;