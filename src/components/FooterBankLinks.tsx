import React from 'react';
import { ExternalLink, Calculator } from 'lucide-react';

export function FooterBankLinks() {
  const bankSimulators = [
    {
      name: 'Caixa Econômica Federal',
      url: 'https://www.caixa.gov.br/voce/habitacao/simulador/Paginas/default.aspx',
      description: 'Simulador habitacional oficial da Caixa'
    },
    {
      name: 'Banco do Brasil',
      url: 'https://www42.bb.com.br/portalbb/imobiliario/creditoimobiliario/simular,802,2250,2250.bbx',
      description: 'Simulação de crédito imobiliário BB'
    },
    {
      name: 'Bradesco',
      url: 'https://banco.bradesco/html/classic/produtos-servicos/emprestimo-e-financiamento/encontre-seu-credito/simuladores-imoveis.shtm',
      description: 'Simuladores de financiamento Bradesco'
    },
    {
      name: 'Itaú',
      url: 'https://www.itau.com.br/credito-financiamento/financiamentos/imoveis',
      description: 'Crédito imobiliário Itaú'
    },
    {
      name: 'Santander',
      url: 'https://www.santander.com.br/credito-financiamento/financiamento-de-imoveis',
      description: 'Financiamento imobiliário Santander'
    },
    {
      name: 'Banco Inter',
      url: 'https://www.bancointer.com.br/credito-imobiliario/',
      description: 'Crédito imobiliário digital Inter'
    }
  ];

  return (
    <div className="bg-muted/30 border-t">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Calculator className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Simuladores de Financiamento</h3>
          </div>
          <p className="text-muted-foreground">
            Acesse os simuladores oficiais dos principais bancos do país
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bankSimulators.map((bank, index) => (
            <a
              key={index}
              href={bank.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group p-4 bg-card border rounded-lg hover:shadow-md transition-all duration-200 hover:border-primary/50"
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium group-hover:text-primary transition-colors">
                  {bank.name}
                </h4>
                <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <p className="text-sm text-muted-foreground">
                {bank.description}
              </p>
            </a>
          ))}
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            Os simuladores são de responsabilidade de cada instituição financeira.
            Consulte sempre as condições atualizadas diretamente com o banco.
          </p>
        </div>
      </div>
    </div>
  );
}