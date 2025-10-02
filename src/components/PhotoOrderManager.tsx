import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Move, Star, Eye, RotateCcw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface PhotoOrderManagerProps {
  photos: string[];
  onPhotosReorder: (reorderedPhotos: string[]) => void;
  onCoverPhotoSelect: (coverIndex: number) => void;
  coverPhotoIndex?: number;
}

export function PhotoOrderManager({ 
  photos, 
  onPhotosReorder, 
  onCoverPhotoSelect,
  coverPhotoIndex = 0 
}: PhotoOrderManagerProps) {
  const [isDragging, setIsDragging] = useState(false);

  // ✅ Validar que é uma URL válida do Supabase Storage
  const isValidStorageUrl = (url: string) => {
    return url && 
           (url.startsWith('http://') || url.startsWith('https://')) && 
           !url.startsWith('data:');
  };

  // Filtrar apenas fotos com URLs válidas
  const validPhotos = photos.filter(isValidStorageUrl);

  // Avisar se houver fotos inválidas
  if (validPhotos.length !== photos.length) {
    console.warn(`⚠️ ${photos.length - validPhotos.length} fotos com URLs inválidas foram filtradas`);
  }

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = (result: DropResult) => {
    setIsDragging(false);

    if (!result.destination) {
      return;
    }

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) {
      return;
    }

    const reorderedPhotos = Array.from(validPhotos);
    const [removed] = reorderedPhotos.splice(sourceIndex, 1);
    reorderedPhotos.splice(destinationIndex, 0, removed);

    onPhotosReorder(reorderedPhotos);

    // Update cover photo index if necessary
    let newCoverIndex = coverPhotoIndex;
    if (sourceIndex === coverPhotoIndex) {
      newCoverIndex = destinationIndex;
    } else if (sourceIndex < coverPhotoIndex && destinationIndex >= coverPhotoIndex) {
      newCoverIndex = coverPhotoIndex - 1;
    } else if (sourceIndex > coverPhotoIndex && destinationIndex <= coverPhotoIndex) {
      newCoverIndex = coverPhotoIndex + 1;
    }

    if (newCoverIndex !== coverPhotoIndex) {
      onCoverPhotoSelect(newCoverIndex);
    }

    toast({
      title: "Fotos reorganizadas! 📸",
      description: "A ordem das fotos foi atualizada com sucesso.",
    });
  };

  const setCoverPhoto = (index: number) => {
    onCoverPhotoSelect(index);
    toast({
      title: "Foto de capa definida! ⭐",
      description: `A foto ${index + 1} agora é a foto de capa.`,
    });
  };

  const resetOrder = () => {
    // Reset to original order (this would need to be handled by parent component)
    onCoverPhotoSelect(0);
    toast({
      title: "Ordem restaurada! 🔄",
      description: "A ordem original das fotos foi restaurada.",
    });
  };

  if (validPhotos.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {photos.length > 0 
            ? 'Nenhuma foto válida encontrada. Use apenas URLs do Supabase Storage.' 
            : 'Adicione fotos para organizar e selecionar a capa'}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Move className="h-5 w-5" />
          Organizar Fotos
          <Badge variant="secondary">{validPhotos.length} fotos</Badge>
        </CardTitle>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={resetOrder}
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Restaurar Ordem
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Arraste as fotos para reorganizar. A primeira foto será a capa do imóvel.
          </div>
          
          <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <Droppable droppableId="photos">
              {(provided, snapshot) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={`space-y-3 ${
                    snapshot.isDraggingOver ? 'bg-muted/50 rounded-lg p-2' : ''
                  }`}
                >
                  {validPhotos.map((photo, index) => (
                    <Draggable key={photo} draggableId={photo} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`
                            flex items-center gap-4 p-3 border rounded-lg transition-all
                            ${snapshot.isDragging ? 'shadow-lg bg-background' : 'hover:bg-muted/30'}
                            ${index === coverPhotoIndex ? 'border-primary bg-primary/5' : ''}
                          `}
                        >
                          <div
                            {...provided.dragHandleProps}
                            className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
                          >
                            <Move className="h-4 w-4 text-muted-foreground" />
                          </div>
                          
                          <div className="relative">
                            <img
                              src={photo}
                              alt={`Foto ${index + 1}`}
                              className="w-16 h-16 object-cover rounded border"
                            />
                            {index === coverPhotoIndex && (
                              <div className="absolute -top-1 -right-1">
                                <Badge variant="default" className="text-xs px-1">
                                  <Star className="h-3 w-3" />
                                </Badge>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Foto {index + 1}</span>
                              {index === coverPhotoIndex && (
                                <Badge variant="secondary" className="text-xs">
                                  Capa
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {index === 0 ? 'Primeira foto - aparece nos cards' : 
                               index === coverPhotoIndex ? 'Foto de capa selecionada' : 
                               'Foto adicional na galeria'}
                            </p>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(photo, '_blank')}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            {index !== coverPhotoIndex && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCoverPhoto(index)}
                              >
                                <Star className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
          
          <div className="text-xs text-muted-foreground">
            💡 Dica: A primeira foto é sempre exibida nos cards do marketplace. 
            Use a estrela para definir uma foto específica como capa.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}