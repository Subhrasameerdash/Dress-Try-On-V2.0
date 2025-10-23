import React from 'react';
import { LoadingSpinner, PlaceholderLookIcon, ErrorIcon } from './icons';

interface ResultDisplayProps {
  isLoading: boolean;
  error: string | null;
  generatedImages: string[];
  generatedVideoUrl: string | null;
  elapsedTime: number | null;
  mode: 'try-on' | 'edit' | 'video';
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ isLoading, error, generatedImages, generatedVideoUrl, elapsedTime, mode }) => {
  const hasImageResults = generatedImages.length > 0;
  const hasVideoResult = !!generatedVideoUrl;

  if (isLoading && !hasImageResults && !hasVideoResult) {
    const loadingText = mode === 'video' 
      ? "Generating your video..." 
      : (mode === 'edit' ? "Applying your edit..." : "Styling your look(s)...");
    const subText = mode === 'video'
      ? "This can take a few minutes. Please be patient."
      : "This may take a moment.";

    return (
      <div className="w-full h-full flex flex-col justify-center items-center text-center p-4 min-h-[400px]">
        <LoadingSpinner />
        <p className="mt-4 text-lg font-semibold text-stone-700">{loadingText}</p>
        <p className="text-gray-500">{subText}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex flex-col justify-center items-center text-center p-4 bg-red-50 rounded-lg border border-red-200 min-h-[400px]">
        <ErrorIcon />
        <p className="mt-4 text-lg font-semibold text-red-700">Oops! Something went wrong.</p>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }
  
  if (hasVideoResult) {
    return (
      <div className="w-full h-full flex flex-col items-center animate-fade-in">
        <h3 className="text-xl font-bold text-stone-700 mb-4">Generated Video</h3>
        <video 
          key={generatedVideoUrl}
          src={generatedVideoUrl} 
          controls 
          autoPlay
          loop
          className="w-full max-w-md rounded-lg shadow-2xl bg-stone-200"
        />
        {elapsedTime !== null && !isLoading && (
          <p className="text-sm text-gray-500 mt-6">
              ✨ Video generated in {elapsedTime.toFixed(2)} seconds
          </p>
        )}
      </div>
    );
  }


  if (hasImageResults) {
    const resultTitle = mode === 'edit' ? 'Edited Image' : `Look #${generatedImages.length}`;
    const downloadPrefix = mode === 'edit' ? 'edited-image' : 'your-new-style';

    return (
      <div className="w-full h-full flex flex-col items-center">
        {isLoading && (
          <div className="mb-4 flex items-center text-stone-600 animate-pulse">
            <LoadingSpinner />
            <p className="ml-2 font-semibold">Generating more looks...</p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {generatedImages.map((image, index) => (
            <div key={index} className="relative w-full animate-fade-in rounded-lg flex flex-col items-center">
              <h3 className="text-lg font-bold text-stone-700 mb-2">{mode === 'edit' ? 'Edited Image' : `Look #${index + 1}`}</h3>
              <div className="w-full aspect-[9/16] bg-stone-200 rounded-lg shadow-2xl overflow-hidden animate-shimmer">
                <img
                  src={`data:image/png;base64,${image}`}
                  alt={`Generated result ${index + 1}`}
                  className="w-full h-full object-contain"
                />
              </div>
              <a
                href={`data:image/png;base64,${image}`}
                download={`${downloadPrefix}-${index + 1}.png`}
                className="mt-4 py-2 px-6 bg-pink-600 text-white font-semibold rounded-lg shadow-md hover:bg-pink-700 transition-colors text-sm"
              >
                Download
              </a>
            </div>
          ))}
        </div>
        {elapsedTime !== null && !isLoading && (
          <p className="text-sm text-gray-500 mt-6">
            ✨ {generatedImages.length} {generatedImages.length > 1 ? 'results' : 'result'} created in {elapsedTime.toFixed(2)} seconds
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col justify-center items-center text-center p-4 bg-stone-100 rounded-lg min-h-[400px]">
      <PlaceholderLookIcon />
      <p className="mt-4 text-lg font-semibold text-stone-700">Your creation will appear here</p>
      <p className="text-gray-500">Upload a photo, choose your settings, and click the generate button to see the magic.</p>
    </div>
  );
};

export default ResultDisplay;
