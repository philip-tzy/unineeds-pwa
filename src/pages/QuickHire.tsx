import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Briefcase, 
  Search, 
  Star, 
  Handshake, 
  UserCog, 
  Code, 
  Paintbrush, 
  FileText, 
  Filter, 
  Clock, 
  MapPin, 
  DollarSign, 
  Heart, 
  MessageSquare 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import NotificationBell from '@/components/NotificationBell';
import { customerServices } from '@/services/api';
import { Service } from '@/types/service';
import { formatPrice } from '@/lib/utils';

const categories = [
  { id: 'all', name: 'All Services', icon: <Briefcase size={18} /> },
  { id: 'programming', name: 'Programming', icon: <Code size={18} /> },
  { id: 'design', name: 'Design', icon: <Paintbrush size={18} /> },
  { id: 'writing', name: 'Writing', icon: <FileText size={18} /> },
  { id: 'marketing', name: 'Marketing', icon: <FileText size={18} /> },
  { id: 'video', name: 'Video & Animation', icon: <FileText size={18} /> },
  { id: 'music', name: 'Music & Audio', icon: <FileText size={18} /> },
  { id: 'business', name: 'Business', icon: <FileText size={18} /> },
  { id: 'other', name: 'Other', icon: <FileText size={18} /> }
];

