
import React from 'react';

interface DeliveryAddressInputProps {
  value: string;
  onChange: (value: string) => void;
}

const DeliveryAddressInput: React.FC<DeliveryAddressInputProps> = ({
  value,
  onChange
}) => {
  return (
    <div className="mt-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Delivery Address
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        rows={2}
        placeholder="Enter your full delivery address"
      />
    </div>
  );
};

export default DeliveryAddressInput;
