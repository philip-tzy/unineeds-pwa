
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface FormFooterProps {
  isSubmitting: boolean;
  onCancel: () => void;
  isEditMode: boolean;
  itemType?: string;
}

const FormFooter: React.FC<FormFooterProps> = ({ 
  isSubmitting, 
  onCancel, 
  isEditMode,
  itemType = 'Item'
}) => {
  return (
    <div className="flex justify-end space-x-2 pt-2">
      <Button 
        type="button" 
        variant="outline" 
        onClick={onCancel}
        disabled={isSubmitting}
      >
        Cancel
      </Button>
      <Button 
        type="submit"
        disabled={isSubmitting}
        className="bg-[#003160] hover:bg-[#002040]"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {isEditMode ? 'Updating...' : 'Saving...'}
          </>
        ) : (
          isEditMode ? `Update ${itemType}` : `Add ${itemType}`
        )}
      </Button>
    </div>
  );
};

export default FormFooter;
