
import React from 'react';

export interface Promo {
  id: number;
  title: string;
  description: string;
  color: string;
}

interface PromoSectionProps {
  promos: Promo[];
}

const PromoSection: React.FC<PromoSectionProps> = ({ promos }) => {
  return (
    <div className="px-4 mt-2 overflow-x-auto">
      <div className="flex gap-3 py-2">
        {promos.map(promo => (
          <div 
            key={promo.id} 
            className={`${promo.color} text-white p-3 rounded-lg min-w-[160px] flex-shrink-0`}
          >
            <h3 className="font-bold text-lg">{promo.title}</h3>
            <p className="text-sm">{promo.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PromoSection;
