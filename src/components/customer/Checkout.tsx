import React, { useState } from 'react';
import { MapPin, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

interface CartItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    seller_id: string;
  };
}

interface CheckoutProps {
  cartItems: CartItem[];
  totalAmount: number;
  deliveryFee: number;
  onCheckoutComplete: () => void;
  onCheckoutCancel: () => void;
}

const Checkout: React.FC<CheckoutProps> = ({
  cartItems,
  totalAmount,
  deliveryFee,
  onCheckoutComplete,
  onCheckoutCancel,
}) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<'address' | 'payment' | 'confirmation'>('address');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  
  // Form states
  const [addressForm, setAddressForm] = useState({
    fullName: user?.displayName || '',
    address: '',
    city: '',
    zipCode: '',
    phoneNumber: '',
  });
  
  const [paymentForm, setPaymentForm] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: '',
  });
  
  const handleAddressFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddressForm(prev => ({ ...prev, [name]: value }));
  };
  
  const handlePaymentFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPaymentForm(prev => ({ ...prev, [name]: value }));
    
    // Clear previous errors when user starts typing
    if (orderError) {
      setOrderError(null);
    }
  };
  
  const validateAddressForm = () => {
    if (!addressForm.fullName) return 'Full name is required';
    if (!addressForm.address) return 'Address is required';
    if (!addressForm.city) return 'City is required';
    if (!addressForm.zipCode) return 'ZIP code is required';
    if (!addressForm.phoneNumber) return 'Phone number is required';
    return null;
  };
  
  const validatePaymentForm = () => {
    if (!paymentForm.cardNumber) return 'Card number is required';
    if (paymentForm.cardNumber.length < 16) return 'Invalid card number';
    if (!paymentForm.cardHolder) return 'Card holder name is required';
    if (!paymentForm.expiryDate) return 'Expiry date is required';
    if (!paymentForm.cvv) return 'CVV is required';
    if (paymentForm.cvv.length < 3) return 'Invalid CVV';
    return null;
  };
  
  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const error = validateAddressForm();
    if (error) {
      toast.error(error);
      return;
    }
    
    setCurrentStep('payment');
  };
  
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const error = validatePaymentForm();
    if (error) {
      toast.error(error);
      return;
    }
    
    // Clear previous errors
    setOrderError(null);
    setIsProcessing(true);
    
    try {
      // Simulate API call for payment processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For demo purposes, we'll simulate a successful payment
      // In a real app, you would call your payment API here
      const response = await processOrder();
      
      if (response.success) {
        setCurrentStep('confirmation');
        toast.success('Order placed successfully!');
      } else {
        throw new Error(response.message || 'Payment failed');
      }
    } catch (error: any) {
      setOrderError(error.message || 'There was a problem placing your order. Please try again.');
      toast.error('Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const processOrder = async () => {
    // This is a mock implementation
    // In a real app, this would connect to your backend API
    
    // For demonstration, we'll simulate a 90% success rate
    const isSuccessful = Math.random() < 0.9;
    
    if (isSuccessful) {
      return {
        success: true,
        orderId: `ORD-${Math.floor(Math.random() * 1000000)}`
      };
    } else {
      // Simulate various possible errors
      const errors = [
        'Payment was declined by your bank',
        'Network error occurred during payment processing',
        'Your card has insufficient funds',
        'Payment verification failed'
      ];
      return {
        success: false,
        message: errors[Math.floor(Math.random() * errors.length)]
      };
    }
  };
  
  const handleTryAgain = () => {
    setOrderError(null);
  };
  
  const renderAddressForm = () => (
    <form onSubmit={handleAddressSubmit} className="space-y-4">
      <div className="flex items-center space-x-3 mb-4">
        <MapPin className="mr-2 text-[#003160]" size={20} />
        <div>
          <h3 className="font-medium">Delivery Address</h3>
          <p className="text-sm text-gray-500">Select a delivery address</p>
        </div>
      </div>
      
      <div className="grid gap-3">
        <div>
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            name="fullName"
            value={addressForm.fullName}
            onChange={handleAddressFormChange}
            placeholder="Enter your full name"
          />
        </div>
        
        <div>
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            name="address"
            value={addressForm.address}
            onChange={handleAddressFormChange}
            placeholder="Enter your street address"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              name="city"
              value={addressForm.city}
              onChange={handleAddressFormChange}
              placeholder="City"
            />
          </div>
          <div>
            <Label htmlFor="zipCode">ZIP Code</Label>
            <Input
              id="zipCode"
              name="zipCode"
              value={addressForm.zipCode}
              onChange={handleAddressFormChange}
              placeholder="ZIP code"
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="phoneNumber">Phone Number</Label>
          <Input
            id="phoneNumber"
            name="phoneNumber"
            value={addressForm.phoneNumber}
            onChange={handleAddressFormChange}
            placeholder="Enter your phone number"
          />
        </div>
      </div>
      
      <div className="flex justify-between mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onCheckoutCancel}
        >
          Back to Cart
        </Button>
        <Button
          type="submit"
          className="bg-[#003160] hover:bg-[#002040]"
        >
          Continue to Payment
        </Button>
      </div>
    </form>
  );
  
  const renderPaymentForm = () => (
    <form onSubmit={handlePaymentSubmit} className="space-y-4">
      <div className="flex items-center space-x-3 mb-4">
        <CreditCard className="mr-2 text-[#003160]" size={20} />
        <div>
          <h3 className="font-medium">Payment Method</h3>
          <p className="text-sm text-gray-500">Select a payment method</p>
        </div>
      </div>
      
      {orderError && (
        <Card className="bg-red-50 border-red-200 p-3 mb-4">
          <div className="flex items-start">
            <AlertCircle className="text-red-500 mr-2 mt-0.5" size={18} />
            <div>
              <h4 className="font-medium text-red-700">Order Failed</h4>
              <p className="text-sm text-red-600">{orderError}</p>
              <Button 
                type="button"
                variant="link" 
                className="text-red-700 p-0 h-auto mt-1"
                onClick={handleTryAgain}
              >
                Try again
              </Button>
            </div>
          </div>
        </Card>
      )}
      
      <div className="grid gap-3">
        <div>
          <Label htmlFor="cardNumber">Card Number</Label>
          <Input
            id="cardNumber"
            name="cardNumber"
            value={paymentForm.cardNumber}
            onChange={handlePaymentFormChange}
            placeholder="1234 5678 9012 3456"
            maxLength={16}
          />
        </div>
        
        <div>
          <Label htmlFor="cardHolder">Card Holder Name</Label>
          <Input
            id="cardHolder"
            name="cardHolder"
            value={paymentForm.cardHolder}
            onChange={handlePaymentFormChange}
            placeholder="Enter the name on card"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="expiryDate">Expiry Date</Label>
            <Input
              id="expiryDate"
              name="expiryDate"
              value={paymentForm.expiryDate}
              onChange={handlePaymentFormChange}
              placeholder="MM/YY"
              maxLength={5}
            />
          </div>
          <div>
            <Label htmlFor="cvv">CVV</Label>
            <Input
              id="cvv"
              name="cvv"
              value={paymentForm.cvv}
              onChange={handlePaymentFormChange}
              placeholder="123"
              maxLength={4}
              type="password"
            />
          </div>
        </div>
      </div>
      
      <div className="mt-6 space-y-3">
        <Separator />
        <div className="flex justify-between font-medium">
          <span>Subtotal</span>
          <span>${totalAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Delivery Fee</span>
          <span>${deliveryFee.toFixed(2)}</span>
        </div>
        <Separator />
        <div className="flex justify-between font-bold">
          <span>Total Amount</span>
          <span>${(totalAmount + deliveryFee).toFixed(2)}</span>
        </div>
      </div>
      
      <div className="flex justify-between mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => setCurrentStep('address')}
        >
          Back
        </Button>
        <Button
          type="submit"
          className="bg-[#003160] hover:bg-[#002040]"
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              Processing...
            </>
          ) : (
            "Complete Payment"
          )}
        </Button>
      </div>
    </form>
  );
  
  const renderConfirmation = () => (
    <div className="text-center py-6">
      <CheckCircle className="mx-auto mb-4 text-green-500" size={64} />
      <h3 className="text-xl font-semibold text-green-700 mb-2">Order Successful!</h3>
      <p className="text-gray-600 mb-6">Your order has been placed successfully.</p>
      
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h4 className="font-medium mb-2">Order Summary</h4>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Items:</span>
            <span>{cartItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Total Amount:</span>
            <span>${(totalAmount + deliveryFee).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Delivery Address:</span>
            <span className="text-right">{addressForm.address}, {addressForm.city}</span>
          </div>
        </div>
      </div>
      
      <Button
        onClick={onCheckoutComplete}
        className="bg-[#003160] hover:bg-[#002040]"
      >
        Continue Shopping
      </Button>
    </div>
  );
  
  return (
    <div className="space-y-4">
      {currentStep === 'address' && renderAddressForm()}
      {currentStep === 'payment' && renderPaymentForm()}
      {currentStep === 'confirmation' && renderConfirmation()}
    </div>
  );
};

export default Checkout; 