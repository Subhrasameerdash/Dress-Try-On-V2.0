import React, { useState, useCallback, useEffect } from 'react';
import { FilterItem, UploadedImage, TryOnItem, ClassifyingItem } from './types';
import { virtualTryOn, classifyClothingItem, editImage, generateVideo } from './services/geminiService';
import { loadCatalogueFromStorage, saveCatalogueToStorage, clearAllCataloguesFromStorage } from './utils/storage';
import { readFileAsBase64, base64ToBlob } from './utils/imageUtils';
import Catalogue from './components/Catalogue';
import ResultDisplay from './components/ResultDisplay';
import { HeaderIcon, TryOnIcon, CameraIcon, PhotoIcon, CheckCircleIcon, TrashIcon, EditIcon, VideoIcon, DownloadIcon } from './components/icons';
import LiveTryOn from './components/LiveTryOn';
import ImageUploader from './components/ImageUploader';
import { FEMALE_CATALOGUE_DATA, MALE_CATALOGUE_DATA } from './constants';

type CatalogueData = Record<string, FilterItem[]>;
type SelectedItems = Record<string, FilterItem[]>;
type CreativeMode = 'try-on' | 'edit' | 'video';

const generateOutfitCombinations = (selectedItems: SelectedItems): TryOnItem[][] => {
  const outfits: TryOnItem[][] = [];
  const selectedCats = Object.keys(selectedItems).filter(cat => selectedItems[cat].length > 0);
  const cartesian = <T,>(...arrays: T[][]): T[][] => {
    const nonEmptyArrays = arrays.filter(arr => arr.length > 0);
    if (nonEmptyArrays.length === 0) return [[]];
    return nonEmptyArrays.reduce<T[][]>((acc, val) => acc.flatMap(d => val.map(e => [...d, e])), [[]]);
  };
  const toTryOnItem = (item: FilterItem, category: string): TryOnItem => ({ ...item, category });
  const baseItems: TryOnItem[][] = [];
  if (selectedItems.outfits.length > 0) {
    baseItems.push(...selectedItems.outfits.map(item => [toTryOnItem(item, 'outfits')]));
  } else {
    const tops = selectedItems.tops.map(item => toTryOnItem(item, 'tops'));
    const bottoms = selectedItems.bottoms.map(item => toTryOnItem(item, 'bottoms'));
    cartesian(tops, bottoms).forEach(combo => baseItems.push(combo));
  }
  const footwear = selectedItems.footwear.map(item => toTryOnItem(item, 'footwear'));
  const headwear = selectedItems.headwear.map(item => toTryOnItem(item, 'headwear'));
  const accessories = selectedItems.accessories.map(item => toTryOnItem(item, 'accessories'));
  const accessoryCombos = cartesian(footwear, headwear, accessories);
  if (baseItems.length === 0) {
    return accessoryCombos.filter(combo => combo.length > 0);
  }
  baseItems.forEach(base => {
    accessoryCombos.forEach(combo => {
      outfits.push([...base, ...combo]);
    });
  });
  return outfits;
};

