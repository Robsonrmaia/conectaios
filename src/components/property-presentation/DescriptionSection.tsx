import { FileText } from 'lucide-react';

export function DescriptionSection({ descricao }: { descricao?: string }) {
  if (!descricao) return null;

  return (
    <section className="px-6 py-12">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="h-6 w-6 text-blue-600" />
          Sobre o Imóvel
        </h2>
        <div className="prose prose-lg max-w-none">
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {descricao}
          </p>
        </div>
      </div>
      <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent mb-8" />
    </section>
  );
}