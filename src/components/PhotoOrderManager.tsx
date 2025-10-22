import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Move, Star, RotateCcw } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface PhotoOrderManagerProps {
  photos: string[];
  onPhotosReorder: (reorderedPhotos: string[]) => void;
  onCoverPhotoSelect: (coverIndex: number) => void;
  coverPhotoIndex: number;
}

export function PhotoOrderManager({
  photos,
  onPhotosReorder,
  onCoverPhotoSelect,
  coverPhotoIndex
}: PhotoOrderManagerProps) {
  const [isDragging, setIsDragging] = useState(false);

  const validPhotos = Array.isArray(photos)
    ? photos.filter((url) => url && (url.startsWith('http') || url.startsWith('data:')))
    : [];

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = (result: DropResult) => {
    setIsDragging(false);
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) return;

    const reordered = Array.from(validPhotos);
    const [moved] = reordered.splice(sourceIndex, 1);
    reordered.splice(destinationIndex, 0, moved);

    onPhotosReorder(reordered);

    // Se o item foi para a primeira posição, atualiza capa
    if (destinationIndex === 0) {
      onCoverPhotoSelect(0);
    }
  };

  const setCoverPhoto = (index: number) => {
    if (index < 0 || index >= validPhotos.length) return;
    const reordered = Array.from(validPhotos);
    const [photo] = reordered.splice(index, 1);
    reordered.unshift(photo);
    onPhotosReorder(reordered);
    onCoverPhotoSelect(0);

    toast({
      title: 'Capa definida! ⭐',
      description: 'A primeira foto agora é usada como capa.',
    });
  };

  const resetOrder = () => {
    if (validPhotos.length === 0) return;
    // Mantemos a ordem atual, apenas garantimos a capa na primeira posição
    onCoverPhotoSelect(0);
    toast({
      title: 'Ordem restaurada! 🔄',
      description: 'A primeira foto foi definida como capa.',
    });
  };

  if (validPhotos.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Move className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            Adicione fotos para organizar e selecionar a capa
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Move className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg font-semibold">
              Organizar Fotos
              <Badge variant="secondary" className="ml-2">
                {validPhotos.length} itens
              </Badge>
            </CardTitle>
          </div>

          <Button variant="outline" size="sm" onClick={resetOrder}>
            <RotateCcw className="h-4 w-4 mr-1" />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Arraste para reorganizar. A primeira foto será usada como capa do imóvel.
          </div>

          <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <Droppable droppableId="photos">
              {(provided, snapshot) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={`space-y-3 ${snapshot.isDragging ? 'bg-muted/50 rounded-lg p-2' : ''}`}
                >
                  {validPhotos.map((url, index) => (
                    <Draggable key={`${url}-${index}`} draggableId={`photo-${index}`} index={index}>
                      {(dragProvided, dragSnapshot) => (
                        <div
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          className={`
                            flex items-center gap-4 p-3 border rounded-lg transition-all
                            ${dragSnapshot.isDragging ? 'shadow-lg bg-background' : 'hover:bg-muted/30'}
                            ${index === coverPhotoIndex ? 'border-primary bg-primary/5' : ''}
                          `}
                        >
                          <div
                            {...dragProvided.dragHandleProps}
                            className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
                          >
                            <Move className="h-4 w-4 text-muted-foreground" />
                          </div>

                          <div className="relative">
                            <div className="w-16 h-16 aspect-square rounded border overflow-hidden bg-muted flex items-center justify-center">
                              <img
                                src={url}
                                alt={`Foto ${index + 1}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/placeholder.svg';
                                  (e.target as HTMLImageElement).onerror = null;
                                }}
                              />
                            </div>

                            {index === coverPhotoIndex && (
                              <div className="absolute top-2 right-2">
                                <Badge className="bg-primary text-primary-foreground text-xs">
                                  <Star className="w-3 h-3 mr-1" />
                                  Capa
                                </Badge>
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              Foto {index + 1}
                            </p>
                          </div>

                          <Button
                            variant={index === coverPhotoIndex ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setCoverPhoto(index)}
                          >
                            <Star className="h-4 w-4 mr-1" />
                            {index === coverPhotoIndex ? 'É a capa' : 'Definir capa'}
                          </Button>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </CardContent>
    </Card>
  );
}

export default PhotoOrderManager;