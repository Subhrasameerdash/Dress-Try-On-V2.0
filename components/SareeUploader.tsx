import React, { useState, useRef, useCallback } from 'react';
import { ClassifyingItem } from '../types';
import { PlusIcon, LoadingSpinner, ErrorIcon } from './icons';

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

interface StyleUploaderProps {
  onStyleUpload: (files: File[]) => void;
  classifyingItems: ClassifyingItem[];
}

// This component is now the centralized uploader for all new styles.
// It handles file selection, drag & drop, and displays items being classified.
const StyleUploader: React.FC<StyleUploaderProps> = ({ onStyleUpload, classifyingItems }) => {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback((files: File[]) => {
    setError(null);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length === 0 && files.length > 0) {
      setError("No valid image files found in the selection.");
      return;
    }

    const validSizeFiles = imageFiles.filter(file => file.size <= MAX_FILE_SIZE_BYTES);
    const oversizedFilesCount = imageFiles.length - validSizeFiles.length;

    if (oversizedFilesCount > 0) {
        setError(`${oversizedFilesCount} image(s) exceeded the ${MAX_FILE_SIZE_MB}MB size limit and were not added.`);
    }

    if (validSizeFiles.length > 0) {
      onStyleUpload(validSizeFiles);
    }
  }, [onStyleUpload]);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      processFiles(Array.from(files));
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [processFiles]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingOver(false);
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      processFiles(Array.from(files));
    }
  }, [processFiles]);

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingOver(false);
  };

  const handleUploadClick = () => fileInputRef.current?.click();

  return (
    <div className="mb-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
        multiple
        aria-label="Upload style items"
      />
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleUploadClick}
        className={`bg-stone-50 border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors duration-300 ${isDraggingOver ? 'border-pink-500 bg-pink-100' : 'border-pink-200 hover:border-pink-400'}`}
        role="button"
        tabIndex={0}
      >
        <div className="flex flex-col items-center justify-center">
            <PlusIcon />
            <p className="mt-1 text-sm font-semibold text-gray-700">Add Your Styles</p>
            <p className="text-xs text-gray-500">Drag & drop or click to upload</p>
        </div>
      </div>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      
      {classifyingItems.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-bold text-stone-600 mb-2">Classifying new items...</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {classifyingItems.map(item => (
              <div key={item.id} className="relative aspect-[3/4] rounded-md overflow-hidden bg-stone-200">
                <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col items-center justify-center p-1">
                  {item.error ? (
                    <>
                      <ErrorIcon />
                      <p className="text-red-400 text-xs text-center mt-1">{item.error}</p>
                    </>
                  ) : (
                    <>
                      <LoadingSpinner />
                      <p className="text-white text-xs text-center mt-2">Classifying...</p>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StyleUploader;