const App: React.FC = () => {
  const [mode, setMode] = useState<CreativeMode>('try-on');
  const [selectedImage, setSelectedImage] = useState<UploadedImage | null>(null);
  const [workspaceItems, setWorkspaceItems] = useState<UploadedImage[]>([]);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<'camera' | 'upload'>('camera');
  const [elapsedTime, setElapsedTime] = useState<number | null>(null);
  const [gender, setGender] = useState<'female' | 'male'>('female');
  const [classifyingItems, setClassifyingItems] = useState<ClassifyingItem[]>([]);
  const [isApiKeySelected, setIsApiKeySelected] = useState(false);

  // Mode-specific state
  const [editPrompt, setEditPrompt] = useState<string>('Make this photo look like a vintage film still.');
  const [videoPrompt, setVideoPrompt] = useState<string>('A stunning, confident fashion model walking gracefully on a modern runway. The model walks with elegance, poise, and attitude — like in a high-end Paris Fashion Week show. The background features soft spotlights, glossy reflective floors, and a stylish atmosphere. The camera follows the model in slow motion, capturing the walk from multiple angles — full-body shots, close-ups, and side views. Lighting is cinematic, with a slight bokeh effect, and the overall tone feels luxurious, vibrant, and professional. The model maintains natural movements and stylish expressions while walking toward the camera. 4K ultra-realistic video, 60 fps, fashion show style.');
  const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16'>('9:16');

  const [femaleCatalogue, setFemaleCatalogue] = useState<CatalogueData>(() => loadCatalogueFromStorage('female') || FEMALE_CATALOGUE_DATA);
  const [maleCatalogue, setMaleCatalogue] = useState<CatalogueData>(() => loadCatalogueFromStorage('male') || MALE_CATALOGUE_DATA);

  useEffect(() => { saveCatalogueToStorage('female', femaleCatalogue); }, [femaleCatalogue]);
  useEffect(() => { saveCatalogueToStorage('male', maleCatalogue); }, [maleCatalogue]);

  // Check for Veo API key on mount and when mode changes to video
  useEffect(() => {
    if (mode === 'video') {
      const checkKey = async () => {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setIsApiKeySelected(hasKey);
      };
      checkKey();
    }
  }, [mode]);

  const initialSelected: SelectedItems = { outfits: [], tops: [], bottoms: [], footwear: [], headwear: [], accessories: [] };
  const [selectedItems, setSelectedItems] = useState<SelectedItems>(initialSelected);

  const handleItemAdd = useCallback((item: FilterItem, category: string) => {
    const setCatalogue = gender === 'female' ? setFemaleCatalogue : setMaleCatalogue;
    setCatalogue(prevCatalogue => ({
      ...prevCatalogue,
      [category]: [...(prevCatalogue[category] || []), item],
    }));
  }, [gender]);

  const handleStyleUpload = useCallback(async (files: File[]) => {
    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
    for (const file of files) {
      const tempId = `${Date.now()}-${file.name}`;
      const fileUrl = URL.createObjectURL(file);
      setClassifyingItems(prev => [...prev, { id: tempId, name: file.name, url: fileUrl, error: null }]);
      try {
        const base64String = await readFileAsBase64(file);
        const category = await classifyClothingItem(base64String, file.type);
        const uploadedImage: UploadedImage = { base64: base64String, mimeType: file.type, url: fileUrl, name: file.name };
        const newItem: FilterItem = { id: tempId, name: file.name.split('.').slice(0, -1).join('.') || 'Style Item', image: uploadedImage };
        handleItemAdd(newItem, category);
        setClassifyingItems(prev => prev.filter(item => item.id !== tempId));
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Classification failed.";
        console.error(`Error processing file ${file.name}:`, err);
        setClassifyingItems(prev => prev.map(item => item.id === tempId ? { ...item, error: errorMessage } : item));
      }
      await delay(4500);
    }
  }, [handleItemAdd]);

  const handleImageAdd = (image: UploadedImage) => {
    setWorkspaceItems(prev => [image, ...prev]);
    setSelectedImage(image);
    setGeneratedImages([]);
    setGeneratedVideoUrl(null);
    setError(null);
  };

  const handleSelectImage = (image: UploadedImage) => {
    setSelectedImage(image);
  };

  const handleClearWorkspace = () => {
      if (window.confirm("Are you sure you want to clear the workspace? This will remove all captured and generated images.")) {
          workspaceItems.forEach(img => { if (img.url.startsWith('blob:')) URL.revokeObjectURL(img.url); });
          setWorkspaceItems([]);
          setSelectedImage(null);
      }
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset the session? This will remove all workspace photos and clear your uploaded styles from browser storage.")) {
      workspaceItems.forEach(img => { if (img.url.startsWith('blob:')) URL.revokeObjectURL(img.url); });
      setWorkspaceItems([]);
      setSelectedImage(null);
      setGeneratedImages([]);
      setGeneratedVideoUrl(null);
      setError(null);
      setElapsedTime(null);
      setClassifyingItems([]);
      setSelectedItems(initialSelected);
      clearAllCataloguesFromStorage();
      setFemaleCatalogue(FEMALE_CATALOGUE_DATA);
      setMaleCatalogue(MALE_CATALOGUE_DATA);
    }
  };

  const handleGenderChange = (newGender: 'female' | 'male') => {
    if (gender !== newGender) {
      setGender(newGender);
      setSelectedItems(initialSelected);
      setError(null);
    }
  };

  const handleModeChange = (newMode: CreativeMode) => {
    if (mode !== newMode) {
      setMode(newMode);
      setGeneratedImages([]);
      setGeneratedVideoUrl(null);
      setError(null);
      setElapsedTime(null);
    }
  };

  const handleGenerate = async () => {
    if (!selectedImage) {
      setError("Please select a photo from the workspace first.");
      return;
    }

    setIsLoading(true);
    setGeneratedImages([]);
    setGeneratedVideoUrl(null);
    setError(null);
    setElapsedTime(null);
    const startTime = performance.now();

    try {
      if (mode === 'try-on') {
        const outfitsToTry = generateOutfitCombinations(selectedItems);
        if (outfitsToTry.length === 0) throw new Error("Please select at least one clothing item.");
        if (outfitsToTry.flat().some(item => !item.image.base64)) throw new Error("A selected style is a placeholder. Please upload real clothing items.");
        
        const results: string[] = [];
        for (const outfit of outfitsToTry) {
          const result = await virtualTryOn(selectedImage.base64, selectedImage.mimeType, outfit, gender);
          if (result) {
            results.push(result);
            setGeneratedImages([...results]);
          }
        }

        if (results.length > 0) {
            const newItems: UploadedImage[] = [];
            for (const [index, result] of results.entries()) {
                const blob = base64ToBlob(result, 'image/png');
                const url = URL.createObjectURL(blob);
                const newItem: UploadedImage = {
                    base64: result,
                    mimeType: 'image/png',
                    url: url,
                    name: `try-on-${index + 1}-${selectedImage.name}`,
                };
                newItems.push(newItem);
            }
            setWorkspaceItems(prev => [...newItems.reverse(), ...prev]);
            if (newItems.length > 0) {
                setSelectedImage(newItems[0]);
            }
        }

      } else if (mode === 'edit') {
        if (!editPrompt.trim()) throw new Error("Please enter an edit description.");
        const result = await editImage(selectedImage.base64, selectedImage.mimeType, editPrompt);
        if (result) {
          setGeneratedImages([result]);
          
          const blob = base64ToBlob(result, 'image/png');
          const url = URL.createObjectURL(blob);
          const newItem: UploadedImage = {
              base64: result,
              mimeType: 'image/png',
              url: url,
              name: `edit-${selectedImage.name.substring(0, 20)}`,
          };
          setWorkspaceItems(prev => [newItem, ...prev]);
          setSelectedImage(newItem);
        }

      } else if (mode === 'video') {
        if (!videoPrompt.trim()) throw new Error("Please enter a video description.");
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
            await window.aistudio.openSelectKey();
            // Assume user selected a key. We'll verify by the API call succeeding or failing.
            setIsApiKeySelected(true); // Optimistically set to true
            throw new Error("API Key selected. Please click 'Generate Video' again to proceed.");
        }
        try {
            const videoUrl = await generateVideo(selectedImage.base64, selectedImage.mimeType, videoPrompt, videoAspectRatio, '720p');
            setGeneratedVideoUrl(videoUrl);
        } catch(videoError) {
            if (videoError instanceof Error && videoError.message.includes("API Key not found")) {
                setIsApiKeySelected(false);
            }
            throw videoError;
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
      const endTime = performance.now();
      setElapsedTime((endTime - startTime) / 1000);
    }
  };

  const currentCatalogue = gender === 'female' ? femaleCatalogue : maleCatalogue;
  const itemsToTryOn = Object.values(selectedItems).flat();
  const isGenerateDisabled = isLoading || !selectedImage || (mode === 'try-on' && itemsToTryOn.length === 0);

  const getButtonContent = () => {
    if (isLoading) {
      const message = mode === 'video' ? 'Generating Video...' : mode === 'edit' ? 'Applying Edit...' : 'Styling Your Look...';
      return <><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>{message}</>;
    }
    if (mode === 'video') return <><VideoIcon className="w-7 h-7 mr-3" />Generate Video</>;
    if (mode === 'edit') return <><EditIcon className="w-7 h-7 mr-3" />Apply Edit</>;
    return <><TryOnIcon className="w-7 h-7 mr-3" />Try It On</>;
  };

  return (
    <div className="bg-stone-50 min-h-screen text-stone-800">
      <header className="bg-white shadow-sm p-4 flex items-center justify-center">
        <HeaderIcon />
        <h1 className="text-3xl font-bold text-stone-800 ml-3">Creative Studio</h1>
      </header>
      <main className="p-4 md:p-8 max-w-screen-2xl mx-auto">
        <div className="mb-8 bg-white p-2 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-stone-700 text-center mb-2">Creative Mode</h2>
            <div className="flex justify-center bg-gray-100 rounded-lg p-1">
                <button onClick={() => handleModeChange('try-on')} className={`w-1/3 py-2 px-4 rounded-md text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${mode === 'try-on' ? 'bg-pink-600 text-white shadow' : 'text-gray-600'}`}><TryOnIcon/> Virtual Try-On</button>
                <button onClick={() => handleModeChange('edit')} className={`w-1/3 py-2 px-4 rounded-md text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${mode === 'edit' ? 'bg-pink-600 text-white shadow' : 'text-gray-600'}`}><EditIcon/> Image Editor</button>
                <button onClick={() => handleModeChange('video')} className={`w-1/3 py-2 px-4 rounded-md text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${mode === 'video' ? 'bg-pink-600 text-white shadow' : 'text-gray-600'}`}><VideoIcon/> Video Generator</button>
            </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md h-full">
              <h2 className="text-2xl font-bold text-stone-700 mb-4">
                {mode === 'try-on' && '2. Choose Your Style'}
                {mode === 'edit' && '2. Describe Your Edit'}
                {mode === 'video' && '2. Configure Your Video'}
              </h2>
              {mode === 'try-on' && (
                <>
                  <div className="flex justify-center mb-4 bg-gray-100 rounded-lg p-1">
                    <button onClick={() => handleGenderChange('female')} className={`w-1/2 py-2 px-4 rounded-md text-sm font-semibold transition-colors ${gender === 'female' ? 'bg-pink-600 text-white shadow' : 'text-gray-600'}`}>Female Styles</button>
                    <button onClick={() => handleGenderChange('male')} className={`w-1/2 py-2 px-4 rounded-md text-sm font-semibold transition-colors ${gender === 'male' ? 'bg-pink-600 text-white shadow' : 'text-gray-600'}`}>Male Styles</button>
                  </div>
                  {itemsToTryOn.length > 0 && (
                    <div className="bg-pink-50 border-l-4 border-pink-400 p-4 rounded-md mb-4 shadow-sm animate-fade-in">
                      <h3 className="text-lg font-bold text-stone-700 mb-3">Your Selections</h3>
                      <div className="flex items-center gap-3 flex-wrap">
                        {itemsToTryOn.map((item: FilterItem) => (
                          <div key={item.id} className="relative w-16 h-20 rounded-md overflow-hidden border-2 border-pink-300 bg-white">
                            <img src={item.image.url} alt={item.name} className="w-full h-full object-cover" />
                            <div className="absolute bottom-0 left-0 right-0 p-0.5 bg-black bg-opacity-50"><p className="text-white text-[10px] text-center truncate">{item.name}</p></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <Catalogue catalogue={currentCatalogue} selectedItems={selectedItems} onSelectedItemsChange={setSelectedItems} onStyleUpload={handleStyleUpload} classifyingItems={classifyingItems} />
                </>
              )}
              {mode === 'edit' && (
                <div className="space-y-4 animate-fade-in">
                    <label htmlFor="edit-prompt" className="block text-sm font-medium text-gray-700">Describe the changes you want to make to the image.</label>
                    <textarea id="edit-prompt" value={editPrompt} onChange={(e) => setEditPrompt(e.target.value)} rows={6} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500" placeholder="e.g., Add a retro filter, remove the person in the background..."></textarea>
                </div>
              )}
              {mode === 'video' && (
                <div className="space-y-4 animate-fade-in">
                   {!isApiKeySelected && (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
                        <h3 className="text-sm font-bold text-yellow-800">API Key Required</h3>
                        <p className="text-sm text-yellow-700 mt-1">Video generation requires a user-provided API key. Please select one to proceed. For more info, see the <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline font-semibold">billing documentation</a>.</p>
                    </div>
                   )}
                   <label htmlFor="video-prompt" className="block text-sm font-medium text-gray-700">Describe the video you want to create from the image.</label>
                    <textarea id="video-prompt" value={videoPrompt} onChange={(e) => setVideoPrompt(e.target.value)} rows={10} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500"></textarea>
                    <div>
                        <label htmlFor="aspect-ratio" className="block text-sm font-medium text-gray-700">Aspect Ratio</label>
                        <select id="aspect-ratio" value={videoAspectRatio} onChange={(e) => setVideoAspectRatio(e.target.value as '16:9' | '9:16')} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm rounded-md">
                            <option value="9:16">9:16 (Portrait)</option>
                            <option value="16:9">16:9 (Landscape)</option>
                        </select>
                    </div>
                </div>
              )}
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-bold text-stone-700 mb-4">1. Take or Upload Photo</h2>
              <div className="flex justify-center mb-4 bg-gray-100 rounded-lg p-1">
                <button onClick={() => setInputMode('camera')} className={`w-1/2 py-2 px-4 rounded-md text-sm font-semibold transition-colors ${inputMode === 'camera' ? 'bg-pink-600 text-white shadow' : 'text-gray-600'}`}><CameraIcon className="inline-block w-5 h-5 mr-2" />Live Camera</button>
                <button onClick={() => setInputMode('upload')} className={`w-1/2 py-2 px-4 rounded-md text-sm font-semibold transition-colors ${inputMode === 'upload' ? 'bg-pink-600 text-white shadow' : 'text-gray-600'}`}><PhotoIcon className="inline-block w-5 h-5 mr-2" />Upload Photo</button>
              </div>
              <div className="h-[75vh] max-h-[800px] bg-stone-100 rounded-lg flex items-center justify-center">
                {inputMode === 'camera' ? (<LiveTryOn onImageAdd={handleImageAdd} />) : (<ImageUploader onImageAdd={handleImageAdd} />)}
              </div>
            </div>
          </div>
          <div className="space-y-6 flex flex-col">
            <div className="bg-white p-6 rounded-lg shadow-md flex-grow">
               <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-stone-700">3. Workspace</h2>
                  {workspaceItems.length > 0 &&
                      <button onClick={handleClearWorkspace} className="text-sm text-red-600 hover:text-red-800 font-semibold flex items-center gap-1 transition-colors">
                          <TrashIcon /> Clear Workspace
                      </button>
                  }
              </div>
              {workspaceItems.length === 0 ? (
                <div className="bg-stone-100 rounded-lg p-6 text-center text-stone-500 h-full flex flex-col justify-center">
                  <p>Your captured and generated images will appear here.</p>
                  <p className="text-sm mt-1">Take a picture or upload one to get started.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 max-h-[45vh] overflow-y-auto p-2 bg-stone-100 rounded-lg">
                  {workspaceItems.map((image) => (
                    <div key={image.url} onClick={() => handleSelectImage(image)} className={`relative group aspect-square cursor-pointer rounded-md overflow-hidden border-4 transition-all duration-200 ${selectedImage?.url === image.url ? 'border-pink-500 scale-105 shadow-lg' : 'border-transparent hover:border-pink-300'}`} role="button" aria-pressed={selectedImage?.url === image.url} aria-label={`Select image ${image.name}`}>
                      <img src={image.url} alt={image.name} className="w-full h-full object-cover" />
                      {selectedImage?.url === image.url && (<div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center"><CheckCircleIcon className="w-8 h-8 text-white opacity-90" /></div>)}
                       <a
                          href={image.url}
                          download={image.name}
                          onClick={(e) => e.stopPropagation()}
                          className="absolute top-1 right-1 p-1.5 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-75 transition-colors opacity-0 group-hover:opacity-100"
                          aria-label={`Download image ${image.name}`}
                        >
                          <DownloadIcon className="w-4 h-4" />
                        </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button onClick={handleGenerate} disabled={isGenerateDisabled} className="w-full flex items-center justify-center py-4 px-6 bg-pink-600 text-white font-bold text-xl rounded-lg shadow-md hover:bg-pink-700 transition-all duration-300 transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:scale-100">
                {getButtonContent()}
            </button>
            <button onClick={handleReset} className="w-full flex items-center justify-center py-2 px-4 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">
              <TrashIcon /><span className="ml-2">Reset Session & Styles</span>
            </button>
          </div>
        </div>
        <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-stone-700 mb-4">4. See Your Creation</h2>
          <ResultDisplay isLoading={isLoading} error={error} generatedImages={generatedImages} generatedVideoUrl={generatedVideoUrl} elapsedTime={elapsedTime} mode={mode} />
        </div>
      </main>
    </div>
  );
};

export default App;