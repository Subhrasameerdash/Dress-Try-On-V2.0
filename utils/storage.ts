import { FilterItem } from '../types';

type CatalogueData = Record<string, FilterItem[]>;

const FEMALE_CATALOGUE_KEY = 'style_studio_female_catalogue';
const MALE_CATALOGUE_KEY = 'style_studio_male_catalogue';

/**
 * Saves the clothing catalogue to local storage.
 * @param gender The gender for which to save the catalogue.
 * @param catalogue The catalogue data to save.
 */
export const saveCatalogueToStorage = (
  gender: 'female' | 'male',
  catalogue: CatalogueData
): void => {
  try {
    const key = gender === 'female' ? FEMALE_CATALOGUE_KEY : MALE_CATALOGUE_KEY;
    const serializedCatalogue = JSON.stringify(catalogue);
    localStorage.setItem(key, serializedCatalogue);
  } catch (error) {
    console.error("Could not save catalogue to local storage:", error);
  }
};

/**
 * Loads the clothing catalogue from local storage.
 * @param gender The gender for which to load the catalogue.
 * @returns The loaded catalogue data, or null if not found or an error occurs.
 */
export const loadCatalogueFromStorage = (
  gender: 'female' | 'male'
): CatalogueData | null => {
  try {
    const key = gender === 'female' ? FEMALE_CATALOGUE_KEY : MALE_CATALOGUE_KEY;
    const serializedCatalogue = localStorage.getItem(key);
    if (serializedCatalogue === null) {
      return null;
    }
    return JSON.parse(serializedCatalogue);
  } catch (error) {
    console.error("Could not load catalogue from local storage:", error);
    return null;
  }
};

/**
 * Clears all catalogue data from local storage.
 */
export const clearAllCataloguesFromStorage = (): void => {
    try {
        localStorage.removeItem(FEMALE_CATALOGUE_KEY);
        localStorage.removeItem(MALE_CATALOGUE_KEY);
    } catch (error) {
        console.error("Could not clear catalogues from local storage:", error);
    }
};
