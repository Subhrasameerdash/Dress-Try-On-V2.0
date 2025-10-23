import React, { useState, useRef, useEffect, useCallback } from 'react';
import { UploadedImage } from '../types';
import { CameraIcon } from './icons';

interface LiveTryOnProps {
  onImageAdd: (image: UploadedImage) => void;
}

const LiveTryOn: React.FC<LiveTryOnProps> = ({ onImageAdd }) => {
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (videoRef.current) {
        // Disconnect the stream from the video element to help release the hardware.
        videoRef.current.srcObject = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    // Always stop any existing stream before starting a new one.
    stopCamera();
    try {
      setError(null);
      const constraints = {
        video: {
          facingMode: 'user',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera: ", err);
      let errorMessage = "Could not access camera. Please check permissions and try reloading.";
      if (err instanceof DOMException) {
          if (err.name === 'NotAllowedError') {
              errorMessage = "Camera access was denied. Please grant permission in your browser settings.";
          } else if (err.name === 'NotFoundError') {
              errorMessage = "No camera found. Please ensure a camera is connected.";
          } else if (err.name === 'NotReadableError') {
              // This error often means the device is already in use.
              errorMessage = "The camera is currently in use by another application or browser tab. Please close other applications and try again.";
          }
      }
      setError(errorMessage);
    }
  }, [stopCamera]);

  useEffect(() => {
    startCamera();
    // The returned function is the cleanup function that runs when the component unmounts.
    return stopCamera;
  }, [startCamera, stopCamera]);

  const handleCapture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        // Flip horizontally for a mirror effect
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        
        const dataUrl = canvas.toDataURL('image/png');
        const base64String = dataUrl.split(',')[1];

        onImageAdd({
          base64: base64String,
          mimeType: 'image/png',
          url: dataUrl, // We can reuse the dataUrl, no need for blob URL here
          name: `live-capture-${Date.now()}.png`
        });
      }
    }
  }, [onImageAdd]);

  return (
    <div className="w-full h-full bg-gray-900 rounded-lg overflow-hidden flex flex-col justify-center items-center relative text-white">
      <canvas ref={canvasRef} className="hidden" />

      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
      
      {error && (
        <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col justify-center items-center p-4">
            <p className="text-red-400 text-center">{error}</p>
        </div>
      )}

      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-full px-4 flex justify-center">
         <button
            onClick={handleCapture}
            className="h-14 px-6 bg-white bg-opacity-90 text-pink-700 font-semibold rounded-lg shadow-lg flex items-center justify-center space-x-2 hover:bg-opacity-100 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-white"
            aria-label="Capture your pose"
            disabled={!!error}
          >
            <CameraIcon className="w-6 h-6"/>
            <span>Capture Pose</span>
          </button>
      </div>
    </div>
  );
};

export default LiveTryOn;