
import React from 'react';
import { cn } from '@/lib/utils';

interface PromoCardProps {
  title: string;
  badge?: string;
  colorClass?: string;
  description?: string;
  className?: string;
  onClick?: () => void;
}

const PromoCard: React.FC<PromoCardProps> = ({ 
  title,
  badge,
  colorClass = "bg-uniblue",
  description,
  className,
  onClick
}) => {
  return (
    <div 
      className={cn(
        "promo-card relative",
        colorClass,
        className
      )}
      onClick={onClick}
    >
      {badge && (
        <div className="promo-badge animate-pulse-subtle">
          {badge}
        </div>
      )}
      
      <h3 className="text-white font-bold text-lg line-clamp-2">{title}</h3>
      
      {description && (
        <p className="text-white/90 text-sm">{description}</p>
      )}
    </div>
  );
};

export default PromoCard;
