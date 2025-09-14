import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Image, FileText, Sparkles, CheckCircle, AlertCircle, Loader2, Zap } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { createWorker } from 'tesseract.js';

interface ExtractedData {
  tipo: string | null;
  finalidade: string | null;
  codigo: string | null;
  preco: number | null;
  area_m2: number | null;
  quartos: number | null;
  banheiros: number | null;
  vagas: number | null;
  cidade: string | null;
  uf: string | null;
  titulo: string | null;
  descricao: string | null;
  corretor: string | null;
  fonte: string;
}

interface EnvioFlashProps {
  onDataExtracted: (data: ExtractedData) => void;
  onClose?: () => void;
}

const REGEX_PATTERNS = {
  preco: /R\$\s*([\d.,]+)/gi,
  area: /([\d,]+)\s*m[²2]/gi,
  quartos: /(\d+)\s*(?:quarto|dormitório|dorm)/gi,
  banheiros: /(\d+)\s*(?:banheiro|wc|lavabo)/gi,
  vagas: /(\d+)\s*(?:vaga|garagem)/gi,
  cidade: /(?:em|na|localizada|cidade)[\s:]*([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ][a-záéíóúâêîôûãõç\s/-]+)/gi,
  codigo: /(?:código|cod|ref)[:\s]*([A-Z0-9-]+)/gi,
};

