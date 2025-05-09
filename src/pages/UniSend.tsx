
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Truck, MapPin, Package2, ChevronRight, 
  Check, Clock, User, Calendar, FileText, AlertCircle, Bike, ShoppingBag } from 'lucide-react';

const deliveryOptions = [
  {
    id: 'standard',
    name: 'Standard Delivery',
    description: 'Delivery in 3-5 days',
    price: 4.99,
    icon: <Package size={20} />,
    estimatedTime: '3-5 days'
  },
  {
    id: 'express',
    name: 'Express Delivery',
    description: 'Delivery in 1-2 days',
    price: 9.99,
    icon: <Truck size={20} />,
    estimatedTime: '1-2 days'
  },
  {
    id: 'same-day',
    name: 'Same Day Delivery',
    description: 'Delivery today',
    price: 14.99,
    icon: <Bike size={20} />,
    estimatedTime: '2-4 hours'
  }
];

const savedAddresses = [
  { id: 1, name: 'Home', address: '123 Maple Street' },
  { id: 2, name: 'Work', address: '456 Oak Avenue' },
  { id: 3, name: 'Campus', address: 'University Main Building' }
];

const packageSizes = [
  { id: 'small', name: 'Small', description: 'Max 5kg', price: 0 },
  { id: 'medium', name: 'Medium', description: 'Max 10kg', price: 2.99 },
  { id: 'large', name: 'Large', description: 'Max 20kg', price: 5.99 },
];

