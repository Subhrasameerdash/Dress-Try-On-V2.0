
export interface UploadedImage {
  base64: string;
  mimeType: string;
  url: string; // Object URL for preview
  name: string;
}

export interface FilterItem {
  id: string; // A unique identifier, e.g., timestamp + filename
  name: string;
  image: UploadedImage;
}

export interface TryOnItem extends FilterItem {
  category: string;
}

// Represents an item during the AI classification process
export interface ClassifyingItem {
  id: string;
  name: string;
  url: string; // Object URL for preview
  error: string | null;
}
