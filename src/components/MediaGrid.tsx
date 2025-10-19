import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Play, Image as ImageIcon } from 'lucide-react';
import { PhotoGallery } from './PhotoGallery';

interface MediaItem {
  kind: 'image' | 'video';
  url: string;
  is_cover?: boolean;
  filename?: string;
}

interface MediaGridProps {
  items: MediaItem[];
  onRemove?: (index: number) => void;
  onSetCover?: (index: number) => void;
  editable?: boolean;
}

export function MediaGrid({ items, onRemove, onSetCover, editable = false }: MediaGridProps) {
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<string | null>(null);

  const handleItemClick = (item: MediaItem, index: number) => {
    if (item.kind === 'video') {
      setCurrentVideo(item.url);
      setVideoModalOpen(true);
    } else {
      setGalleryIndex(index);
      setGalleryOpen(true);
    }
  };

  const images = items.filter(i => i.kind === 'image').map(i => i.url);

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {items.map((item, index) => (
          <div 
            key={index} 
            className="relative aspect-video group overflow-hidden rounded-md border border-border"
          >
            {/* Media preview */}
            {item.kind === 'image' ? (
              <img 
                src={item.url} 
                alt={`Mídia ${index + 1}`}
                className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => handleItemClick(item, index)}
              />
            ) : (
              <div 
                className="w-full h-full relative bg-black/5 flex items-center justify-center cursor-pointer hover:bg-black/10 transition-colors"
                onClick={() => handleItemClick(item, index)}
              >
                <video 
                  src={item.url} 
                  className="w-full h-full object-cover"
                  preload="metadata"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <Play className="h-12 w-12 text-white drop-shadow-lg" fill="currentColor" />
                </div>
              </div>
            )}

            {/* Badge de tipo */}
            <div className="absolute top-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
              {item.kind === 'image' ? <ImageIcon className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              {item.kind === 'image' ? 'Foto' : 'Vídeo'}
            </div>

            {/* Capa badge */}
            {item.is_cover && (
              <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium">
                Capa
              </div>
            )}

            {/* Actions - apenas em edição */}
            {editable && (
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                {onSetCover && !item.is_cover && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSetCover(index);
                    }}
                  >
                    Definir capa
                  </Button>
                )}
                {onRemove && (
                  <Button
                    size="icon"
                    variant="destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(index);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Photo Gallery */}
      <PhotoGallery 
        photos={images}
        initialIndex={galleryIndex}
        isOpen={galleryOpen}
        onClose={() => setGalleryOpen(false)}
      />

      {/* Video Modal */}
      {videoModalOpen && currentVideo && (
        <div 
          className="fixed inset-0 bg-black/90 z-[10020] flex items-center justify-center p-4"
          onClick={() => setVideoModalOpen(false)}
        >
          <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-12 right-0 text-white hover:bg-white/20"
              onClick={() => setVideoModalOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>
            <video 
              src={currentVideo}
              controls
              autoPlay
              playsInline
              className="w-full max-h-[80vh] rounded-lg"
            />
          </div>
        </div>
      )}
    </>
  );
}
