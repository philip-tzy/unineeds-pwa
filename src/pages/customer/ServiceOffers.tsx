import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { 
  ArrowLeft, 
  Clock, 
  DollarSign, 
  MessageSquare, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  RefreshCw,
  User,
  Package,
  DatabaseIcon,
  Info,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from '@/components/ui/use-toast';
import { customerServices } from '@/services/api';
import { ServiceOffer } from '@/types/service';
import { formatPrice, formatDate } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { supabase } from '@/integrations/supabase/client';
import CustomerBottomNavigation from '@/components/customer/BottomNavigation';

const CustomerServiceOffers: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [offers, setOffers] = useState<ServiceOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedOffer, setSelectedOffer] = useState<ServiceOffer | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [tableError, setTableError] = useState<string | null>(null);
  
  // Fetch offers on component mount
  useEffect(() => {
    if (!user) return;
    
    const fetchOffers = async () => {
      setIsLoading(true);
      try {
        const offersData = await customerServices.getCustomerOffers(user.id);
        if (offersData) {
          setOffers(offersData);
        }
        // Clear any previous errors if successful
        setTableError(null);
      } catch (error: any) {
        console.error('Error fetching offers:', error);
        
        // Check for specific database error indicating missing table
        if (error.code === 'PGRST200' && error.message?.includes('service_offers')) {
          setTableError('The service offers feature is not yet fully setup. The database table is missing.');
        } else {
          toast({
            title: "Error",
            description: "Failed to load service offers. Please try again.",
            variant: "destructive"
          });
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOffers();
    
    // Set up real-time subscription for offer updates
    const subscription = supabase
      .channel(`customer-offers-${user.id}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'service_offers',
          filter: `customer_id=eq.${user.id}`
        },
        (payload) => {
          // Handle real-time updates
          if (payload.eventType === 'UPDATE') {
            const updatedOffer = payload.new as any;
            
            setOffers(prevOffers => {
              const index = prevOffers.findIndex(offer => offer.id === updatedOffer.id);
              
              if (index >= 0) {
                // Replace existing offer
                const newOffers = [...prevOffers];
                newOffers[index] = {
                  ...newOffers[index],
                  ...updatedOffer
                };
                
                // Show notification for status changes
                if (updatedOffer.status === 'accepted') {
                  toast({
                    title: "Offer Accepted!",
                    description: `Your offer for "${newOffers[index].service?.title}" has been accepted`,
                    variant: "default",
                  });
                } else if (updatedOffer.status === 'rejected') {
                  toast({
                    title: "Offer Rejected",
                    description: `Your offer for "${newOffers[index].service?.title}" has been rejected`,
                    variant: "destructive",
                  });
                } else if (updatedOffer.status === 'completed') {
                  toast({
                    title: "Service Completed",
                    description: `Your service for "${newOffers[index].service?.title}" has been marked as completed`,
                    variant: "default",
                  });
                }
                
                return newOffers;
              }
              
              return prevOffers;
            });
          } else if (payload.eventType === 'INSERT') {
            // Handle new offer (though unlikely to happen for customer)
            fetchOffers();
          }
        }
      )
      .subscribe();
    
    // Clean up subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [user, toast]);
  
  // Filter offers based on active tab
  const filteredOffers = offers.filter(offer => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return offer.status === 'pending';
    if (activeTab === 'accepted') return offer.status === 'accepted';
    if (activeTab === 'completed') return offer.status === 'completed';
    if (activeTab === 'rejected') return offer.status === 'rejected';
    return true;
  });
  
  const handleOpenDetailDialog = (offer: ServiceOffer) => {
    setSelectedOffer(offer);
    setDetailDialogOpen(true);
  };
  
  const openServiceDetails = (serviceId: string) => {
    navigate(`/service/${serviceId}`);
  };
  
  const contactFreelancerWhatsApp = (whatsapp: string) => {
    if (!whatsapp) return;
    
    // Format WhatsApp number
    let whatsappNumber = whatsapp.replace(/\D/g, '');
    if (whatsappNumber.startsWith('0')) {
      whatsappNumber = '62' + whatsappNumber.substring(1);
    }
    
    // Open WhatsApp link
    window.open(`https://wa.me/${whatsappNumber}`, '_blank');
  };
  
  // Helper function to get status badge color and text
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'accepted':
        return <Badge className="bg-green-500">Accepted</Badge>;
      case 'completed':
        return <Badge className="bg-blue-500">Completed</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500">Rejected</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };
  
  // Show table error if there's an issue with the database setup
  if (tableError) {
    return (
      <div className="min-h-screen bg-gray-50 pb-16">
        {/* Header */}
        <header className="bg-[#003160] text-white p-4 shadow-sm">
          <div className="flex items-center">
            <button 
              onClick={() => navigate(-1)} 
              className="p-1 rounded-full hover:bg-[#004180] transition-colors mr-3"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold">My Service Offers</h1>
              <p className="text-sm opacity-80">Track your service requests</p>
            </div>
          </div>
        </header>
        
        <div className="p-4 mt-8">
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Database setup required</AlertTitle>
            <AlertDescription>
              {tableError}
            </AlertDescription>
          </Alert>
          
          <div className="bg-white rounded-lg p-8 text-center shadow-sm">
            <DatabaseIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-medium mb-2">Missing Database Table</h2>
            <p className="text-gray-600 mb-6">
              The service_offers table needs to be created in your database before you can use this feature.
              Please run the database migration script to set up the necessary tables.
            </p>
            <Button 
              onClick={() => navigate('/')}
              className="bg-[#003160] hover:bg-[#002040]"
            >
              Return to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Header */}
      <header className="bg-[#003160] text-white p-4 shadow-sm">
        <div className="flex items-center">
          <button 
            onClick={() => navigate(-1)} 
            className="p-1 rounded-full hover:bg-[#004180] transition-colors mr-3"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold">My Service Offers</h1>
            <p className="text-sm opacity-80">Track your service requests</p>
          </div>
        </div>
      </header>
      
      {/* Tabs */}
      <div className="px-4 pt-4">
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 mb-4">
            <TabsTrigger value="all" className="text-xs sm:text-sm">All</TabsTrigger>
            <TabsTrigger value="pending" className="text-xs sm:text-sm">
              Pending
              {offers.filter(o => o.status === 'pending').length > 0 && (
                <span className="ml-1.5 bg-yellow-500 text-white text-xs rounded-full w-5 h-5 inline-flex items-center justify-center">
                  {offers.filter(o => o.status === 'pending').length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="accepted" className="text-xs sm:text-sm">Accepted</TabsTrigger>
            <TabsTrigger value="completed" className="text-xs sm:text-sm">Completed</TabsTrigger>
            <TabsTrigger value="rejected" className="text-xs sm:text-sm">Rejected</TabsTrigger>
          </TabsList>
          
          <div className="mt-4">
            {isLoading ? (
              // Loading state
              <div className="flex items-center justify-center py-10">
                <RefreshCw size={24} className="animate-spin text-gray-500" />
                <span className="ml-2 text-gray-500">Loading offers...</span>
              </div>
            ) : filteredOffers.length === 0 ? (
              // Empty state
              <div className="bg-white rounded-lg p-6 text-center shadow-sm">
                <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <h3 className="text-lg font-medium mb-1">No offers found</h3>
                <p className="text-gray-500 text-sm mb-6">
                  {activeTab === 'all' 
                    ? "You haven't made any service offers yet."
                    : activeTab === 'pending'
                    ? "You don't have any pending offers."
                    : activeTab === 'accepted'
                    ? "You don't have any accepted offers."
                    : activeTab === 'completed'
                    ? "You don't have any completed services."
                    : "You don't have any rejected offers."}
                </p>
                <Button
                  onClick={() => navigate('/quickhire')}
                  className="bg-[#003160] hover:bg-[#002040]"
                >
                  Browse Services
                </Button>
              </div>
            ) : (
              // Offers list
              <div className="space-y-3">
                {filteredOffers.map((offer) => (
                  <div 
                    key={offer.id} 
                    className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100 transition-all hover:shadow-md"
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800 mb-1">
                            {offer.service?.title || 'Unnamed Service'}
                          </h4>
                          
                          <div className="flex flex-wrap gap-3 items-center text-sm text-gray-600 mb-2">
                            <span className="flex items-center">
                              <DollarSign className="w-4 h-4 mr-1" />
                              {formatPrice(offer.price)}
                            </span>
                            <span className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {formatDate(offer.created_at)}
                            </span>
                          </div>
                          
                          <div className="flex items-center text-sm text-gray-600">
                            <MessageSquare className="w-4 h-4 mr-1" />
                            {(offer.message?.length > 40 ? offer.message.substring(0, 40) + '...' : offer.message) || 'No message'}
                          </div>
                        </div>
                        
                        <div className="ml-2">
                          {getStatusBadge(offer.status)}
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-gray-700"
                          onClick={() => handleOpenDetailDialog(offer)}
                        >
                          <Info className="w-4 h-4 mr-1" />
                          Details
                        </Button>
                        
                        {offer.status === 'accepted' && offer.service?.id && (
                          <Button
                            size="sm"
                            className="flex-1 bg-[#003160] hover:bg-[#002040]"
                            onClick={() => openServiceDetails(offer.service.id)}
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            View Service
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Tabs>
      </div>
      
      {/* Detail Dialog for viewing full offer details */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Offer Details</DialogTitle>
            <DialogDescription>
              Complete information about this service offer
            </DialogDescription>
          </DialogHeader>
          
          {selectedOffer && (
            <div className="py-2 space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  {selectedOffer.freelancer?.avatar_url ? (
                    <AvatarImage src={selectedOffer.freelancer.avatar_url} alt={selectedOffer.freelancer?.name || 'Freelancer'} />
                  ) : (
                    <AvatarFallback>{(selectedOffer.freelancer?.name || 'F').charAt(0).toUpperCase()}</AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <h3 className="font-semibold">{selectedOffer.freelancer?.name || 'Freelancer'}</h3>
                  <p className="text-sm text-gray-500">Service Provider</p>
                </div>
              </div>
              
              <div className="border-t border-b border-gray-200 py-3">
                <h4 className="font-medium mb-1">Service Information</h4>
                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                  <div>
                    <p className="text-gray-500">Service</p>
                    <p className="font-medium">{selectedOffer.service?.title || 'Unnamed Service'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Category</p>
                    <p className="font-medium">{selectedOffer.service?.category || 'N/A'}</p>
                  </div>
                </div>
                
                <h4 className="font-medium mb-1">Offer Details</h4>
                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                  <div>
                    <p className="text-gray-500">Your Offer</p>
                    <p className="font-medium">{formatPrice(selectedOffer.price)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Status</p>
                    <p>{getStatusBadge(selectedOffer.status)}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-500">Date Offered</p>
                    <p className="font-medium">{formatDate(selectedOffer.created_at)}</p>
                  </div>
                </div>
                
                <h4 className="font-medium mb-1">Your Message</h4>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm whitespace-pre-wrap">{selectedOffer.message || 'No message provided'}</p>
                </div>
              </div>
              
              {selectedOffer.status === 'accepted' && selectedOffer.service?.whatsapp && (
                <div className="flex justify-end">
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => contactFreelancerWhatsApp(selectedOffer.service?.whatsapp || '')}
                  >
                    <svg 
                      className="w-4 h-4 mr-2" 
                      viewBox="0 0 24 24" 
                      fill="currentColor"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M17.6 6.3C16.2 5 14.4 4.2 12.4 4.2C8.3 4.2 5 7.5 5 11.6C5 13.1 5.4 14.5 6.1 15.8L5 19L8.3 17.9C9.5 18.5 10.9 18.9 12.3 18.9C16.4 18.9 19.7 15.6 19.7 11.5C19.8 9.5 19 7.7 17.6 6.3ZM12.4 17.5C11.1 17.5 9.9 17.1 8.8 16.5L8.5 16.3L6.5 16.9L7.1 15L6.9 14.7C6.3 13.5 5.9 12.3 5.9 11C5.9 8 8.4 5.5 12.3 5.5C13.9 5.5 15.4 6.1 16.5 7.2C17.6 8.3 18.2 9.8 18.2 11.4C18.3 14.5 15.8 17.5 12.4 17.5ZM15.2 12.9C15 12.8 14 12.3 13.9 12.2C13.7 12.1 13.6 12.1 13.5 12.3C13.4 12.5 13 13 12.9 13.1C12.8 13.2 12.7 13.3 12.5 13.2C11.3 12.6 10.6 12.1 9.8 10.8C9.6 10.4 10 10.5 10.3 9.9C10.4 9.8 10.3 9.7 10.3 9.6C10.2 9.5 9.7 8.5 9.5 8.1C9.3 7.7 9.1 7.8 9 7.8H8.8C8.7 7.8 8.5 7.8 8.3 8C8.1 8.2 7.6 8.7 7.6 9.7C7.6 10.7 8.3 11.6 8.4 11.7C8.5 11.8 9.7 13.7 11.6 14.6C13.5 15.5 13.5 15.2 14 15.2C14.5 15.2 15.3 14.7 15.5 14.3C15.7 13.9 15.7 13.5 15.6 13.4C15.5 13.1 15.3 13.1 15.2 12.9Z" />
                    </svg>
                    Contact via WhatsApp
                  </Button>
                </div>
              )}
              
              {selectedOffer.status === 'rejected' && (
                <div className="flex justify-end">
                  <Button
                    className="bg-[#003160] hover:bg-[#002040]"
                    onClick={() => {
                      setDetailDialogOpen(false);
                      if (selectedOffer.service?.id) {
                        openServiceDetails(selectedOffer.service.id);
                      }
                    }}
                  >
                    Try Again
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Bottom navigation would go here for customer */}
      <CustomerBottomNavigation />
    </div>
  );
};

export default CustomerServiceOffers; 