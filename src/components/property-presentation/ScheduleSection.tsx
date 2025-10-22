import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ScheduleSection({ onScheduleVisit }: { onScheduleVisit: () => void }) {
  return (
    <section className="px-6 py-12 bg-gray-50">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-2xl font-semibold text-gray-900 mb-2">Agende sua Visita</h3>
        <p className="text-gray-600 mb-6">
          Entre em contato conosco para agendar uma visita personalizada ao imóvel
        </p>
        <Button
          onClick={onScheduleVisit}
          className="px-8 py-3 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
          size="lg"
        >
          Solicitar Agendamento
        </Button>
      </div>
    </section>
  );
}