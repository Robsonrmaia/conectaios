import { useEffect } from 'react';

export default function OverflowDebugPage() {
  useEffect(() => {
    // Check for overflow on page load
    const checkOverflow = () => {
      if (document.body.scrollWidth > window.innerWidth) {
        console.error('OVERFLOW DETECTADO:', document.body.scrollWidth, '>', window.innerWidth);
        console.log('Body width:', document.body.scrollWidth);
        console.log('Window width:', window.innerWidth);
        
        // Find elements that might be causing overflow
        const allElements = document.querySelectorAll('*');
        const overflowElements: Element[] = [];
        
        allElements.forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.right > window.innerWidth) {
            overflowElements.push(el);
          }
        });
        
        if (overflowElements.length > 0) {
          console.log('Elementos causando overflow:', overflowElements);
        }
      } else {
        console.log('✅ Sem overflow detectado');
      }
    };

    // Check immediately and after a short delay
    checkOverflow();
    setTimeout(checkOverflow, 1000);

    // Check on resize
    window.addEventListener('resize', checkOverflow);
    
    return () => {
      window.removeEventListener('resize', checkOverflow);
    };
  }, []);

  return (
    <div className="container-responsive w-full overflow-x-hidden p-6">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Debug de Overflow</h1>
        <p>Verifique o console para detectar elementos que causam overflow horizontal.</p>
        
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Testes de Responsividade</h2>
          
          {/* Test button groups */}
          <div className="space-y-4">
            <h3 className="font-medium">Grupos de Botões (Fixed - deve estar ok):</h3>
            <div className="flex-row-wrap">
              <button className="btn-fluid bg-primary text-primary-foreground px-4 py-2 rounded">Botão 1</button>
              <button className="btn-fluid bg-secondary text-secondary-foreground px-4 py-2 rounded">Botão 2</button>
              <button className="btn-fluid bg-accent text-accent-foreground px-4 py-2 rounded">Botão 3</button>
              <button className="btn-fluid bg-muted text-muted-foreground px-4 py-2 rounded">Botão 4</button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium">Tabs Scrollable (Fixed - deve estar ok):</h3>
            <div className="-mx-4 px-4 overflow-x-auto">
              <div className="flex gap-2 min-w-max">
                <div className="px-4 py-2 bg-primary text-primary-foreground rounded whitespace-nowrap">Tab Muito Longa 1</div>
                <div className="px-4 py-2 bg-secondary text-secondary-foreground rounded whitespace-nowrap">Tab Muito Longa 2</div>
                <div className="px-4 py-2 bg-accent text-accent-foreground rounded whitespace-nowrap">Tab Muito Longa 3</div>
                <div className="px-4 py-2 bg-muted text-muted-foreground rounded whitespace-nowrap">Tab Muito Longa 4</div>
                <div className="px-4 py-2 bg-destructive text-destructive-foreground rounded whitespace-nowrap">Tab Muito Longa 5</div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium">Table Wrapper (Fixed - deve estar ok):</h3>
            <div className="-mx-4 px-4 overflow-x-auto">
              <table className="min-w-full table-auto border">
                <thead>
                  <tr>
                    <th className="border p-2">Coluna Muito Longa 1</th>
                    <th className="border p-2">Coluna Muito Longa 2</th>
                    <th className="border p-2">Coluna Muito Longa 3</th>
                    <th className="border p-2">Coluna Muito Longa 4</th>
                    <th className="border p-2">Coluna Muito Longa 5</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border p-2">Dados longos aqui</td>
                    <td className="border p-2">Mais dados longos</td>
                    <td className="border p-2">Ainda mais dados</td>
                    <td className="border p-2">Conteúdo extenso</td>
                    <td className="border p-2">Informação adicional</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium">Grid Responsivo (Fixed - deve estar ok):</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="w-full max-w-full min-w-0 p-4 bg-card border rounded">
                <h4 className="font-medium wrap-any">Título muito longo que pode quebrar layout</h4>
                <p className="text-sm text-muted-foreground wrap-any">
                  Descrição muito longa que deve quebrar automaticamente sem causar overflow horizontal no mobile
                </p>
              </div>
              <div className="w-full max-w-full min-w-0 p-4 bg-card border rounded">
                <h4 className="font-medium wrap-any">Outro título longo</h4>
                <p className="text-sm text-muted-foreground wrap-any">
                  Mais conteúdo que deve se comportar corretamente
                </p>
              </div>
              <div className="w-full max-w-full min-w-0 p-4 bg-card border rounded">
                <h4 className="font-medium wrap-any">Terceiro card</h4>
                <p className="text-sm text-muted-foreground wrap-any">
                  Testando responsividade
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}