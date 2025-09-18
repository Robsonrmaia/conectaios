import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function OverflowDebugPage() {
  const [overflowElements, setOverflowElements] = useState<Array<{
    element: string;
    width: number;
    scrollWidth: number;
    overflow: number;
  }>>([]);
  const [currentBreakpoint, setCurrentBreakpoint] = useState('');
  
  const checkOverflow = () => {
    console.log('🔍 [OVERFLOW DEBUG] Executando verificação...');
    
    // Detectar breakpoint atual
    const width = window.innerWidth;
    let breakpoint = '';
    if (width < 640) breakpoint = '📱 Mobile (< 640px)';
    else if (width < 768) breakpoint = '📱 SM (640-767px)';
    else if (width < 1024) breakpoint = '💻 MD (768-1023px)';
    else if (width < 1280) breakpoint = '💻 LG (1024-1279px)';
    else breakpoint = '🖥️ XL (≥ 1280px)';
    
    setCurrentBreakpoint(`${breakpoint} - ${width}px`);
    
    // Verificar overflow do body
    const bodyScrollWidth = document.body.scrollWidth;
    const windowWidth = window.innerWidth;
    
    if (bodyScrollWidth > windowWidth) {
      console.error('❌ [OVERFLOW] DETECTADO no body:', {
        bodyScrollWidth,
        windowWidth,
        overflow: bodyScrollWidth - windowWidth
      });
    }
    
    // Verificar todos os elementos
    const elements = document.querySelectorAll('*');
    const problematicElements: Array<any> = [];
    
    elements.forEach((element) => {
      const rect = element.getBoundingClientRect();
      
      if (rect.right > windowWidth) {
        const computedStyle = window.getComputedStyle(element);
        const elementInfo = {
          element: `${element.tagName.toLowerCase()}${element.className ? '.' + element.className.split(' ').join('.') : ''}`,
          width: Math.round(rect.width),
          scrollWidth: element.scrollWidth,
          overflow: Math.round(rect.right - windowWidth),
          rect: rect,
          styles: {
            width: computedStyle.width,
            minWidth: computedStyle.minWidth,
            maxWidth: computedStyle.maxWidth,
            overflow: computedStyle.overflow,
            overflowX: computedStyle.overflowX,
          }
        };
        
        problematicElements.push(elementInfo);
        console.warn('⚠️ [OVERFLOW] Elemento problemático:', elementInfo);
      }
    });
    
    // Atualizar estado com elementos problemáticos únicos (limitando a 20)
    const uniqueElements = problematicElements
      .filter((item, index, arr) => 
        arr.findIndex(t => t.element === item.element) === index
      )
      .slice(0, 20);
      
    setOverflowElements(uniqueElements);
    
    console.log(`✅ [OVERFLOW DEBUG] Finalizado. Encontrados ${uniqueElements.length} elementos problemáticos.`);
  };
  
  const testBreakpoints = () => {
    console.log('📏 [BREAKPOINT TEST] Iniciando teste de breakpoints...');
    
    const breakpoints = [
      { name: 'Mobile Small', width: 320 },
      { name: 'Mobile', width: 375 },  
      { name: 'Mobile Large', width: 390 },
      { name: 'Tablet Small', width: 640 },
      { name: 'Tablet', width: 768 },
      { name: 'Desktop', width: 1024 },
      { name: 'Desktop Large', width: 1280 }
    ];
    
    // Simular redimensionamento (apenas log, já que não podemos realmente redimensionar)
    breakpoints.forEach(bp => {
      console.log(`📏 ${bp.name} (${bp.width}px): Verifique manualmente redimensionando o navegador`);
    });
    
    checkOverflow();
  };

  useEffect(() => {
    // Verificação inicial
    setTimeout(checkOverflow, 100);
    
    // Verificação após delay (para elementos que carregam dinamicamente)
    setTimeout(checkOverflow, 1000);
    
    // Event listener para redimensionamento
    const handleResize = () => {
      setTimeout(checkOverflow, 100);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="container-responsive space-y-6 py-6">
      <div>
        <h1 className="text-3xl font-bold text-destructive mb-2">
          🐛 Debug de Overflow Horizontal
        </h1>
        <p className="text-muted-foreground">
          Detecta elementos que causam scroll horizontal no mobile
        </p>
      </div>
      
      <div className="flex flex-wrap gap-4 mb-6">
        <Button onClick={checkOverflow} variant="default">
          🔍 Verificar Overflow
        </Button>
        <Button onClick={testBreakpoints} variant="secondary">
          📏 Testar Breakpoints
        </Button>
        <Button onClick={() => window.location.reload()} variant="outline">
          🔄 Recarregar Página
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📊 Status Atual
            <Badge variant={overflowElements.length > 0 ? "destructive" : "default"}>
              {overflowElements.length > 0 ? `${overflowElements.length} problemas` : 'Sem problemas'}
            </Badge>
          </CardTitle>
          <CardDescription>
            Breakpoint atual: {currentBreakpoint || 'Carregando...'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <strong>Largura da Janela:</strong> {window.innerWidth}px
            </div>
            <div>
              <strong>Body scrollWidth:</strong> {document.body.scrollWidth}px
            </div>
            <div>
              <strong>Overflow:</strong> {document.body.scrollWidth - window.innerWidth}px
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="problemas" className="space-y-4">
        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4">
          <TabsList className="grid w-full grid-cols-3 min-w-max">
            <TabsTrigger value="problemas" className="whitespace-nowrap">
              🚨 Problemas ({overflowElements.length})
            </TabsTrigger>
            <TabsTrigger value="componentes" className="whitespace-nowrap">
              🧪 Componentes de Teste
            </TabsTrigger>
            <TabsTrigger value="guia" className="whitespace-nowrap">
              📖 Guia de Soluções
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="problemas" className="space-y-4">
          {overflowElements.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-success">
                  <div className="text-4xl mb-2">✅</div>
                  <h3 className="font-semibold">Nenhum overflow detectado!</h3>
                  <p className="text-muted-foreground">Todos os elementos estão dentro da viewport.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {overflowElements.map((item, index) => (
                  <Card key={index} className="border-destructive/20">
                    <CardContent className="pt-4">
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                        <code className="text-sm bg-muted px-2 py-1 rounded flex-1 min-w-0 break-all">
                          {item.element}
                        </code>
                        <Badge variant="destructive" className="whitespace-nowrap">
                          +{item.overflow}px
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-muted-foreground">
                        <span>Largura: {item.width}px</span>
                        <span>ScrollWidth: {item.scrollWidth}px</span>
                        <span>Overflow: {item.overflow}px</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
        
        <TabsContent value="componentes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>🧪 Componentes de Teste - Todos Corrigidos</CardTitle>
              <CardDescription>
                Estes componentes foram corrigidos e não devem causar overflow
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Grupo de botões - CORRIGIDO */}
              <div>
                <h4 className="font-semibold mb-2">✅ Grupo de Botões (Corrigido)</h4>
                <div className="flex flex-wrap gap-2">
                  <Button className="w-full sm:w-auto">Botão Principal</Button>
                  <Button variant="outline" className="w-full sm:w-auto">Botão Secundário</Button>
                  <Button variant="ghost" className="w-full sm:w-auto">Botão Terciário</Button>
                </div>
              </div>
              
              {/* Tabs - CORRIGIDAS */}
              <div>
                <h4 className="font-semibold mb-2">✅ Tabs Responsivas (Corrigidas)</h4>
                <div className="overflow-x-auto -mx-4 sm:mx-0 px-4">
                  <div className="flex gap-2 min-w-max">
                    <Button variant="outline" size="sm" className="whitespace-nowrap">Tab Muito Longa</Button>
                    <Button variant="outline" size="sm" className="whitespace-nowrap">Outra Tab Longa</Button>
                    <Button variant="outline" size="sm" className="whitespace-nowrap">Tab Adicional</Button>
                    <Button variant="outline" size="sm" className="whitespace-nowrap">Última Tab</Button>
                  </div>
                </div>
              </div>
              
              {/* Grid - CORRIGIDO */}
              <div>
                <h4 className="font-semibold mb-2">✅ Grid Responsivo (Corrigido)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <Card key={i} className="w-full max-w-full min-w-0">
                      <CardContent className="p-4">
                        <div className="break-words">
                          Card {i} com texto muito longo que deve quebrar adequadamente
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
              
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="guia" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>📖 Guia de Soluções para Overflow</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold text-success mb-2">✅ Grupos de Botões</h4>
                  <code className="text-sm bg-muted p-2 rounded block mb-2">
                    {`<div className="flex flex-wrap gap-2">
  <Button className="w-full sm:w-auto">Botão</Button>
</div>`}
                  </code>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold text-success mb-2">✅ Tabs Scrolláveis</h4>
                  <code className="text-sm bg-muted p-2 rounded block mb-2">
{`<div className="overflow-x-auto -mx-4 sm:mx-0 px-4">
  <TabsList className="min-w-max">
    <TabsTrigger className="whitespace-nowrap">Tab</TabsTrigger>
  </TabsList>
</div>`}
                  </code>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold text-success mb-2">✅ Grids Responsivos</h4>
                  <code className="text-sm bg-muted p-2 rounded block mb-2">
{`<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  <Card className="w-full max-w-full min-w-0">
    <div className="break-words">Conteúdo</div>
  </Card>
</div>`}
                  </code>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold text-success mb-2">✅ Containers Seguros</h4>
                  <code className="text-sm bg-muted p-2 rounded block mb-2">
                    {`<div className="container-responsive w-full overflow-x-hidden">`}
                  </code>
                </div>
                
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
    </div>
  );
}