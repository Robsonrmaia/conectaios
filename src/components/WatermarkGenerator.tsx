import { useEffect, useRef } from 'react';

interface WatermarkGeneratorProps {
  imageUrl: string;
  watermarkText: string;
  onWatermarkedImage: (watermarkedUrl: string) => void;
}

export function WatermarkGenerator({ imageUrl, watermarkText, onWatermarkedImage }: WatermarkGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!imageUrl || !watermarkText) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      // Set canvas size to match image
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw the original image
      ctx.drawImage(img, 0, 0);

      // Add watermark
      const fontSize = Math.max(16, img.width / 30);
      ctx.font = `bold ${fontSize}px Arial`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.lineWidth = 2;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';

      const x = img.width - 20;
      const y = img.height - 20;

      // Draw text with stroke for better visibility
      ctx.strokeText(watermarkText, x, y);
      ctx.fillText(watermarkText, x, y);

      // Convert canvas to blob and get URL
      canvas.toBlob((blob) => {
        if (blob) {
          const watermarkedUrl = URL.createObjectURL(blob);
          onWatermarkedImage(watermarkedUrl);
        }
      }, 'image/jpeg', 0.9);
    };

    img.onerror = () => {
      console.error('Error loading image for watermark');
      onWatermarkedImage(imageUrl); // Return original if watermark fails
    };

    img.src = imageUrl;
  }, [imageUrl, watermarkText, onWatermarkedImage]);

  return <canvas ref={canvasRef} style={{ display: 'none' }} />;
}