import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Video, Image as ImageIcon, ZoomIn } from 'lucide-react';
import type { Property } from './types';

interface MediaSectionProps {
  property: Property;
  openPhotoGallery: (photos: string[], initialIndex?: number) => void;
}

export function MediaSection({ property, openPhotoGallery }: MediaSectionProps) {
  const photosCount = property.fotos?.length || 0;
  const videosCount = property.videos?.length || 0;

  if (photosCount === 0 && videosCount === 0) return null;

  return (
    <section className="px-6 py-12">
      <div className="mb-8">
        <Tabs defaultValue="fotos" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="fotos" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Fotos ({photosCount})
            </TabsTrigger>
            <TabsTrigger value="videos" className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              Vídeos ({videosCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="fotos">
            {photosCount > 0 ? (
              <div>
                <h3 className="text-xl font-semibold mb-4">Galeria de Fotos</h3>
                <div className="grid grid-cols-3 gap-2">
                  {property.fotos.slice(0, 9).map((foto, index) => (
                    <div
                      key={index}
                      className="relative aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer 
                        group hover:scale-105 transition-all duration-300 
                        hover:ring-4 hover:ring-blue-400/50 hover:shadow-2xl
                        hover:brightness-110"
                      onClick={() => openPhotoGallery(property.fotos, index)}
                    >
                      <img
                        src={foto}
                        alt={`Foto ${index + 1} do imóvel`}
                        className="w-full h-full object-cover transition-all duration-300"
                      />
                      <div className="absolute top-2 right-2 bg-blue-600/90 text-white text-xs px-2 py-1 rounded-full 
                        opacity-0 group-hover:opacity-100 transition-opacity duration-300 sm:hidden">
                        <ZoomIn className="h-3 w-3" />
                      </div>
                      {index === 8 && property.fotos.length > 9 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-white font-semibold">
                            +{property.fotos.length - 8}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <ImageIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Nenhuma foto disponível</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="videos">
            {videosCount > 0 ? (
              <div>
                <h3 className="text-xl font-semibold mb-4">Vídeos do Imóvel</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {property.videos!.map((video, index) => (
                    <div key={index} className="space-y-2">
                      {video.title && (
                        <p className="text-sm font-medium text-gray-700">{video.title}</p>
                      )}
                      {video.type === 'url' ? (
                        <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                          {video.url.includes('youtube.com') || video.url.includes('youtu.be') ? (
                            <iframe
                              src={video.url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                              className="w-full h-full"
                              allowFullScreen
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              title={video.title || `Vídeo ${index + 1}`}
                            />
                          ) : video.url.includes('vimeo.com') ? (
                            <iframe
                              src={video.url.replace('vimeo.com/', 'player.vimeo.com/video/')}
                              className="w-full h-full"
                              allowFullScreen
                              allow="autoplay; fullscreen; picture-in-picture"
                              title={video.title || `Vídeo ${index + 1}`}
                            />
                          ) : (
                            <video controls className="w-full h-full" poster={video.thumbnail}>
                              <source src={video.url} />
                            </video>
                          )}
                        </div>
                      ) : (
                        <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                          <video controls className="w-full h-full" poster={video.thumbnail} preload="metadata">
                            <source src={video.url} type="video/mp4" />
                            <source src={video.url} type="video/webm" />
                            Seu navegador não suporta reprodução de vídeo.
                          </video>
                        </div>
                      )}
                      {video.filename && (
                        <p className="text-xs text-gray-500">
                          📁 {video.filename}
                          {video.size && ` • ${(video.size / 1024 / 1024).toFixed(2)} MB`}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Video className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Nenhum vídeo disponível</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}