const UniSend: React.FC = () => {
  const navigate = useNavigate();
  const [selectedOption, setSelectedOption] = useState('standard');
  const [selectedPackageSize, setSelectedPackageSize] = useState('small');
  const [step, setStep] = useState(1);
  
  const selectedDelivery = deliveryOptions.find(option => option.id === selectedOption);
  const selectedPackage = packageSizes.find(pkg => pkg.id === selectedPackageSize);
  
  const totalPrice = (selectedDelivery?.price || 0) + (selectedPackage?.price || 0);
  
  return (
    <div className="min-h-screen bg-gray-100 animate-fade-in">
      {/* App Bar */}
      <div className="bg-[#003160] p-4 flex items-center shadow-sm text-white">
        <button 
          onClick={() => navigate(-1)} 
          className="p-1 rounded-full hover:bg-[#004180] transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="flex-1 text-center text-xl font-bold">
          <span className="text-white">Uni</span>
          <span className="text-gray-300">Send</span>
        </h1>
        <div className="w-8"></div> {/* Spacer for alignment */}
      </div>
      
      {/* Progress Bar */}
      <div className="bg-white px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex flex-col items-center flex-1">
            <div className={`w-8 h-8 rounded-full ${step >= 1 ? 'bg-[#003160]' : 'bg-gray-300'} text-white flex items-center justify-center mb-1`}>
              {step > 1 ? <Check size={16} /> : '1'}
            </div>
            <span className="text-xs text-center">Details</span>
          </div>
          <div className={`h-1 flex-1 ${step >= 2 ? 'bg-[#003160]' : 'bg-gray-300'}`}></div>
          <div className="flex flex-col items-center flex-1">
            <div className={`w-8 h-8 rounded-full ${step >= 2 ? 'bg-[#003160]' : 'bg-gray-300'} text-white flex items-center justify-center mb-1`}>
              {step > 2 ? <Check size={16} /> : '2'}
            </div>
            <span className="text-xs text-center">Confirm</span>
          </div>
          <div className={`h-1 flex-1 ${step >= 3 ? 'bg-[#003160]' : 'bg-gray-300'}`}></div>
          <div className="flex flex-col items-center flex-1">
            <div className={`w-8 h-8 rounded-full ${step >= 3 ? 'bg-[#003160]' : 'bg-gray-300'} text-white flex items-center justify-center mb-1`}>
              {step > 3 ? <Check size={16} /> : '3'}
            </div>
            <span className="text-xs text-center">Payment</span>
          </div>
        </div>
      </div>
      
      {/* Delivery Form */}
      <div className="p-4">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Section Header */}
          <div className="bg-gray-50 p-3 border-b">
            <h3 className="font-semibold text-[#003160]">Delivery Information</h3>
          </div>
          
          <div className="p-4">
            {/* Pickup Location */}
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-2 flex items-center">
                <MapPin size={16} className="mr-1 text-[#003160]" /> Pickup Location
              </label>
              <div className="relative">
                <select className="w-full bg-white border border-gray-200 rounded-lg py-2.5 px-4 appearance-none outline-none text-sm">
                  <option>Select pickup location</option>
                  {savedAddresses.map(address => (
                    <option key={address.id}>{address.name} - {address.address}</option>
                  ))}
                </select>
                <ChevronRight className="absolute right-3 top-1/2 transform -translate-y-1/2 rotate-90 text-gray-400" size={20} />
              </div>
            </div>
            
            {/* Delivery Location */}
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-2 flex items-center">
                <MapPin size={16} className="mr-1 text-[#B10000]" /> Delivery Location
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter delivery address"
                  className="w-full bg-white border border-gray-200 rounded-lg py-2.5 px-4 outline-none text-sm"
                />
                <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              </div>
            </div>
            
            {/* Schedule */}
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-2 flex items-center">
                <Calendar size={16} className="mr-1 text-[#003160]" /> Schedule
              </label>
              <div className="flex gap-2">
                <button className="py-2 px-3 bg-[#003160] text-white rounded-lg text-sm flex-1 flex items-center justify-center">
                  <Clock size={16} className="mr-1" /> 
                  Now
                </button>
                <button className="py-2 px-3 bg-white border border-gray-200 rounded-lg text-sm flex-1 flex items-center justify-center">
                  <Calendar size={16} className="mr-1" /> 
                  Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Package Details */}
      <div className="px-4 pb-4">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-gray-50 p-3 border-b">
            <h3 className="font-semibold text-[#003160]">Package Details</h3>
          </div>
          
          <div className="p-4">
            {/* Package Type */}
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-2 flex items-center">
                <Package2 size={16} className="mr-1 text-[#003160]" /> Package Size
              </label>
              <div className="grid grid-cols-3 gap-2">
                {packageSizes.map(size => (
                  <button 
                    key={size.id}
                    onClick={() => setSelectedPackageSize(size.id)}
                    className={`py-2 px-3 rounded-lg text-sm flex flex-col items-center ${
                      selectedPackageSize === size.id 
                        ? 'bg-[#003160] text-white' 
                        : 'bg-white border border-gray-200 text-gray-700'
                    }`}
                  >
                    <span>{size.name}</span>
                    <span className="text-xs opacity-80">{size.description}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Package Description */}
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-2 flex items-center">
                <FileText size={16} className="mr-1 text-[#003160]" /> Package Description
              </label>
              <textarea 
                placeholder="What are you sending? (optional)" 
                className="w-full bg-white border border-gray-200 rounded-lg py-2.5 px-4 outline-none text-sm h-20 resize-none"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Delivery Options */}
      <div className="px-4 pb-4">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-gray-50 p-3 border-b">
            <h3 className="font-semibold text-[#003160]">Delivery Options</h3>
          </div>
          
          <div className="p-4 space-y-3">
            {deliveryOptions.map((option) => (
              <div 
                key={option.id}
                onClick={() => setSelectedOption(option.id)}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-200 ${
                  selectedOption === option.id 
                    ? 'border-[#003160] bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                    selectedOption === option.id ? 'bg-[#003160] text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {option.icon}
                  </div>
                  <div>
                    <p className="font-medium">{option.name}</p>
                    <div className="flex items-center text-xs">
                      <Clock size={12} className="mr-1 text-gray-500" />
                      <p className="text-gray-500">{option.estimatedTime}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">${option.price.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Price Summary */}
      <div className="px-4 pb-4">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Delivery Fee:</span>
              <span>${selectedDelivery?.price.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Package Fee:</span>
              <span>${selectedPackage?.price.toFixed(2)}</span>
            </div>
            <div className="border-t mt-2 pt-2 flex justify-between items-center font-bold">
              <span>Total:</span>
              <span className="text-[#003160]">${totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Important Notice */}
      <div className="px-4 pb-4">
        <div className="flex items-start bg-yellow-50 p-3 rounded-lg border border-yellow-200">
          <AlertCircle size={20} className="text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-yellow-800">
            Make sure your package is properly sealed and ready for pickup. Fragile items should be clearly marked.
          </p>
        </div>
      </div>
      
      {/* Submit Button */}
      <div className="p-4 sticky bottom-0 bg-white shadow-md">
        <button 
          onClick={() => setStep(Math.min(step + 1, 3))}
          className="w-full bg-[#003160] hover:bg-[#004180] text-white font-bold py-3 px-4 rounded-xl transition-colors duration-200"
        >
          {step === 3 ? 'Confirm and Pay' : 'Continue'}
        </button>
      </div>
    </div>
  );
};

export default UniSend;
