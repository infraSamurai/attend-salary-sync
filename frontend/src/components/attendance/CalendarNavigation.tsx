import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CalendarNavigationProps {
  currentDate: Date;
  onNavigate: (direction: 'prev' | 'next') => void;
}

const CalendarNavigation = ({ currentDate, onNavigate }: CalendarNavigationProps) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <Button variant="outline" size="sm" onClick={() => onNavigate('prev')}>
        <ChevronLeft className="w-4 h-4" />
        Previous
      </Button>
      <h3 className="text-lg font-semibold">
        {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
      </h3>
      <Button variant="outline" size="sm" onClick={() => onNavigate('next')}>
        Next
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default CalendarNavigation;