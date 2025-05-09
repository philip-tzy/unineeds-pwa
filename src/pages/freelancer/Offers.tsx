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
  CheckCheck,
  Calendar,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from '@/components/ui/use-toast';
import FreelancerBottomNavigation from '@/components/freelancer/BottomNavigation';
import { freelancerServices } from '@/services/api';
import { ServiceOffer } from '@/types/service';
import { formatPrice, formatDate } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const FreelancerOffers: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [offers, setOffers] = useState<ServiceOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedOffer, setSelectedOffer] = useState<ServiceOffer | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tableError, setTableError] = useState<string | null>(null);
  
  // Fetch offers on component mount
  useEffect(() => {
    if (!user) return;
    
    const fetchOffers = async () => {
      setIsLoading(true);
      try {
        const offersData = await freelancerServices.getServiceOffers(user.id);
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
    
    // Only set up subscription if we don't have a table error
    let subscription: { unsubscribe: () => void } | null = null;
    
    if (!tableError) {
      try {
        // Set up real-time subscription for offer updates
        subscription = freelancerServices.subscribeToServiceOffers(
          user.id,
          (updatedOffer) => {
            setOffers(prevOffers => {
              const index = prevOffers.findIndex(offer => offer.id === updatedOffer.id);
              
              if (index >= 0) {
                // Replace existing offer
                const newOffers = [...prevOffers];
                newOffers[index] = updatedOffer;
                return newOffers;
              }
              
              // Add new offer and show notification
              toast({
                title: "New Service Offer",
                description: `You have received a new service offer${updatedOffer.service?.title ? ` for "${updatedOffer.service.title}"` : ''}`,
              });
              
              return [updatedOffer, ...prevOffers];
            });
          }
        );
      } catch (error) {
        console.error('Error setting up subscription:', error);
      }
    }
    
    // Clean up subscription on unmount
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [user, toast, tableError]);
  
  // Filter offers based on active tab
  const filteredOffers = offers.filter(offer => {
    if (activeTab === 'pending') return offer.status === 'pending';
    if (activeTab === 'accepted') return offer.status === 'accepted';
    if (activeTab === 'completed') return offer.status === 'completed';
    if (activeTab === 'rejected') return offer.status === 'rejected';
    return true;
  });
  
  const handleOpenActionDialog = (offer: ServiceOffer) => {
    setSelectedOffer(offer);
    setActionDialogOpen(true);
  };
  
  const handleOpenDetailDialog = (offer: ServiceOffer) => {
    setSelectedOffer(offer);
    setDetailDialogOpen(true);
  };
  
  const handleUpdateOfferStatus = async (status: 'accepted' | 'rejected' | 'completed') => {
    if (!selectedOffer) return;
    
    setIsSubmitting(true);
    
    try {
      await freelancerServices.updateServiceOfferStatus(selectedOffer.id, status);
      
      let message = '';
      switch (status) {
        case 'accepted':
          message = 'Offer has been accepted successfully';
          break;
        case 'rejected':
          message = 'Offer has been rejected';
          break;
        case 'completed':
          message = 'Service has been marked as completed';
          break;
      }
      
      toast({
        title: "Success",
        description: message,
      });
      
      setActionDialogOpen(false);
      setSelectedOffer(null);
    } catch (error) {
      console.error('Error updating offer status:', error);
      toast({
        title: "Error",
        description: "Failed to update offer status. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
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
              <h1 className="text-xl font-bold">Service Offers</h1>
              <p className="text-sm opacity-80">Manage offers from customers</p>
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
              onClick={() => navigate('/freelancer/dashboard')}
              className="bg-[#003160] hover:bg-[#002040]"
            >
              Return to Dashboard
            </Button>
          </div>
        </div>
        
        <FreelancerBottomNavigation />
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
            <h1 className="text-xl font-bold">Service Offers</h1>
            <p className="text-sm opacity-80">Manage offers from customers</p>
          </div>
        </div>
      </header>
      
      {/* Tabs */}
      <div className="px-4 pt-4">
        <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-4">
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
                <h3 className="text-lg font-medium mb-1">No {activeTab} offers</h3>
                <p className="text-gray-500 text-sm">
                  {activeTab === 'pending' 
                    ? "You don't have any pending offers from customers yet."
                    : activeTab === 'accepted'
                    ? "You haven't accepted any offers yet."
                    : activeTab === 'completed'
                    ? "You haven't completed any services yet."
                    : "You haven't rejected any offers yet."}
                </p>
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
                          <div className="flex items-center gap-3 mb-2">
                            <Avatar className="h-10 w-10">
                              {offer.customer?.avatar_url ? (
                                <AvatarImage src={offer.customer.avatar_url} alt={offer.customer?.name || 'Customer'} />
                              ) : (
                                <AvatarFallback>{(offer.customer?.name || 'C').charAt(0).toUpperCase()}</AvatarFallback>
                              )}
                            </Avatar>
                            <div>
                              <h3 className="font-medium text-gray-900">
                                {offer.customer?.name || 'Customer'}
                              </h3>
                              <p className="text-sm text-gray-500">
                                <Clock className="inline-block w-3.5 h-3.5 mr-1" />
                                {formatDate(offer.created_at)}
                              </p>
                            </div>
                          </div>
                          
                          <h4 className="font-medium text-gray-800 mb-1">
                            {offer.service?.title || 'Unnamed Service'}
                          </h4>
                          
                          <div className="flex flex-wrap gap-3 items-center text-sm text-gray-600 mb-2">
                            <span className="flex items-center">
                              <DollarSign className="w-4 h-4 mr-1" />
                              {formatPrice(offer.price)}
                            </span>
                            <span className="flex items-center">
                              <MessageSquare className="w-4 h-4 mr-1" />
                              {(offer.message?.length > 40 ? offer.message.substring(0, 40) + '...' : offer.message) || 'No message'}
                            </span>
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
                        
                        {offer.status === 'pending' && (
                          <Button
                            size="sm"
                            className="flex-1 bg-[#003160] hover:bg-[#002040]"
                            onClick={() => handleOpenActionDialog(offer)}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Respond
                          </Button>
                        )}
                        
                        {offer.status === 'accepted' && (
                          <Button
                            size="sm"
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            onClick={() => {
                              setSelectedOffer(offer);
                              setActionDialogOpen(true);
                            }}
                          >
                            <CheckCheck className="w-4 h-4 mr-1" />
                            Complete
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
      
      {/* Action Dialog for responding to offers */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedOffer?.status === 'accepted' 
                ? 'Complete This Service' 
                : 'Respond to Service Offer'}
            </DialogTitle>
            <DialogDescription>
              {selectedOffer?.status === 'accepted' 
                ? 'Mark this service as completed once you have fulfilled the customer request.'
                : 'You can accept or reject this offer from the customer.'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedOffer && (
            <div className="py-2">
              <div className="border border-gray-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-gray-700 mb-2">
                  <span className="font-medium">Service:</span> {selectedOffer.service?.title || 'Unnamed Service'}
                </p>
                <p className="text-sm text-gray-700 mb-2">
                  <span className="font-medium">Customer:</span> {selectedOffer.customer?.name || 'Customer'}
                </p>
                <p className="text-sm text-gray-700 mb-2">
                  <span className="font-medium">Price:</span> {formatPrice(selectedOffer.price)}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Message:</span> {selectedOffer.message || 'No message provided'}
                </p>
              </div>
              
              {selectedOffer.status === 'accepted' ? (
                <div className="mt-2 space-y-4">
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Ready to complete?</AlertTitle>
                    <AlertDescription>
                      By marking this as completed, you confirm that you have delivered the requested service.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      className="bg-green-600 hover:bg-green-700"
                      disabled={isSubmitting}
                      onClick={() => handleUpdateOfferStatus('completed')}
                    >
                      {isSubmitting ? 'Marking completed...' : 'Mark as Completed'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-2 space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Choose your response</AlertTitle>
                    <AlertDescription>
                      This action cannot be undone. Please review the offer details carefully.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="flex justify-end gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => setActionDialogOpen(false)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="destructive"
                      disabled={isSubmitting}
                      onClick={() => handleUpdateOfferStatus('rejected')}
                    >
                      {isSubmitting ? 'Rejecting...' : 'Reject Offer'}
                    </Button>
                    <Button 
                      className="bg-[#003160] hover:bg-[#002040]"
                      disabled={isSubmitting}
                      onClick={() => handleUpdateOfferStatus('accepted')}
                    >
                      {isSubmitting ? 'Accepting...' : 'Accept Offer'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      
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
                  {selectedOffer.customer?.avatar_url ? (
                    <AvatarImage src={selectedOffer.customer.avatar_url} alt={selectedOffer.customer?.name || 'Customer'} />
                  ) : (
                    <AvatarFallback>{(selectedOffer.customer?.name || 'C').charAt(0).toUpperCase()}</AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <h3 className="font-semibold">{selectedOffer.customer?.name || 'Customer'}</h3>
                  <p className="text-sm text-gray-500">Customer</p>
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
                    <p className="text-gray-500">Price</p>
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
                
                <h4 className="font-medium mb-1">Customer Message</h4>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm whitespace-pre-wrap">{selectedOffer.message || 'No message provided'}</p>
                </div>
              </div>
              
              {selectedOffer.status === 'pending' && (
                <div className="flex justify-end space-x-3">
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setDetailDialogOpen(false);
                      setTimeout(() => handleOpenActionDialog(selectedOffer), 100);
                    }}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                  <Button
                    className="bg-[#003160] hover:bg-[#002040]"
                    onClick={() => {
                      setDetailDialogOpen(false);
                      setTimeout(() => handleOpenActionDialog(selectedOffer), 100);
                    }}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Accept
                  </Button>
                </div>
              )}
              
              {selectedOffer.status === 'accepted' && (
                <div className="flex justify-end">
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      setDetailDialogOpen(false);
                      setTimeout(() => {
                        setSelectedOffer(selectedOffer);
                        setActionDialogOpen(true);
                      }, 100);
                    }}
                  >
                    <CheckCheck className="w-4 h-4 mr-1" />
                    Mark as Completed
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      <FreelancerBottomNavigation />
    </div>
  );
};

export default FreelancerOffers; 