import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';

interface ActionBarProps {
  onScheduleVisit: () => void;
  onShare: () => Promise<void> | void;
}

export function ActionBar({ onScheduleVisit, onShare }: ActionBarProps) {
  return (
    <div className="bg-white">
      <div className="px-4 pb-4">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:justify-center">
          <Button
            onClick={onScheduleVisit}
            className="py-3 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl sm:w-full sm:max-w-xs sm:py-4 sm:text-lg"
            size="default"
          >
            Agendar Visita
          </Button>

          <Button
            onClick={onShare}
            className="py-3 text-sm font-semibold bg-green-600 hover:bg-green-700 text-white rounded-xl flex items-center justify-center gap-2 sm:w-full sm:max-w-xs sm:py-4 sm:text-lg"
            size="default"
          >
            <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
            Compartilhar
          </Button>
        </div>
      </div>
    </div>
  );
}