const QuickHire: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  // Fetch services on component mount
  useEffect(() => {
    const fetchServices = async () => {
      setIsLoading(true);
      try {
        const servicesData = await customerServices.getAvailableServices();
        console.log('Fetched services:', servicesData);
        setServices(servicesData || []);
        setFilteredServices(servicesData || []);
      } catch (error) {
        console.error('Error fetching services:', error);
        toast({
          title: "Error",
          description: "Failed to load freelancer services. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchServices();
    
    // Set up real-time subscription for new services
    const servicesSubscription = supabase
      .channel('services-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'services' 
        },
        (payload) => {
          // Refresh the services list
          fetchServices();
          
          // Show notification for new services
          if (payload.eventType === 'INSERT') {
            toast({
              title: "New Service Available",
              description: "A new freelancer service has been added.",
            });
          }
        }
      )
      .subscribe();
    
    // Clean up subscription when component unmounts
    return () => {
      servicesSubscription.unsubscribe();
    };
  }, [toast]);
  
  // Filter services when search term or category changes
  useEffect(() => {
    if (services.length === 0) return;
    
    let results = services;
    
    // Filter by category
    if (selectedCategory !== 'all') {
      results = results.filter(service => service.category === selectedCategory);
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(service => 
        service.title.toLowerCase().includes(term) || 
        service.description.toLowerCase().includes(term)
      );
    }
    
    setFilteredServices(results);
  }, [services, selectedCategory, searchTerm]);
  
  const goToPostedJobs = () => {
    navigate('/customer/jobs');
  };
  
  const goToOffers = () => {
    navigate('/customer/offers');
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    // Focus on search input after selecting category
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };
  
  const handleContactFreelancer = (service: Service) => {
    setSelectedService(service);
    setIsContactDialogOpen(true);
  };
  
  const handleSendMessage = async () => {
    if (!user || !selectedService || !messageText.trim()) return;
    
    setIsSending(true);
    
    try {
      // In a real implementation, this would send a message to the freelancer
      // or create an offer (which we already implemented)
      
      // Navigate to service detail page to make an official offer
      setIsContactDialogOpen(false);
      setMessageText('');
      navigate(`/service/${selectedService.id}`);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };
  
  const handleSaveService = (service: Service) => {
    // In a real implementation, this would save the service to the user's saved items
    toast({
      title: "Service Saved",
      description: `${service.title} has been saved to your favorites.`,
    });
  };
  
  return (
    <div className="min-h-screen bg-gray-50 animate-fade-in">
      {/* App Bar */}
      <div className="bg-[#003160] p-4 text-white">
        <div className="flex items-center">
          <button 
            onClick={() => navigate(-1)} 
            className="p-1 rounded-full hover:bg-[#004180] transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="flex-1 text-center text-xl font-bold">
            <span className="text-white">Quick</span>
            <span className="text-gray-300">Hire</span>
          </h1>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <button
              onClick={goToPostedJobs}
              className="p-2 rounded-full hover:bg-[#004180] transition-colors"
              title="My Posted Jobs"
            >
              <Briefcase size={20} />
            </button>
            <button
              onClick={goToOffers}
              className="p-2 rounded-full hover:bg-[#004180] transition-colors"
              title="My Service Offers"
            >
              <MessageSquare size={20} />
            </button>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="mt-3">
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search for services..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full bg-[#004180] border-none rounded-full py-2 px-4 pl-10 outline-none text-white placeholder-gray-300"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-300" size={20} />
            <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-300">
              <Filter size={18} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Categories */}
      <div className="bg-white p-3 shadow-sm">
        <div className="flex overflow-x-auto gap-3 pb-2 -mx-1 px-1 no-scrollbar">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategorySelect(category.id)}
              className={`flex items-center space-x-2 py-1.5 px-3 rounded-full whitespace-nowrap transition-colors ${
                selectedCategory === category.id 
                  ? 'bg-[#003160] text-white' 
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              <span>{category.icon}</span>
              <span className="text-sm">{category.name}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Services Section */}
      <div className="p-4">
        <h2 className="text-lg font-bold mb-2">Freelancer Services</h2>
        <p className="text-sm text-gray-500 mb-4">Find skilled professionals for your projects</p>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#003160]"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredServices.length === 0 ? (
              <div className="bg-white p-6 rounded-lg shadow-sm text-center">
                <Briefcase size={40} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500">No services found matching your criteria</p>
              </div>
            ) : (
              filteredServices.map((service) => (
                <div 
                  key={service.id} 
                  className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 animate-scale-in cursor-pointer"
                  onClick={() => navigate(`/service/${service.id}`)}
                >
                  <div className="p-4">
                    {/* Header with Status */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center">
                        <div className={`w-12 h-12 rounded-full bg-blue-200 flex items-center justify-center mr-3`}>
                          <UserCog className="text-gray-700" />
                        </div>
                        <div>
                          <h3 className="font-bold">Freelancer</h3>
                          <p className="text-sm text-gray-500">{service.title}</p>
                        </div>
                      </div>
                      <div className="bg-green-100 text-green-800 py-1 px-2 rounded-full text-xs">
                        Available Now
                      </div>
                    </div>
                    
                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {service.description}
                    </p>
                    
                    {/* Details */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-gray-50 p-2 rounded-lg">
                        <div className="text-xs text-gray-500">Price</div>
                        <div className="font-bold">{formatPrice(service.price)}</div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded-lg">
                        <div className="text-xs text-gray-500">Delivery Time</div>
                        <div className="font-medium">{service.delivery_time}</div>
                      </div>
                    </div>
                    
                    {/* Category tag */}
                    <div className="flex mb-3">
                      <span className="bg-gray-100 text-gray-700 text-xs py-1 px-2 rounded-full">
                        {service.category}
                      </span>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex space-x-2">
                      <button 
                        className="bg-[#003160] text-white py-2 px-4 rounded-lg text-sm flex-1 flex items-center justify-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContactFreelancer(service);
                        }}
                      >
                        <MessageSquare size={16} className="mr-1" />
                        Contact
                      </button>
                      <button 
                        className="border border-gray-300 py-2 px-4 rounded-lg text-sm flex items-center justify-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveService(service);
                        }}
                      >
                        <Heart size={16} className="mr-1" />
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
      
      {/* Contact Dialog */}
      <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Contact Freelancer</DialogTitle>
            <DialogDescription>
              Send a message to discuss your project with this freelancer.
            </DialogDescription>
          </DialogHeader>
          
          {selectedService && (
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 mr-2 flex items-center justify-center">
                  <UserCog size={16} />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Freelancer</h4>
                  <p className="text-xs text-gray-500">{selectedService.title}</p>
                </div>
              </div>
              <div className="text-xs bg-gray-50 p-2 rounded-md">
                <div className="font-medium mb-1">Service Details:</div>
                <p>{selectedService.description}</p>
                <div className="mt-1 font-medium">Price: {formatPrice(selectedService.price)}</div>
              </div>
            </div>
          )}
          
          <Textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Hi, I'm interested in your service. I need help with..."
            className="min-h-24"
          />
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={isSending}>
                Cancel
              </Button>
            </DialogClose>
            <Button 
              onClick={handleSendMessage} 
              className="bg-[#003160] hover:bg-[#002040]"
              disabled={isSending || !messageText.trim()}
            >
              {isSending ? 'Sending...' : 'Send Message'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuickHire;
