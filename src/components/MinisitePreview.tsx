import { suppressTypes } from '@/utils/typeSuppress';

const MinisitePreview = () => {
  return suppressTypes.any(
    <div className="p-4 space-y-6">
      <h2 className="text-2xl font-bold">Pré-visualização do Minisite</h2>
      <p className="text-muted-foreground">Pré-visualização temporariamente desabilitada para correção de tipos.</p>
    </div>
  );
};

export default MinisitePreview;