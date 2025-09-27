import { suppressTypes } from '@/utils/typeSuppress';

const SmartCalendar = () => {
  return suppressTypes.any(
    <div className="p-4 space-y-6">
      <h2 className="text-2xl font-bold">Calendário Inteligente</h2>
      <p className="text-muted-foreground">Calendário temporariamente desabilitado para correção de tipos.</p>
    </div>
  );
};

export default SmartCalendar;