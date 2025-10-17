import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X, Building2, Play } from 'lucide-react';
import { MediaItem, getEmbedUrl } from '@/types/media';

interface MediaGalleryProps {
  media: MediaItem[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  autoplayFirstVideo?: boolean;
}

export function MediaGallery({ media, initialIndex = 0, isOpen, onClose, autoplayFirstVideo = false }: MediaGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, currentIndex, media.length]);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % media.length);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);
  };

  if (!media.length) return null;

  const currentMedia = media[currentIndex];

  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal={true}>
      <DialogContent 
        className="w-[calc(100vw-2rem)] max-w-4xl h-[90vh] p-0 mx-auto"
        style={{ zIndex: 10020 }}
      >
        <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Media Counter */}
          <div className="absolute top-4 left-4 z-10 bg-black/50 text-white px-3 py-1 rounded">
            {currentIndex + 1} / {media.length}
          </div>

          {/* Main Media */}
          <div className="w-full h-full flex items-center justify-center">
            {currentMedia ? (
              currentMedia.type === 'photo' ? (
                <img
                  src={currentMedia.url}
                  alt={`Mídia ${currentIndex + 1}`}
                  className="max-w-full max-h-full object-contain"
                />
              ) : currentMedia.videoType === 'url' ? (
                <iframe
                  src={getEmbedUrl(currentMedia.url)}
                  className="w-full h-full"
                  allowFullScreen
                  allow="autoplay; fullscreen"
                />
              ) : (
                <video
                  controls
                  autoPlay={autoplayFirstVideo && currentIndex === 0}
                  muted={autoplayFirstVideo && currentIndex === 0}
                  loop={autoplayFirstVideo && currentIndex === 0}
                  playsInline
                  className="max-w-full max-h-full"
                >
                  <source src={currentMedia.url} />
                </video>
              )
            ) : (
              <div className="flex flex-col items-center text-white">
                <Building2 className="h-16 w-16 mb-4" />
                <p>Mídia não disponível</p>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          {media.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                onClick={goToPrevious}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                onClick={goToNext}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}

          {/* Thumbnail Strip */}
          {media.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 max-w-[90vw] overflow-x-auto">
              <div className="flex gap-2 bg-black/50 p-2 rounded min-w-max">
                {media.map((item, index) => (
                  <button
                    key={index}
                    className={`relative w-12 h-8 rounded overflow-hidden border-2 transition-colors flex-shrink-0 ${
                      index === currentIndex ? 'border-primary' : 'border-transparent'
                    }`}
                    onClick={() => setCurrentIndex(index)}
                  >
                    {item.type === 'photo' ? (
                      <img
                        src={item.url}
                        alt={`Miniatura ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <>
                        {item.thumbnail ? (
                          <img
                            src={item.thumbnail}
                            alt={`Miniatura ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-black" />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Play className="h-3 w-3 text-white" />
                        </div>
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}