import { FilterItem } from './types';

// This file simulates a database of clothing items.
// In a real-world application, this data would be fetched from a backend service like Firestore.

type CatalogueData = Record<string, FilterItem[]>;

// Using a placeholder service for images. Replace with actual image URLs in a production environment.
const placeholder = (width: number, height: number, text: string) => `https://placehold.co/${width}x${height}/F8F8F8/4a4a4a/${text.replace(/\s/g, '+')}`;

export const FEMALE_CATALOGUE_DATA: CatalogueData = {
  outfits: [
    // FIX: Added 'name' property to image object to conform to UploadedImage type.
    { id: 'f_outfit_1', name: 'Summer Dress', image: { name: 'Summer Dress', url: placeholder(300, 400, 'Summer Dress'), base64: '', mimeType: 'image/png' } },
    // FIX: Added 'name' property to image object to conform to UploadedImage type.
    { id: 'f_outfit_2', name: 'Evening Gown', image: { name: 'Evening Gown', url: placeholder(300, 400, 'Evening Gown'), base64: '', mimeType: 'image/png' } },
  ],
  tops: [
    // FIX: Added 'name' property to image object to conform to UploadedImage type.
    { id: 'f_top_1', name: 'Silk Blouse', image: { name: 'Silk Blouse', url: placeholder(300, 400, 'Silk Blouse'), base64: '', mimeType: 'image/png' } },
    // FIX: Added 'name' property to image object to conform to UploadedImage type.
    { id: 'f_top_2', name: 'Casual Tee', image: { name: 'Casual Tee', url: placeholder(300, 400, 'Casual Tee'), base64: '', mimeType: 'image/png' } },
    // FIX: Added 'name' property to image object to conform to UploadedImage type.
    { id: 'f_top_3', name: 'Crop Top', image: { name: 'Crop Top', url: placeholder(300, 400, 'Crop Top'), base64: '', mimeType: 'image/png' } },
  ],
  bottoms: [
    // FIX: Added 'name' property to image object to conform to UploadedImage type.
    { id: 'f_bottom_1', name: 'Denim Jeans', image: { name: 'Denim Jeans', url: placeholder(300, 400, 'Denim Jeans'), base64: '', mimeType: 'image/png' } },
    // FIX: Added 'name' property to image object to conform to UploadedImage type.
    { id: 'f_bottom_2', name: 'A-line Skirt', image: { name: 'A-line Skirt', url: placeholder(300, 400, 'A-line Skirt'), base64: '', mimeType: 'image/png' } },
  ],
  footwear: [
    // FIX: Added 'name' property to image object to conform to UploadedImage type.
    { id: 'f_footwear_1', name: 'High Heels', image: { name: 'High Heels', url: placeholder(300, 400, 'High Heels'), base64: '', mimeType: 'image/png' } },
  ],
  headwear: [],
  accessories: [
    // FIX: Added 'name' property to image object to conform to UploadedImage type.
    { id: 'f_acc_1', name: 'Gold Necklace', image: { name: 'Gold Necklace', url: placeholder(300, 400, 'Gold Necklace'), base64: '', mimeType: 'image/png' } },
  ],
};

export const MALE_CATALOGUE_DATA: CatalogueData = {
  outfits: [
    // FIX: Added 'name' property to image object to conform to UploadedImage type.
    { id: 'm_outfit_1', name: 'Business Suit', image: { name: 'Business Suit', url: placeholder(300, 400, 'Business Suit'), base64: '', mimeType: 'image/png' } },
  ],
  tops: [
    // FIX: Added 'name' property to image object to conform to UploadedImage type.
    { id: 'm_top_1', name: 'Oxford Shirt', image: { name: 'Oxford Shirt', url: placeholder(300, 400, 'Oxford Shirt'), base64: '', mimeType: 'image/png' } },
    // FIX: Added 'name' property to image object to conform to UploadedImage type.
    { id: 'm_top_2', name: 'Polo Shirt', image: { name: 'Polo Shirt', url: placeholder(300, 400, 'Polo Shirt'), base64: '', mimeType: 'image/png' } },
    // FIX: Added 'name' property to image object to conform to UploadedImage type.
    { id: 'm_top_3', name: 'Graphic Tee', image: { name: 'Graphic Tee', url: placeholder(300, 400, 'Graphic Tee'), base64: '', mimeType: 'image/png' } },
  ],
  bottoms: [
    // FIX: Added 'name' property to image object to conform to UploadedImage type.
    { id: 'm_bottom_1', name: 'Chinos', image: { name: 'Chinos', url: placeholder(300, 400, 'Chinos'), base64: '', mimeType: 'image/png' } },
    // FIX: Added 'name' property to image object to conform to UploadedImage type.
    { id: 'm_bottom_2', name: 'Cargo Shorts', image: { name: 'Cargo Shorts', url: placeholder(300, 400, 'Cargo Shorts'), base64: '', mimeType: 'image/png' } },
  ],
  footwear: [
    // FIX: Added 'name' property to image object to conform to UploadedImage type.
    { id: 'm_footwear_1', name: 'Leather Boots', image: { name: 'Leather Boots', url: placeholder(300, 400, 'Leather Boots'), base64: '', mimeType: 'image/png' } },
    // FIX: Added 'name' property to image object to conform to UploadedImage type.
    { id: 'm_footwear_2', name: 'Sneakers', image: { name: 'Sneakers', url: placeholder(300, 400, 'Sneakers'), base64: '', mimeType: 'image/png' } },
  ],
  headwear: [
      // FIX: Added 'name' property to image object to conform to UploadedImage type.
      { id: 'm_headwear_1', name: 'Baseball Cap', image: { name: 'Baseball Cap', url: placeholder(300, 400, 'Baseball Cap'), base64: '', mimeType: 'image/png' } },
  ],
  accessories: [
      // FIX: Added 'name' property to image object to conform to UploadedImage type.
      { id: 'm_acc_1', name: 'Chronograph Watch', image: { name: 'Chronograph Watch', url: placeholder(300, 400, 'Chronograph Watch'), base64: '', mimeType: 'image/png' } },
  ],
};