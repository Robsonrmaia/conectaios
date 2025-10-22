import { formatCurrency } from '@/lib/utils';
import type { Property } from './types';

export function SpecsInfo({ property }: { property: Property }) {
  return (
    <section className="px-6 py-12">
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Especificações</h3>
          <div className="space-y-3">
            <Row label="Área Total:" value={`${property.area}m²`} />
            <Row label="Área do Terreno:" value={`${Math.round(property.area * 1.4)}m²`} />
            <Row label="Dormitórios:" value={`${property.quartos} ${property.bathrooms ? 'Suítes' : 'Quartos'}`} />
            <Row label="Banheiros:" value={`${property.bathrooms || property.quartos}`} />
            <Row label="Vagas:" value={`${property.parking_spots || 2}`} />
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Informações</h3>
          <div className="space-y-3">
            <Row label="Ano:" value={property.year_built ? String(property.year_built) : 'Não informado'} />
            <Row label="Condomínio:" value={property.condominium_fee ? formatCurrency(property.condominium_fee) : 'Não informado'} />
            <Row label="IPTU:" value={property.iptu ? formatCurrency(property.iptu) : 'Não informado'} accent />
            {property.zipcode && <Row label="CEP:" value={property.zipcode} />}
            {property.neighborhood && <Row label="Bairro:" value={property.neighborhood} />}
            <Row label="Status:" value="Disponível" status />
          </div>
        </div>
      </div>
    </section>
  );
}

function Row({ label, value, accent, status }: { label: string; value: string; accent?: boolean; status?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-600">{label}</span>
      <span className={`font-medium ${accent ? 'text-blue-600' : ''} ${status ? 'text-green-600' : ''}`}>{value}</span>
    </div>
  );
}