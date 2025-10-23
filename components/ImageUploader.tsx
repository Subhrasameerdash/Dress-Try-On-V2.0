import React, { useState, useCallback, useRef } from 'react';
import { UploadedImage } from '../types';
import { UploadIcon, RetryIcon } from './icons';

interface ImageUploaderProps {
  onImageAdd: (image: UploadedImage) => void;
}

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageAdd }) => {
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    if (file.size > MAX_FILE_SIZE_BYTES) {
        setError(`Image is too large. Max size is ${MAX_FILE_SIZE_MB}MB.`);
        return;
    }
    if (!file.type.startsWith('image/')) {
        setError('Please upload a valid image file (PNG, JPG, etc.).');
        return;
    }
    setError(null);

    const reader = new FileReader();
    reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        const imageUrl = URL.createObjectURL(file);
        const newImage: UploadedImage = {
            base64: base64String,
            mimeType: file.type,
            url: imageUrl,
            name: file.name
        };
        setUploadedImage(newImage);
        onImageAdd(newImage);
    };
    reader.onerror = () => {
        setError("There was an error reading the file.");
    };
    reader.readAsDataURL(file);
  }, [onImageAdd]);


  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // Reset file input to allow uploading the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [processFile]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingOver(false);
  };

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleClearUploader = () => {
    // We don't revoke the object URL here because the parent component (App) now holds a reference to it.
    // The parent is responsible for revoking it when the session is reset.
    setUploadedImage(null);
  };


  return (
    <div className="w-full h-full bg-stone-100 rounded-lg overflow-hidden flex flex-col justify-center items-center relative text-white">
       <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
        aria-label="Upload your photo"
      />

      {uploadedImage ? (
         <div className="w-full h-full relative">
            <img src={uploadedImage.url} alt="User upload" className="w-full h-full object-cover" />
             <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-full px-4 flex justify-center">
                 <button
                    onClick={handleClearUploader}
                    className="h-14 px-6 bg-gray-700 bg-opacity-80 text-white font-semibold rounded-lg shadow-lg hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-white flex items-center space-x-2"
                    aria-label="Upload another photo"
                  >
                    <RetryIcon/>
                    <span>Upload Another</span>
                  </button>
            </div>
         </div>
      ) : (
        <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={handleUploadClick}
            className={`w-full h-full flex flex-col justify-center items-center text-center p-8 border-4 border-dashed rounded-lg cursor-pointer transition-colors duration-300 ${isDraggingOver ? 'border-pink-500 bg-pink-100' : 'border-pink-200'}`}
        >
            <UploadIcon className="h-16 w-16 text-pink-400" />
            <p className="mt-4 text-lg font-semibold text-stone-700">Drag & Drop Your Photo</p>
            <p className="text-gray-500">or click to browse</p>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
