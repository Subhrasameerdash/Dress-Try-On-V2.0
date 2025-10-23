import { FilterItem } from './types';

// This file simulates a database of clothing items.
// In a real-world application, this data would be fetched from a backend service like Firestore.

type CatalogueData = Record<string, FilterItem[]>;

export const FEMALE_CATALOGUE_DATA: CatalogueData = {
  outfits: [],
  tops: [],
  bottoms: [],
  footwear: [],
  headwear: [],
  accessories: [],
};

export const MALE_CATALOGUE_DATA: CatalogueData = {
  outfits: [],
  tops: [],
  bottoms: [],
  footwear: [],
  headwear: [],
  accessories: [],
};
