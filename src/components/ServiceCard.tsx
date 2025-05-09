
import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface ServiceCardProps {
  title: string;
  icon: React.ReactNode;
  to: string;
  className?: string;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ title, icon, to, className }) => {
  return (
    <Link 
      to={to}
      className={cn(
        "service-card w-full animate-scale-in group",
        className
      )}
    >
      <div className="mb-2 text-uniblue-dark group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <span className="text-sm font-medium text-gray-800">{title}</span>
    </Link>
  );
};

export default ServiceCard;
