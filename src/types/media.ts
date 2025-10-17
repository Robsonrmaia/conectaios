export interface MediaItem {
  type: 'photo' | 'video';
  url: string;
  thumbnail?: string;
  videoType?: 'url' | 'upload';
  filename?: string;
  size?: number;
  title?: string;
}

export interface PropertyVideo {
  type: 'url' | 'upload';
  url: string;
  thumbnail?: string;
  filename?: string;
  size?: number;
  title?: string;
}

// Helper para converter fotos[] + videos[] → media[]
export function convertToMediaArray(
  photos: string[] = [], 
  videos?: PropertyVideo[]
): MediaItem[] {
  const photoItems: MediaItem[] = photos.map(url => ({
    type: 'photo' as const,
    url
  }));

  const videoItems: MediaItem[] = (videos || []).map(v => ({
    type: 'video' as const,
    url: v.url,
    thumbnail: v.thumbnail,
    videoType: v.type,
    filename: v.filename,
    size: v.size,
    title: v.title
  }));

  return [...photoItems, ...videoItems];
}

// Helper para converter media[] → fotos[] + videos[]
export function convertFromMediaArray(media: MediaItem[]): {
  photos: string[];
  videos: PropertyVideo[];
} {
  const photos = media
    .filter(m => m.type === 'photo')
    .map(m => m.url);

  const videos = media
    .filter(m => m.type === 'video')
    .map(m => ({
      type: m.videoType!,
      url: m.url,
      thumbnail: m.thumbnail,
      filename: m.filename,
      size: m.size,
      title: m.title
    }));

  return { photos, videos };
}

// Helper para obter URL de embed com autoplay
export function getAutoplayEmbedUrl(url: string): string {
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const videoId = url.includes('v=') 
      ? url.split('v=')[1]?.split('&')[0]
      : url.split('/').pop()?.split('?')[0];
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}`;
  }
  if (url.includes('vimeo.com')) {
    const videoId = url.split('/').pop()?.split('?')[0];
    return `https://player.vimeo.com/video/${videoId}?autoplay=1&muted=1&loop=1&background=1`;
  }
  return url;
}

// Helper para obter URL de embed normal (sem autoplay)
export function getEmbedUrl(url: string): string {
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const videoId = url.includes('v=') 
      ? url.split('v=')[1]?.split('&')[0]
      : url.split('/').pop()?.split('?')[0];
    return `https://www.youtube.com/embed/${videoId}`;
  }
  if (url.includes('vimeo.com')) {
    const videoId = url.split('/').pop()?.split('?')[0];
    return `https://player.vimeo.com/video/${videoId}`;
  }
  return url;
}
