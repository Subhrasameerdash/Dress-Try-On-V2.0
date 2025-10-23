import React from 'react';
import { FilterItem } from '../types';
import { CheckCircleIcon } from './icons';

interface ItemGridProps {
  filterItems: FilterItem[];
  selectedFilterItems: FilterItem[];
  onSelectFilterItem: (item: FilterItem) => void;
}

// This component is now a simple grid for displaying and selecting items.
const ItemGrid: React.FC<ItemGridProps> = ({ filterItems, selectedFilterItems, onSelectFilterItem }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 min-h-[10rem]">
      {filterItems.map((item) => {
        const isSelected = selectedFilterItems.some(selected => selected.id === item.id);
        return (
          <div
            key={item.id}
            onClick={() => onSelectFilterItem(item)}
            onKeyDown={(e) => e.key === 'Enter' && onSelectFilterItem(item)}
            className={`relative group aspect-[3/4] cursor-pointer rounded-lg overflow-hidden border-4 transition-all duration-200 ${
              isSelected ? 'border-pink-500 scale-105 shadow-lg' : 'border-transparent hover:border-pink-300'
            }`}
            role="button"
            tabIndex={0}
            aria-pressed={isSelected}
            aria-label={`Select ${item.name}`}
          >
            <img src={item.image.url} alt={item.name} className="w-full h-full object-cover" />
            {isSelected && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center transition-opacity duration-300">
                  <CheckCircleIcon className="w-10 h-10 text-white opacity-90" />
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 p-1 bg-black bg-opacity-50">
              <p className="text-white text-xs text-center truncate" title={item.name}>{item.name}</p>
            </div>
          </div>
        )
      })}
    </div>
  );
};

export default ItemGrid;
