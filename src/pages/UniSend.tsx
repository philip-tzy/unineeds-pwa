import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Truck, MapPin, Package2, ChevronRight, 
  Check, Clock, User, Calendar, FileText, AlertCircle, Bike, ShoppingBag } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import DriverInfoPanel from '@/components/customer/DriverInfoPanel';
import { supabase } from '@/integrations/supabase/client';

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
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedOption, setSelectedOption] = useState('standard');
  const [selectedPackageSize, setSelectedPackageSize] = useState('small');
  const [step, setStep] = useState(1);
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  const selectedDelivery = deliveryOptions.find(option => option.id === selectedOption);
  const selectedPackage = packageSizes.find(pkg => pkg.id === selectedPackageSize);
  
  const totalPrice = (selectedDelivery?.price || 0) + (selectedPackage?.price || 0);

  // Fetch active orders
  useEffect(() => {
    if (!user?.id) return;

    const fetchActiveOrders = async () => {
      try {
        setLoading(true);
        // Check for active delivery orders
        const { data, error } = await supabase
          .from('orders')
          .select('*, driver:driver_id(*)')
          .eq('customer_id', user.id)
          .eq('service_type', 'unisend')
          .in('status', ['pending', 'accepted', 'in_progress'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setActiveOrder(data);
          // If we have an active order, set the step to 3 (tracking)
          setStep(3);
        }
      } catch (error) {
        console.error('Error fetching active orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveOrders();

    // Subscribe to order changes
    const orderSubscription = supabase
      .channel('orders_for_customer')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'orders',
          filter: `customer_id=eq.${user.id} AND service_type=eq.unisend` 
        },
        (payload) => {
          console.log('Order change detected:', payload);
          if (payload.new) {
            // If status changed to accepted, show notification
            if (payload.old && payload.old.status !== 'accepted' && payload.new.status === 'accepted') {
              toast({
                title: "Driver Accepted",
                description: "A driver has accepted your delivery request!",
              });

              // Fetch the driver details
              fetchDriverDetails(payload.new.id);
            }

            // Update the active order
            setActiveOrder(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      orderSubscription.unsubscribe();
    };
  }, [user?.id, toast]);

  // Fetch driver details when a driver accepts the order
  const fetchDriverDetails = async (orderId: string) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, driver:driver_id(*)')
        .eq('id', orderId)
        .single();

      if (error) throw error;
      if (data) {
        setActiveOrder(data);
      }
    } catch (error) {
      console.error('Error fetching driver details:', error);
    }
  };

  // Create delivery request
  const createDeliveryRequest = async () => {
    if (!user?.id) {
      toast({
        title: "Authentication Required",
        description: "Please log in to request a delivery",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      // Get address values from form inputs or use defaults
      const pickupAddress = document.getElementById('pickup-address') 
        ? (document.getElementById('pickup-address') as HTMLInputElement).value 
        : savedAddresses[0].address;
      
      const deliveryAddress = document.getElementById('delivery-address') 
        ? (document.getElementById('delivery-address') as HTMLInputElement).value 
        : savedAddresses[1].address;
      
      if (!pickupAddress || !deliveryAddress) {
        throw new Error("Pickup and delivery addresses are required");
      }
      
      // Create new delivery order
      const { data, error } = await supabase
        .from('orders')
        .insert({
          customer_id: user.id,
          service_type: 'unisend',
          status: 'pending',
          pickup_address: pickupAddress,
          delivery_address: deliveryAddress,
          total_amount: totalPrice,
          package_size: selectedPackageSize,
          delivery_type: selectedOption
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Delivery Requested",
        description: "Searching for drivers...",
      });

      // Update UI
      setActiveOrder(data);
      setStep(3); // Move to tracking step
    } catch (error) {
      console.error('Error creating delivery request:', error);
      toast({
        title: "Error",
        description: "Failed to request delivery. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle continue button
  const handleContinue = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      createDeliveryRequest();
    }
  };

  // Render the right content based on active order
  const renderContent = () => {
    if (activeOrder) {
      return (
        <div className="p-4">
          {(activeOrder.status === 'accepted' || activeOrder.status === 'in_progress') && activeOrder.driver_id ? (
            <DriverInfoPanel 
              driverId={activeOrder.driver_id}
              orderId={activeOrder.id}
              serviceType="unisend"
              orderStatus={activeOrder.status}
              pickupAddress={activeOrder.pickup_address}
              destinationAddress={activeOrder.delivery_address}
            />
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-4 mb-3 border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-lg">Delivery Request Pending</h3>
                <div className="animate-pulse">
                  <div className="h-2.5 w-10 bg-yellow-300 rounded-full"></div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="mt-1 min-w-[24px]">
                    <div className="w-4 h-4 rounded-full bg-green-100 border-2 border-green-500"></div>
                  </div>
                  <div className="ml-2">
                    <p className="text-xs text-gray-500">PICKUP</p>
                    <p className="text-sm">{activeOrder.pickup_address}</p>
                  </div>
                </div>
                
                <div className="flex items-start pl-3">
                  <div className="h-8 w-0 border-l border-dashed border-gray-300"></div>
                </div>
                
                <div className="flex items-start">
                  <div className="mt-1 min-w-[24px]">
                    <div className="w-4 h-4 rounded-full bg-red-100 border-2 border-red-500"></div>
                  </div>
                  <div className="ml-2">
                    <p className="text-xs text-gray-500">DESTINATION</p>
                    <p className="text-sm">{activeOrder.delivery_address}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                <p className="text-center text-sm text-yellow-800">Searching for nearby drivers...</p>
                <div className="flex justify-center mt-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-600"></div>
                </div>
              </div>
              
              <button 
                className="w-full mt-4 py-2 px-4 border border-red-500 text-red-500 rounded-lg text-sm font-medium"
                onClick={() => {
                  // Cancel order logic
                  console.log('Cancel order');
                }}
              >
                Cancel Request
              </button>
            </div>
          )}
        </div>
      );
    }

    // Original form content
    return (
      <>
        {/* Your existing package details, delivery options, etc. */}
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
      </>
    );
  };
  
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
      
      {/* Only show progress bar if no active order */}
      {!activeOrder && (
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
      )}
      
      {/* Main Content */}
      {renderContent()}
      
      {/* Submit Button */}
      {!activeOrder && (
        <div className="p-4 sticky bottom-0 bg-white shadow-md">
          <button 
            onClick={handleContinue}
            disabled={loading}
            className={`w-full font-bold py-3 px-4 rounded-xl transition-colors duration-200 ${
              loading 
                ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
                : 'bg-[#003160] hover:bg-[#004180] text-white'
            }`}
          >
            {loading ? 'Processing...' : step === 3 ? 'Confirm and Pay' : 'Continue'}
          </button>
        </div>
      )}
    </div>
  );
};

export default UniSend;
