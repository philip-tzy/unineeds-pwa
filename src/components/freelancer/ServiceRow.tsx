import React from 'react';
import { Service } from '@/types/service';
import { Button } from '@/components/ui/button';
import { Edit3, Trash2, ExternalLink, Download } from 'lucide-react';

interface ServiceRowProps {
  service: Service;
  onEdit: (service: Service) => void;
  onDelete: (serviceId: string, serviceTitle: string, portfolioUrl?: string | null) => void;
}

const ServiceRow: React.FC<ServiceRowProps> = ({ service, onEdit, onDelete }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-lg text-gray-800">{service.title}</h3>
          <p className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full inline-block my-1">
            Category: {service.category}
          </p>
        </div>
        <div className="flex space-x-2 flex-shrink-0 ml-2">
          <Button variant="outline" size="icon" onClick={() => onEdit(service)} className="text-blue-600 border-blue-600 hover:bg-blue-50">
            <Edit3 size={18} />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => onDelete(service.id, service.title, service.portfolio_url)} 
            className="text-red-600 border-red-600 hover:bg-red-50"
          >
            <Trash2 size={18} />
          </Button>
        </div>
      </div>
      
      <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{service.description}</p>
      
      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <p><strong className="font-medium text-gray-700">Price:</strong> {formatPrice(service.price)}</p>
        <p><strong className="font-medium text-gray-700">Delivery:</strong> {service.delivery_time}</p>
        {service.location && <p><strong className="font-medium text-gray-700">Location:</strong> {service.location}</p>}
        <p><strong className="font-medium text-gray-700">Contact:</strong> {service.whatsapp}</p>
      </div>

      {service.portfolio_url && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <a 
            href={service.portfolio_url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center text-sm"
          >
            View Portfolio <ExternalLink size={14} className="ml-1" />
          </a>
        </div>
      )}
    </div>
  );
};

export default ServiceRow; 