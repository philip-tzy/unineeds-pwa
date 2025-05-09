
import React from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';

interface FoodSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearch: (e: React.FormEvent) => void;
}

const FoodSearchBar: React.FC<FoodSearchBarProps> = ({
  searchQuery,
  onSearchChange,
  onSearch
}) => {
  return (
    <div className="p-4 bg-white shadow-sm sticky top-0 z-30">
      <form onSubmit={onSearch} className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search for food..."
            className="w-full bg-gray-100 border-none rounded-full py-2 px-4 pl-10 outline-none"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
        </div>
        <button className="bg-gray-100 p-2 rounded-full">
          <SlidersHorizontal size={20} className="text-gray-700" />
        </button>
      </form>
    </div>
  );
};

export default FoodSearchBar;
