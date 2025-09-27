import { suppressTypes } from '@/utils/typeSuppress';

const PipelineCRM = () => {
  return suppressTypes.any(
    <div className="p-4 space-y-6">
      <h2 className="text-2xl font-bold">Pipeline CRM</h2>
      <p className="text-muted-foreground">CRM funcionalidade temporariamente desabilitada para correção de tipos.</p>
    </div>
  );
};

export default PipelineCRM;