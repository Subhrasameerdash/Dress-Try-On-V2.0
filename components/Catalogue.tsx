import React, { useState } from 'react';
import { FilterItem, ClassifyingItem } from '../types';
import ItemGrid from './SareeSelector'; // Renamed internally, but file path is the same
import StyleUploader from './SareeUploader'; // Renamed internally, but file path is the same

type CatalogueData = Record<string, FilterItem[]>;
type SelectedItems = Record<string, FilterItem[]>;

interface CatalogueProps {
  catalogue: CatalogueData;
  selectedItems: SelectedItems;
  onSelectedItemsChange: React.Dispatch<React.SetStateAction<SelectedItems>>;
  onStyleUpload: (files: File[]) => void;
  classifyingItems: ClassifyingItem[];
}

const CATEGORIES = [
  { id: 'outfits', name: 'Outfits' },
  { id: 'tops', name: 'Tops' },
  { id: 'bottoms', name: 'Bottoms' },
  { id: 'footwear', name: 'Footwear' },
  { id: 'headwear', name: 'Headwear' },
  { id: 'accessories', name: 'Accessories' },
];

const Catalogue: React.FC<CatalogueProps> = ({ catalogue, selectedItems, onSelectedItemsChange, onStyleUpload, classifyingItems }) => {
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].id);

  const handleSelectItem = (item: FilterItem, category: string) => {
    onSelectedItemsChange(prev => {
        const newSelected = { ...prev };
        Object.keys(newSelected).forEach(key => {
            newSelected[key] = [...(newSelected[key] || [])];
        });

        const categoryItems = newSelected[category];
        const isSelected = categoryItems.some(i => i.id === item.id);

        if (isSelected) {
            newSelected[category] = categoryItems.filter(i => i.id !== item.id);
        } else {
            newSelected[category].push(item);
            // If selecting an 'outfit', deselect all tops and bottoms.
            if (category === 'outfits') {
                newSelected.tops = [];
                newSelected.bottoms = [];
            } 
            // If selecting a top or bottom, deselect all 'outfits'.
            else if (category === 'tops' || category === 'bottoms') {
                newSelected.outfits = [];
            }
        }
        
        return newSelected;
    });
  };

  return (
    <div className="w-full">
      {/* Centralized uploader with AI classification */}
      <StyleUploader onStyleUpload={onStyleUpload} classifyingItems={classifyingItems} />
      
      <div className="border-b border-gray-200 mb-4">
        <nav className="-mb-px flex space-x-4 overflow-x-auto" aria-label="Tabs">
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
                activeCategory === category.id
                  ? 'border-pink-500 text-pink-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              aria-current={activeCategory === category.id ? 'page' : undefined}
            >
              {category.name} ({catalogue[category.id]?.length || 0})
            </button>
          ))}
        </nav>
      </div>

      <div>
        {(catalogue[activeCategory] || []).length > 0 ? (
           <ItemGrid
            filterItems={catalogue[activeCategory] || []}
            selectedFilterItems={selectedItems[activeCategory] || []}
            onSelectFilterItem={(item) => handleSelectItem(item, activeCategory)}
          />
        ) : (
          <div className="text-center py-10 px-4 bg-stone-100 rounded-lg">
            <p className="text-stone-600">No items in this category yet.</p>
            <p className="text-sm text-stone-500 mt-1">Upload new styles to see them here!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Catalogue;
