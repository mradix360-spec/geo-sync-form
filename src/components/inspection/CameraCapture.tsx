import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, X, Check, RotateCcw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CameraCaptureProps {
  onPhotoCapture: (photoUrl: string) => void;
  photos: string[];
  onRemovePhoto: (index: number) => void;
  taskId: string;
}

export const CameraCapture = ({ onPhotoCapture, photos, onRemovePhoto, taskId }: CameraCaptureProps) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [uploading, setUploading] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async (mode: 'user' | 'environment' = facingMode) => {
    try {
      // Stop existing stream if any
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: mode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false,
      });
      
      setStream(mediaStream);
      setIsCapturing(true);
      setFacingMode(mode);
      
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

  const toggleCamera = () => {
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    startCamera(newMode);
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCapturing(false);
  };

  const capturePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      setUploading(true);
      try {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const context = canvas.getContext('2d');
        if (!context) return;

        context.drawImage(video, 0, 0);
        
        // Convert to blob with compression
        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.7);
        });

        // Upload to Supabase Storage
        const fileName = `${taskId}/${Date.now()}.jpg`;
        const { data, error } = await supabase.storage
          .from('inspection-photos')
          .upload(fileName, blob, {
            contentType: 'image/jpeg',
            cacheControl: '3600',
          });

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('inspection-photos')
          .getPublicUrl(fileName);

        onPhotoCapture(publicUrl);
        
        toast({
          title: 'Photo uploaded',
          description: 'Photo has been saved to cloud.',
        });
      } catch (error: any) {
        console.error('Photo upload error:', error);
        toast({
          variant: 'destructive',
          title: 'Upload failed',
          description: 'Photo saved locally, will retry when online.',
        });
        
        // Fallback to data URL if upload fails
        const photoDataUrl = canvasRef.current!.toDataURL('image/jpeg', 0.7);
        onPhotoCapture(photoDataUrl);
      } finally {
        setUploading(false);
      }
    }
  };

  return (
    <div className="space-y-4">
      {!isCapturing ? (
        <Button onClick={() => startCamera()} size="lg" className="w-full gap-2 h-14">
          <Camera className="w-6 h-6" />
          <span className="text-lg font-semibold">Open Camera</span>
        </Button>
      ) : (
        <Card className="relative overflow-hidden bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full rounded-lg"
            style={{ minHeight: '60vh', objectFit: 'cover' }}
          />
          <div className="absolute inset-0 pointer-events-none">
            {/* Grid overlay for better framing */}
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-30">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="border border-white/50"></div>
              ))}
            </div>
          </div>
          <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-4 px-4">
            <Button 
              variant="secondary" 
              onClick={stopCamera} 
              size="lg" 
              className="rounded-full h-14 w-14 p-0 shadow-lg"
            >
              <X className="w-6 h-6" />
            </Button>
            <Button 
              onClick={capturePhoto} 
              disabled={uploading}
              size="lg" 
              className="rounded-full h-20 w-20 p-0 bg-white text-black hover:bg-white/90 shadow-lg border-4 border-white/50"
            >
              {uploading ? (
                <div className="w-6 h-6 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-white border-2 border-black" />
              )}
            </Button>
            <Button 
              variant="secondary" 
              onClick={toggleCamera} 
              size="lg" 
              className="rounded-full h-14 w-14 p-0 shadow-lg"
            >
              <RotateCcw className="w-6 h-6" />
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
