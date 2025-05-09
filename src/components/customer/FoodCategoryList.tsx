
import React from 'react';
import { Coffee, Pizza } from 'lucide-react';

export interface Category {
  id: string;
  name: string;
  icon: React.ReactNode;
}

interface FoodCategoryListProps {
  categories: Category[];
  selectedCategory: string;
  onCategorySelect: (categoryId: string) => void;
}

const FoodCategoryList: React.FC<FoodCategoryListProps> = ({
  categories,
  selectedCategory,
  onCategorySelect
}) => {
  return (
    <div className="px-4 mt-4">
      <div className="flex overflow-x-auto gap-3 pb-2 -mx-1 px-1 no-scrollbar">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategorySelect(category.id)}
            className={`flex items-center space-x-2 py-2 px-4 rounded-full whitespace-nowrap transition-colors ${
              selectedCategory === category.id 
                ? 'bg-uniblue text-white' 
                : 'bg-white text-gray-700 border border-gray-200'
            }`}
          >
            <span>{category.icon}</span>
            <span>{category.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default FoodCategoryList;
