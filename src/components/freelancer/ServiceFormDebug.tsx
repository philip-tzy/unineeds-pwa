import React from 'react';

interface ServiceFormDebugProps {
  formValues: any;
  errors: any;
}

/**
 * Debug component to visualize form state during development
 * Remove this component in production
 */
const ServiceFormDebug: React.FC<ServiceFormDebugProps> = ({ formValues, errors }) => {
  return (
    <div className="mt-8 p-4 border border-yellow-300 bg-yellow-50 rounded-md">
      <h3 className="text-sm font-bold mb-2">Form Debug</h3>
      
      <div className="mb-4">
        <h4 className="text-xs font-semibold">Form Values:</h4>
        <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-40">
          {JSON.stringify(formValues, null, 2)}
        </pre>
      </div>
      
      {Object.keys(errors).length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-red-500">Form Errors:</h4>
          <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-40">
            {JSON.stringify(errors, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ServiceFormDebug; 