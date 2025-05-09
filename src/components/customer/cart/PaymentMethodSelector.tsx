
import React from 'react';
import { CreditCard, Wallet, DollarSign, Apple, BarChart3 } from 'lucide-react';

interface PaymentMethod {
  id: string;
  name: string;
  type?: 'cash' | 'digital';
  icon?: string;
}

interface PaymentMethodSelectorProps {
  paymentMethods: PaymentMethod[];
  selectedMethod: string;
  onChange: (method: string) => void;
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  paymentMethods,
  selectedMethod,
  onChange
}) => {
  const getIcon = (methodId: string) => {
    switch (methodId) {
      case 'credit_card':
        return <CreditCard className="mr-2 h-4 w-4" />;
      case 'paypal':
        return <BarChart3 className="mr-2 h-4 w-4" />;
      case 'apple_pay':
        return <Apple className="mr-2 h-4 w-4" />;
      case 'google_pay':
        return <Wallet className="mr-2 h-4 w-4" />;
      case 'cash':
      default:
        return <DollarSign className="mr-2 h-4 w-4" />;
    }
  };

  return (
    <div className="mt-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Payment Method
      </label>
      <div className="space-y-2">
        {paymentMethods.map(method => (
          <div 
            key={method.id} 
            className={`flex items-center p-3 rounded-md cursor-pointer transition-colors ${
              selectedMethod === method.id 
                ? 'bg-blue-50 border border-blue-200' 
                : 'bg-white border border-gray-200 hover:bg-gray-50'
            }`}
            onClick={() => onChange(method.id)}
          >
            <input
              type="radio"
              id={method.id}
              name="paymentMethod"
              value={method.id}
              checked={selectedMethod === method.id}
              onChange={(e) => onChange(e.target.value)}
              className="mr-2"
            />
            <div className="flex items-center">
              {getIcon(method.id)}
              <label htmlFor={method.id} className="text-sm cursor-pointer">
                {method.name}
              </label>
            </div>
            {method.type === 'digital' && (
              <span className="ml-auto bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Digital</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PaymentMethodSelector;
