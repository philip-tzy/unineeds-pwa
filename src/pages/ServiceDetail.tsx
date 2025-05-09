import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Clock, 
  DollarSign, 
  MessageSquare, 
  User,
  MapPin,
  ExternalLink,
  Briefcase,
  Send,
  CheckCircle,
  RefreshCw,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Service } from '@/types/service';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { formatPrice, formatDate } from '@/lib/utils';
import { customerServices, freelancerServices } from '@/services/api';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const ServiceDetail: React.FC = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [service, setService] = useState<Service | null>(null);
  const [freelancer, setFreelancer] = useState<any | null>(null);
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successDialog, setSuccessDialog] = useState(false);
  
  // Get default price from service
  useEffect(() => {
    if (service) {
      setCustomPrice(service.price.toString());
    }
  }, [service]);
  
  useEffect(() => {
    if (!serviceId) return;
    
    const fetchServiceDetails = async () => {
      setIsLoading(true);
      try {
        // Get service details
        const serviceData = await customerServices.getServiceById(serviceId);
        setService(serviceData);
        
        // Get freelancer details
        if (serviceData.user_id) {
          const userData = await freelancerServices.getFreelancerProfile(serviceData.user_id);
          setFreelancer(userData);
        }
      } catch (error) {
        console.error('Error fetching service details:', error);
        setError('Failed to load service details. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchServiceDetails();
  }, [serviceId]);
  
  const handleContactWhatsApp = () => {
    if (!service?.whatsapp) return;
    
    // Format WhatsApp number
    let whatsappNumber = service.whatsapp.replace(/\D/g, '');
    if (whatsappNumber.startsWith('0')) {
      whatsappNumber = '62' + whatsappNumber.substring(1);
    }
    
    // Open WhatsApp link
    window.open(`https://wa.me/${whatsappNumber}`, '_blank');
  };
  
  const handleOpenPortfolio = () => {
    if (!service?.portfolio_url) return;
    window.open(service.portfolio_url, '_blank');
  };
  
  const handleSubmitOffer = async () => {
    if (!user || !service) return;
    
    setSubmitting(true);
    
    try {
      // Parse price to ensure it's valid
      const priceValue = parseFloat(customPrice);
      if (isNaN(priceValue) || priceValue <= 0) {
        throw new Error('Please enter a valid price');
      }
      
      // Submit the offer
      await customerServices.createServiceOffer({
        service_id: service.id,
        freelancer_id: service.user_id,
        message: message.trim(),
        price: priceValue
      });
      
      // Show success
      setOfferDialogOpen(false);
      setMessage('');
      setSuccessDialog(true);
      
      toast({
        title: "Success!",
        description: "Your offer has been sent to the freelancer",
      });
    } catch (error: any) {
      console.error('Error submitting offer:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send your offer. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-[#003160] text-white p-4">
          <div className="flex items-center">
            <button 
              onClick={() => navigate(-1)} 
              className="p-1 mr-3 rounded-full hover:bg-[#004180] transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold">Service Details</h1>
          </div>
        </header>
        
        <div className="flex flex-col items-center justify-center p-10">
          <RefreshCw size={40} className="text-gray-400 animate-spin mb-4" />
          <p className="text-gray-600">Loading service details...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error || !service) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-[#003160] text-white p-4">
          <div className="flex items-center">
            <button 
              onClick={() => navigate(-1)} 
              className="p-1 mr-3 rounded-full hover:bg-[#004180] transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold">Service Details</h1>
          </div>
        </header>
        
        <div className="p-6">
          <Alert variant="destructive">
            <Info className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error || "Service not found. It may have been removed or is unavailable."}
            </AlertDescription>
          </Alert>
          
          <div className="mt-4 flex justify-center">
            <Button onClick={() => navigate(-1)}>
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      {/* Header */}
      <header className="bg-[#003160] text-white p-4">
        <div className="flex items-center">
          <button 
            onClick={() => navigate(-1)} 
            className="p-1 mr-3 rounded-full hover:bg-[#004180] transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">Service Details</h1>
        </div>
      </header>
      
      {/* Service details */}
      <div className="p-4">
        <div className="bg-white rounded-lg overflow-hidden shadow-sm mb-4">
          <div className="p-5">
            <h1 className="text-xl font-bold text-gray-900 mb-2">{service.title}</h1>
            
            {/* Freelancer Info */}
            <div className="flex items-center mb-4">
              <Avatar className="h-10 w-10 mr-3">
                {freelancer?.avatar_url ? (
                  <AvatarImage src={freelancer.avatar_url} alt={freelancer?.name || 'Freelancer'} />
                ) : (
                  <AvatarFallback>{freelancer?.name?.charAt(0).toUpperCase() || 'F'}</AvatarFallback>
                )}
              </Avatar>
              <div>
                <h3 className="font-medium">{freelancer?.name || 'Freelancer'}</h3>
                <p className="text-sm text-gray-500">
                  <Briefcase className="inline w-3.5 h-3.5 mr-1" />
                  {service.category}
                </p>
              </div>
            </div>
            
            {/* Price & Delivery */}
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex items-center bg-blue-50 text-blue-700 px-3 py-1.5 rounded-md">
                <DollarSign className="w-4 h-4 mr-1" />
                <span className="font-medium">{formatPrice(service.price)}</span>
              </div>
              
              <div className="flex items-center bg-green-50 text-green-700 px-3 py-1.5 rounded-md">
                <Clock className="w-4 h-4 mr-1" />
                <span>{service.delivery_time}</span>
              </div>
              
              {service.location && (
                <div className="flex items-center bg-purple-50 text-purple-700 px-3 py-1.5 rounded-md">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span>{service.location}</span>
                </div>
              )}
            </div>
            
            {/* Description */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <div className="text-gray-700 whitespace-pre-wrap">
                {service.description}
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                className="flex-1 bg-[#003160] hover:bg-[#002040]"
                onClick={() => setOfferDialogOpen(true)}
              >
                <MessageSquare className="w-5 h-5 mr-2" />
                Send Offer
              </Button>
              
              {service.whatsapp && (
                <Button 
                  variant="outline" 
                  className="flex-1 border-green-500 text-green-600 hover:bg-green-50"
                  onClick={handleContactWhatsApp}
                >
                  <svg 
                    className="w-5 h-5 mr-2" 
                    viewBox="0 0 24 24" 
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M17.6 6.3C16.2 5 14.4 4.2 12.4 4.2C8.3 4.2 5 7.5 5 11.6C5 13.1 5.4 14.5 6.1 15.8L5 19L8.3 17.9C9.5 18.5 10.9 18.9 12.3 18.9C16.4 18.9 19.7 15.6 19.7 11.5C19.8 9.5 19 7.7 17.6 6.3ZM12.4 17.5C11.1 17.5 9.9 17.1 8.8 16.5L8.5 16.3L6.5 16.9L7.1 15L6.9 14.7C6.3 13.5 5.9 12.3 5.9 11C5.9 8 8.4 5.5 12.3 5.5C13.9 5.5 15.4 6.1 16.5 7.2C17.6 8.3 18.2 9.8 18.2 11.4C18.3 14.5 15.8 17.5 12.4 17.5ZM15.2 12.9C15 12.8 14 12.3 13.9 12.2C13.7 12.1 13.6 12.1 13.5 12.3C13.4 12.5 13 13 12.9 13.1C12.8 13.2 12.7 13.3 12.5 13.2C11.3 12.6 10.6 12.1 9.8 10.8C9.6 10.4 10 10.5 10.3 9.9C10.4 9.8 10.3 9.7 10.3 9.6C10.2 9.5 9.7 8.5 9.5 8.1C9.3 7.7 9.1 7.8 9 7.8H8.8C8.7 7.8 8.5 7.8 8.3 8C8.1 8.2 7.6 8.7 7.6 9.7C7.6 10.7 8.3 11.6 8.4 11.7C8.5 11.8 9.7 13.7 11.6 14.6C13.5 15.5 13.5 15.2 14 15.2C14.5 15.2 15.3 14.7 15.5 14.3C15.7 13.9 15.7 13.5 15.6 13.4C15.5 13.1 15.3 13.1 15.2 12.9Z" />
                  </svg>
                  WhatsApp
                </Button>
              )}
              
              {service.portfolio_url && (
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={handleOpenPortfolio}
                >
                  <ExternalLink className="w-5 h-5 mr-2" />
                  Portfolio
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Offer Dialog */}
      <Dialog open={offerDialogOpen} onOpenChange={setOfferDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Offer to Freelancer</DialogTitle>
            <DialogDescription>
              Send a message and your offer to the freelancer. They will be notified and can accept or reject your offer.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Service</label>
              <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
                <p className="font-medium">{service.title}</p>
                <p className="text-sm text-gray-500">{formatPrice(service.price)} • {service.delivery_time}</p>
              </div>
            </div>
            
            <div>
              <label htmlFor="message" className="text-sm font-medium mb-1.5 block">
                Message to Freelancer
              </label>
              <Textarea
                id="message"
                placeholder="Explain your requirements, questions, or any details about your project..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="resize-none min-h-[120px]"
              />
            </div>
            
            <div>
              <label htmlFor="price" className="text-sm font-medium mb-1.5 block">
                Price Offer (IDR)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500">Rp</span>
                </div>
                <Input
                  id="price"
                  type="number"
                  placeholder="Enter your price offer"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  className="pl-10"
                  min="0"
                  step="1000"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {service.price !== parseFloat(customPrice || '0') 
                  ? `Original price: ${formatPrice(service.price)}`
                  : 'This is the original price offered by the freelancer'}
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button 
              className="bg-[#003160] hover:bg-[#002040]"
              disabled={!message.trim() || submitting || !customPrice || parseFloat(customPrice) <= 0}
              onClick={handleSubmitOffer}
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Offer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Success Dialog */}
      <Dialog open={successDialog} onOpenChange={setSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Offer Sent Successfully!</DialogTitle>
            <DialogDescription>
              Your offer has been sent to the freelancer. You will be notified when they respond.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 flex flex-col items-center">
            <div className="bg-green-100 p-3 rounded-full mb-3">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <p className="text-center mb-2">
              What happens next?
            </p>
            <ul className="text-sm text-gray-600 space-y-1 list-disc pl-5">
              <li>The freelancer will receive your offer notification</li>
              <li>They can accept or reject your offer</li>
              <li>If accepted, you can proceed with the project</li>
              <li>Check your offers page for updates</li>
            </ul>
          </div>
          
          <DialogFooter>
            <Button 
              className="w-full bg-[#003160] hover:bg-[#002040]"
              onClick={() => {
                setSuccessDialog(false);
                navigate('/customer/offers');
              }}
            >
              View My Offers
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServiceDetail; 