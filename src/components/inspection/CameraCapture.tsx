import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, X, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CameraCaptureProps {
  onPhotoCapture: (photoDataUrl: string) => void;
  photos: string[];
  onRemovePhoto: (index: number) => void;
}

export const CameraCapture = ({ onPhotoCapture, photos, onRemovePhoto }: CameraCaptureProps) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      
      setStream(mediaStream);
      setIsCapturing(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Camera access denied',
        description: 'Please allow camera access to take photos.',
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCapturing(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0);
        const photoDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        onPhotoCapture(photoDataUrl);
        
        toast({
          title: 'Photo captured',
          description: 'Photo has been added to inspection.',
        });
      }
    }
  };

  return (
    <div className="space-y-4">
      {!isCapturing ? (
        <Button onClick={startCamera} className="w-full gap-2">
          <Camera className="w-5 h-5" />
          Activate Camera
        </Button>
      ) : (
        <Card className="relative overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full rounded-lg"
          />
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
            <Button variant="destructive" onClick={stopCamera} size="lg" className="rounded-full">
              <X className="w-6 h-6" />
            </Button>
            <Button onClick={capturePhoto} size="lg" className="rounded-full bg-white text-black hover:bg-white/90">
              <Check className="w-6 h-6" />
            </Button>
          </div>
        </Card>
      )}
      
      <canvas ref={canvasRef} className="hidden" />

      {photos.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">Captured Photos ({photos.length})</h4>
          <div className="grid grid-cols-2 gap-2">
            {photos.map((photo, index) => (
              <div key={index} className="relative group">
                <img
                  src={photo}
                  alt={`Captured ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onRemovePhoto(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
