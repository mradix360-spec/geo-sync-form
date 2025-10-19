export const requestCameraPermission = async (): Promise<boolean> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: 'environment' } 
    });
    // Stop the stream immediately, we just needed permission
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (error) {
    console.error('Camera permission denied:', error);
    return false;
  }
};

export const capturePhoto = async (videoElement: HTMLVideoElement): Promise<string> => {
  const canvas = document.createElement('canvas');
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;
  
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not get canvas context');
  
  context.drawImage(videoElement, 0, 0);
  return canvas.toDataURL('image/jpeg', 0.8);
};

export const dataURLtoFile = (dataurl: string, filename: string): File => {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new File([u8arr], filename, { type: mime });
};
