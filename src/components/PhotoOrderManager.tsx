import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Move, Star, Eye, RotateCcw, Video, Play } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface MediaItem {
  id: string;
  url: string;
  type: 'photo' | 'video';
  is_cover?: boolean;
  filename?: string;
  thumbnail?: string;
  size?: number;
}

interface PhotoOrderManagerProps {
  media: MediaItem[];
  onMediaReorder: (reorderedMedia: MediaItem[]) => void;
  onCoverSelect: (coverId: string) => void;
  coverId: string;
}

export function PhotoOrderManager({ 
  media, 
  onMediaReorder, 
  onCoverSelect, 
  coverId 
}: PhotoOrderManagerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const validMedia = media.filter(item => 
    item.url && (item.url.startsWith('http') || item.url.startsWith('data:'))
  );

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = (result: DropResult) => {
    setIsDragging(false);
    if (!result.destination) return;
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) return;

    const reorderedMedia = Array.from(validMedia);
    const [removed] = reorderedMedia.splice(sourceIndex, 1);
    reorderedMedia.splice(destinationIndex, 0, removed);

    onMediaReorder(reorderedMedia);
    
    // Update cover status based on new order
    const newCoverId = reorderedMedia[0]?.id || '';
    if (newCoverId !== coverId) {
      onCoverSelect(newCoverId);
    }
  };

  const setCoverMedia = (id: string) => {
    const reorderedMedia = Array.from(media);
    const itemIndex = reorderedMedia.findIndex(item => item.id === id);
    if (itemIndex === -1) return;

    const [itemToMove] = reorderedMedia.splice(itemIndex, 1);
    reorderedMedia.unshift(itemToMove);

    onMediaReorder(reorderedMedia);
    onCoverSelect(id);
    
    toast({
      title: "Capa definida! ⭐",
      description: `A mídia selecionada agora é a capa.`,
    });
  };

  const resetOrder = () => {
    // This would require storing the original order, for now, just reset cover
    if (validMedia.length > 0) {
      onCoverSelect(validMedia[0].id);
    }
    toast({
      title: "Ordem restaurada! 🔄",
      description: "A primeira mídia foi definida como capa.",
    });
  };

  if (validMedia.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Move className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            Adicione fotos ou vídeos para organizar e selecionar a capa
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Move className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg font-semibold">
              Organizar Mídias
              <Badge variant="secondary" className="ml-2">
                {validMedia.length} itens
              </Badge>
            </CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={resetOrder}
          >
            <RotateCcw className="h-4 w-4 mr-1" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Arraste para reorganizar. O primeiro item será a capa do imóvel.
            </div>
            <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              <Droppable droppableId="media">
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`space-y-3 ${
                      snapshot.isDragging ? 'bg-muted/50 rounded-lg p-2' : ''
                    }`}
                  >
                    {validMedia.map((item, index) => (
                      <Draggable key={item.id} draggableId={item.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`
                              flex items-center gap-4 p-3 border rounded-lg transition-all
                              ${snapshot.isDragging ? 'shadow-lg bg-background' : 'hover:bg-muted/30'}
                              ${item.id === coverId ? 'border-primary bg-primary/5' : ''}
                            `}
                          >
                            <div
                              {...provided.dragHandleProps}
                              className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
                            >
                              <Move className="h-4 w-4 text-muted-foreground" />
                            </div>
                            
                            <div className="relative">
                              <div className="w-16 h-16 aspect-square rounded border overflow-hidden bg-muted flex items-center justify-center">
                                {item.type === 'photo' ? (
                                  <img
                                    src={item.url}
                                    alt={`Mídia ${index + 1}`}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = '/placeholder.svg';
                                    e.target.onerror = null;
                                    return;
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Video className="h-8 w-8 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                              
                              {item.id === coverId && (
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
                                {item.type === 'video' ? (
                                  <span className="flex items-center gap-1">
                                    <Video className="h-4 w-4" />
                                    Vídeo
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1">
                                    <Eye className="h-4 w-4" />
                                    Foto
                                  </span>
                                )}
                              </p>
                              {item.filename && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {item.filename}
                                </p>
                              )}
                            </div>
                            
                            <Button
                              variant={item.id === coverId ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCoverMedia(item.id)}
                            >
                              <Star className="h-4 w-4 mr-1" />
                              {item.id === coverId ? 'É a capa' : 'Definir capa'}
                            </Button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          </CardContent>
        </Card>
  );
}