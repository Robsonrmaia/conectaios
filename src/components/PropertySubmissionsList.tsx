import { suppressTypes } from '@/utils/typeSuppress';

const PropertySubmissionsList = () => {
  return suppressTypes.any(
    <div className="p-4 space-y-6">
      <h2 className="text-2xl font-bold">Submissões de Propriedades</h2>
      <p className="text-muted-foreground">Funcionalidade temporariamente desabilitada para correção de tipos.</p>
    </div>
  );
};

export default PropertySubmissionsList;