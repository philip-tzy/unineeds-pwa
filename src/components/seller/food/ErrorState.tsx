
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry }) => {
  return (
    <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-start">
      <AlertCircle className="mr-2 flex-shrink-0 mt-0.5" size={18} />
      <div>
        <p className="font-semibold">Error loading menu items</p>
        <p className="text-sm">{error}</p>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-2 text-red-700 border-red-300 hover:bg-red-50"
          onClick={onRetry}
        >
          Try Again
        </Button>
      </div>
    </div>
  );
};

export default ErrorState;
