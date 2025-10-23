import React, { useState, useCallback, useRef } from 'react';
import { UploadedImage } from '../types';
import { UploadIcon, RetryIcon, ExpandIcon, CompressIcon } from './icons';

interface ImageUploaderProps {
  onImageAdd: (image: UploadedImage) => void;
}

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageAdd }) => {
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fitMode, setFitMode] = useState<'contain' | 'cover'>('contain');
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
    setFitMode('contain'); // Reset for new image

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
    setUploadedImage(null);
    setFitMode('contain');
  };
  
  const handleToggleFitMode = () => {
    setFitMode(prev => prev === 'contain' ? 'cover' : 'contain');
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
         <div className="w-full h-full relative flex items-center justify-center p-2 bg-stone-200">
            <img
                src={uploadedImage.url}
                alt="User upload"
                className={`
                    max-w-full max-h-full rounded-md shadow-lg transition-all duration-300
                    ${fitMode === 'contain' ? 'object-contain' : 'object-cover w-full h-full'}
                `}
            />
             <div className="absolute top-2 right-2">
                <button
                    onClick={handleToggleFitMode}
                    className="p-2 bg-gray-700 bg-opacity-60 text-white font-semibold rounded-full shadow-lg hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-white"
                    aria-label={fitMode === 'contain' ? 'Fill frame' : 'Fit to frame'}
                    title={fitMode === 'contain' ? 'Fill frame' : 'Fit to frame'}
                >
                    {fitMode === 'contain' ? <ExpandIcon className="w-5 h-5" /> : <CompressIcon className="w-5 h-5" />}
                </button>
            </div>
             <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-auto flex justify-center">
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