export function EnvioFlash({ onDataExtracted, onClose }: EnvioFlashProps) {
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [ocrText, setOcrText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<'upload' | 'ocr' | 'extract' | 'review'>('upload');
  const [progress, setProgress] = useState(0);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [editableData, setEditableData] = useState<ExtractedData | null>(null);
  const [inputMode, setInputMode] = useState<'image' | 'text'>('image');
  const [whatsappText, setWhatsappText] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractDataWithRegex = (text: string): Partial<ExtractedData> => {
    const extracted: Partial<ExtractedData> = { fonte: 'screenshot' };
    
    // Preço
    const precoMatch = text.match(REGEX_PATTERNS.preco);
    if (precoMatch) {
      const preco = precoMatch[0].replace(/[^\d,]/g, '').replace(',', '.');
      extracted.preco = parseFloat(preco) || null;
    }

    // Área
    const areaMatch = text.match(REGEX_PATTERNS.area);
    if (areaMatch) {
      const area = areaMatch[0].replace(/[^\d,]/g, '').replace(',', '.');
      extracted.area_m2 = parseFloat(area) || null;
    }

    // Quartos
    const quartosMatch = text.match(REGEX_PATTERNS.quartos);
    if (quartosMatch) {
      extracted.quartos = parseInt(quartosMatch[1]) || null;
    }

    // Banheiros
    const banheirosMatch = text.match(REGEX_PATTERNS.banheiros);
    if (banheirosMatch) {
      extracted.banheiros = parseInt(banheirosMatch[1]) || null;
    }

    // Vagas
    const vagasMatch = text.match(REGEX_PATTERNS.vagas);
    if (vagasMatch) {
      extracted.vagas = parseInt(vagasMatch[1]) || null;
    }

    // Cidade
    const cidadeMatch = text.match(REGEX_PATTERNS.cidade);
    if (cidadeMatch) {
      extracted.cidade = cidadeMatch[1]?.trim() || null;
    }

    // Código
    const codigoMatch = text.match(REGEX_PATTERNS.codigo);
    if (codigoMatch) {
      extracted.codigo = codigoMatch[1]?.trim() || null;
    }

    return extracted;
  };

  const calculateConfidence = (data: Partial<ExtractedData>): number => {
    const fields = ['preco', 'area_m2', 'quartos', 'cidade', 'tipo'];
    const filledFields = fields.filter(field => data[field] !== null && data[field] !== undefined);
    return Math.round((filledFields.length / fields.length) * 100);
  };

  const extractWithLLM = async (text: string): Promise<ExtractedData> => {
    try {
      const { data, error } = await supabase.functions.invoke('extract-property-data', {
        body: { text }
      });

      if (error) throw error;

      return data.extractedData;
    } catch (error) {
      console.error('Error calling LLM extraction:', error);
      throw new Error('Falha na extração com IA');
    }
  };

  const handleImageUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erro",
        description: "Por favor, selecione apenas arquivos de imagem.",
        variant: "destructive",
      });
      return;
    }

    setUploadedImage(file);
    setImagePreview(URL.createObjectURL(file));
    setCurrentStep('ocr');
    processOCR(file);
  };

  const handleTextSubmit = async () => {
    if (!whatsappText.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, cole o texto da mensagem do WhatsApp.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setCurrentStep('extract');
    setProgress(30);

    try {
      const finalData = await extractWithLLM(whatsappText);
      setExtractedData(finalData);
      setEditableData({ ...finalData });
      setConfidence(90);
      setProgress(100);
      setCurrentStep('review');

      toast({
        title: "Dados extraídos!",
        description: "Informações do imóvel extraídas com sucesso do texto.",
      });
    } catch (error) {
      console.error('Error extracting from text:', error);
      toast({
        title: "Erro",
        description: "Erro ao extrair dados do texto. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const processOCR = async (imageFile: File) => {
    setIsProcessing(true);
    setProgress(10);

    try {
      const worker = await createWorker('por');
      setProgress(30);

      const { data: { text } } = await worker.recognize(imageFile);
      await worker.terminate();

      setOcrText(text);
      setProgress(60);
      setCurrentStep('extract');

      // Primeira tentativa com regex
      const regexData = extractDataWithRegex(text);
      const regexConfidence = calculateConfidence(regexData);

      setProgress(80);

      let finalData: ExtractedData;

      if (regexConfidence >= 80) {
        // Usar dados do regex se confiança alta
        finalData = { ...regexData, fonte: 'screenshot' } as ExtractedData;
        setConfidence(regexConfidence);
      } else {
        // Usar LLM se confiança baixa
        try {
          const llmData = await extractWithLLM(text);
          finalData = llmData;
          setConfidence(90); // LLM geralmente tem confiança alta
        } catch (error) {
          // Fallback para regex se LLM falhar
          finalData = { ...regexData, fonte: 'screenshot' } as ExtractedData;
          setConfidence(regexConfidence);
          toast({
            title: "Aviso",
            description: "Extração com IA falhou. Usando extração básica.",
            variant: "destructive",
          });
        }
      }

      setExtractedData(finalData);
      setEditableData({ ...finalData });
      setProgress(100);
      setCurrentStep('review');

    } catch (error) {
      console.error('OCR Error:', error);
      toast({
        title: "Erro no OCR",
        description: "Não foi possível extrair texto da imagem.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyData = () => {
    if (!editableData) return;

    onDataExtracted(editableData);
    toast({
      title: "Dados aplicados!",
      description: "Os campos foram preenchidos no formulário principal.",
    });
    
    if (onClose) onClose();
  };

  const handleReset = () => {
    setUploadedImage(null);
    setImagePreview('');
    setOcrText('');
    setExtractedData(null);
    setEditableData(null);
    setCurrentStep('upload');
    setProgress(0);
    setConfidence(0);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleImageUpload(files[0]);
    }
  };

  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = Array.from(e.clipboardData?.items || []);
    const imageItem = items.find(item => item.type.startsWith('image/'));
    
    if (imageItem) {
      const file = imageItem.getAsFile();
      if (file) {
        handleImageUpload(file);
      }
    }
  }, []);

  // Adicionar listener para paste quando componente montar
  useState(() => {
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500">
          <Zap className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Envio Flash</h2>
          <p className="text-sm text-muted-foreground">
            Extraia dados de imóveis automaticamente com IA
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      {currentStep !== 'upload' && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progresso</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Upload Area */}
      {currentStep === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Escolha o Método de Extração
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={inputMode} onValueChange={(value: 'image' | 'text') => setInputMode(value)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="image" className="flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  Upload Imagem
                </TabsTrigger>
                <TabsTrigger value="text" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Colar Texto WhatsApp
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="image" className="space-y-4 mt-4">
                <div
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Image className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium mb-2">
                    Arraste uma imagem ou clique para selecionar
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    PNG, JPG, WebP até 10MB • Ou use Ctrl+V para colar
                  </p>
                  <Button variant="outline">
                    Selecionar Arquivo
                  </Button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                  }}
                />
              </TabsContent>
              
              <TabsContent value="text" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <Textarea
                    value={whatsappText}
                    onChange={(e) => setWhatsappText(e.target.value)}
                    placeholder="Cole aqui o texto completo da mensagem do WhatsApp com os dados do imóvel...

Exemplo:
🏠 Apartamento para Venda
💰 R$ 450.000
📐 80m²
🛏️ 3 quartos
🚿 2 banheiros
🚗 1 vaga
📍 Copacabana, Rio de Janeiro"
                    className="min-h-[150px]"
                  />
                  <Button 
                    onClick={handleTextSubmit}
                    className="w-full"
                    disabled={!whatsappText.trim() || isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Extraindo Dados...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Extrair Dados do Texto
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Cole o texto completo da mensagem do WhatsApp com as informações do imóvel
                </p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Image Preview & OCR Text */}
      {imagePreview && currentStep !== 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Texto Extraído (OCR)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-32 h-32 object-cover rounded-lg border"
              />
              <div className="flex-1">
                <Textarea
                  value={ocrText}
                  onChange={(e) => setOcrText(e.target.value)}
                  placeholder="Texto será extraído automaticamente..."
                  className="min-h-[120px]"
                  readOnly={isProcessing}
                />
              </div>
            </div>
            {isProcessing && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Processando com OCR e IA...
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Extracted Data Review */}
      {currentStep === 'review' && editableData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Dados Extraídos
              <Badge variant={confidence >= 80 ? "default" : "secondary"} className="ml-auto">
                {confidence >= 80 ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
                {confidence}% de confiança
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Título</Label>
                <Input
                  value={editableData.titulo || ''}
                  onChange={(e) => setEditableData({ ...editableData, titulo: e.target.value })}
                  placeholder="Não encontrado"
                />
              </div>
              
              <div>
                <Label>Preço (R$)</Label>
                <Input
                  type="number"
                  value={editableData.preco || ''}
                  onChange={(e) => setEditableData({ ...editableData, preco: parseFloat(e.target.value) || null })}
                  placeholder="Não encontrado"
                />
              </div>

              <div>
                <Label>Área (m²)</Label>
                <Input
                  type="number"
                  value={editableData.area_m2 || ''}
                  onChange={(e) => setEditableData({ ...editableData, area_m2: parseFloat(e.target.value) || null })}
                  placeholder="Não encontrado"
                />
              </div>

              <div>
                <Label>Quartos</Label>
                <Input
                  type="number"
                  value={editableData.quartos || ''}
                  onChange={(e) => setEditableData({ ...editableData, quartos: parseInt(e.target.value) || null })}
                  placeholder="Não encontrado"
                />
              </div>

              <div>
                <Label>Banheiros</Label>
                <Input
                  type="number"
                  value={editableData.banheiros || ''}
                  onChange={(e) => setEditableData({ ...editableData, banheiros: parseInt(e.target.value) || null })}
                  placeholder="Não encontrado"
                />
              </div>

              <div>
                <Label>Vagas</Label>
                <Input
                  type="number"
                  value={editableData.vagas || ''}
                  onChange={(e) => setEditableData({ ...editableData, vagas: parseInt(e.target.value) || null })}
                  placeholder="Não encontrado"
                />
              </div>

              <div>
                <Label>Tipo</Label>
                <Select
                  value={editableData.tipo || ''}
                  onValueChange={(value) => setEditableData({ ...editableData, tipo: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apartamento">Apartamento</SelectItem>
                    <SelectItem value="casa">Casa</SelectItem>
                    <SelectItem value="terreno">Terreno</SelectItem>
                    <SelectItem value="comercial">Comercial</SelectItem>
                    <SelectItem value="chacara">Chácara</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Finalidade</Label>
                <Select
                  value={editableData.finalidade || ''}
                  onValueChange={(value) => setEditableData({ ...editableData, finalidade: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar finalidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="venda">Venda</SelectItem>
                    <SelectItem value="aluguel">Aluguel</SelectItem>
                    <SelectItem value="temporada">Temporada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Cidade</Label>
                <Input
                  value={editableData.cidade || ''}
                  onChange={(e) => setEditableData({ ...editableData, cidade: e.target.value })}
                  placeholder="Não encontrado"
                />
              </div>

              <div>
                <Label>UF</Label>
                <Input
                  value={editableData.uf || ''}
                  onChange={(e) => setEditableData({ ...editableData, uf: e.target.value })}
                  placeholder="Não encontrado"
                  maxLength={2}
                />
              </div>
            </div>

            <div>
              <Label>Descrição</Label>
              <Textarea
                value={editableData.descricao || ''}
                onChange={(e) => setEditableData({ ...editableData, descricao: e.target.value })}
                placeholder="Não encontrado"
                className="min-h-[100px]"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handleApplyData}
                className="flex-1"
                size="lg"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Aplicar ao Formulário
              </Button>
              <Button 
                variant="outline" 
                onClick={handleReset}
                size="lg"
              >
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}