import { suppressTypes } from '@/utils/typeSuppress';

const SimpleIndicationManagement = () => {
  return suppressTypes.any(
    <div className="p-4 space-y-6">
      <h2 className="text-2xl font-bold">Gerenciamento de Indicações</h2>
      <p className="text-muted-foreground">Funcionalidade temporariamente desabilitada para correção de tipos.</p>
    </div>
  );
};

export default SimpleIndicationManagement;