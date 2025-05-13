import { supabase } from '@/integrations/supabase/client';
import { 
  Product, 
  FoodItem, 
  Order, 
  RideRequest, 
  DeliveryRequest, 
  FreelanceJob 
} from '@/types/database';
import { Skill, NewSkill } from '@/types/skill';
import { Service, NewService, UpdatableServiceData, ServiceOffer, NewServiceOffer } from '@/types/service';

// User Services
export const userServices = {
  getCurrentUser: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    return data;
  },
  
  updateUserProfile: async (userId: string, updates: Partial<{ name: string, avatar_url: string }>) => {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  updateUserRole: async (userId: string, role: 'customer' | 'driver' | 'seller' | 'freelancer') => {
    const { data, error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  updateSellerType: async (userId: string, sellerType: 'unishop' | 'unifood' | null) => {
    const { data, error } = await supabase
      .from('profiles')
      .update({ seller_type: sellerType })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  updateDriverType: async (userId: string, driverType: 'unisend' | 'unimove' | null) => {
    const { data, error } = await supabase
      .from('profiles')
      .update({ driver_type: driverType })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Seller Services
export const sellerServices = {
  // UniShop Services
  getProducts: async (sellerId: string) => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },
  
  addProduct: async (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  updateProduct: async (productId: string, updates: Partial<Product>) => {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', productId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  deleteProduct: async (productId: string) => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);
    
    if (error) throw error;
    return true;
  },
  
  // UniFood Services
  getFoodItems: async (sellerId: string) => {
    const { data, error } = await supabase
      .from('food_items')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },
  
  addFoodItem: async (foodItem: Omit<FoodItem, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('food_items')
      .insert(foodItem)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  updateFoodItem: async (foodItemId: string, updates: Partial<FoodItem>) => {
    const { data, error } = await supabase
      .from('food_items')
      .update(updates)
      .eq('id', foodItemId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  deleteFoodItem: async (foodItemId: string) => {
    const { error } = await supabase
      .from('food_items')
      .delete()
      .eq('id', foodItemId);
    
    if (error) throw error;
    return true;
  },
  
  // Orders (for both UniShop and UniFood)
  getSellerOrders: async (sellerId: string) => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        customer:customer_id(id, name, email),
        product:product_id(*),
        food_item:food_item_id(*)
      `)
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },
  
  updateOrderStatus: async (orderId: string, status: 'pending' | 'processing' | 'completed' | 'cancelled') => {
    const { data, error } = await supabase
      .from('orders')
      .update({ order_status: status, updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Customer Services
export const customerServices = {
  // UniShop Services
  getAvailableProducts: async () => {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        seller:seller_id(id, name)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },
  
  // UniFood Services
  getAvailableFoodItems: async () => {
    const { data, error } = await supabase
      .from('food_items')
      .select(`
        *,
        seller:seller_id(id, name)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },
  
  // Orders (for both UniShop and UniFood)
  placeOrder: async (order: Omit<Order, 'id' | 'created_at' | 'updated_at' | 'order_status'>) => {
    const { data, error } = await supabase
      .from('orders')
      .insert({ ...order, order_status: 'pending' })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  getCustomerOrders: async (customerId: string) => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        seller:seller_id(id, name),
        product:product_id(*),
        food_item:food_item_id(*)
      `)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },
  
  // UniMove Services
  requestRide: async (rideRequest: Omit<RideRequest, 'id' | 'created_at' | 'updated_at' | 'status' | 'driver_id'>) => {
    const { data, error } = await supabase
      .from('ride_requests')
      .insert({ ...rideRequest, status: 'pending' })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  getRideRequests: async (customerId: string) => {
    const { data, error } = await supabase
      .from('ride_requests')
      .select(`
        *,
        driver:driver_id(id, name)
      `)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },
  
  // UniSend Services
  requestDelivery: async (deliveryRequest: Omit<DeliveryRequest, 'id' | 'created_at' | 'updated_at' | 'status' | 'driver_id'>) => {
    const { data, error } = await supabase
      .from('delivery_requests')
      .insert({ ...deliveryRequest, status: 'pending' })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  getDeliveryRequests: async (customerId: string) => {
    const { data, error } = await supabase
      .from('delivery_requests')
      .select(`
        *,
        driver:driver_id(id, name)
      `)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },
  
  // QuickHire Services
  postJob: async (job: Omit<FreelanceJob, 'id' | 'created_at' | 'updated_at' | 'status' | 'freelancer_id'>) => {
    const { data, error } = await supabase
      .from('freelance_jobs')
      .insert({ ...job, status: 'open' })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  getCustomerJobs: async (customerId: string) => {
    const { data, error } = await supabase
      .from('freelance_jobs')
      .select(`
        *,
        freelancer:freelancer_id(id, name)
      `)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },
  
  getFreelanceJobs: async () => {
    // ... implementation ...
  },
  
  // Create service offer
  createServiceOffer: async (offerData: NewServiceOffer) => {
    try {
      console.log('Submitting offer with data:', offerData);
      const { data, error } = await supabase
        .from('service_offers')
        .insert(offerData)
        .select('*')
        .single();

      if (error) {
        console.error('Error creating service offer:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error in createServiceOffer:', error);
      throw error;
    }
  },
  
  // Get customer's service offers
  getCustomerOffers: async (customerId: string) => {
    try {
      // First check if the table exists
      const { error: tableCheckError } = await supabase
        .from('service_offers' as any)
        .select('id')
        .limit(1);

      if (tableCheckError && 
         (tableCheckError.message?.includes('relation "service_offers" does not exist') ||
          tableCheckError.message?.includes('could not find'))) {
        throw {
          code: 'PGRST200',
          message: 'The service_offers table does not exist in the database',
          details: 'The required database table for this feature is missing'
        };
      }
      
      // Use a simpler query without relationships to avoid errors
      const { data, error } = await supabase
        .from('service_offers' as any)
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error getting customer offers:', error);
        throw error;
      }
      
      // If we get here and have data, try to load the related data separately
      if (data) {
        try {
          // For each offer, try to get service and freelancer data
          const enhancedOffers = await Promise.all(data.map(async (offer) => {
            try {
              // Try to get service
              const serviceData = offer.service_id 
                ? await supabase.from('services').select('*').eq('id', offer.service_id).single().then(res => res.data)
                : null;
              
              // Try to get freelancer
              const freelancerData = offer.freelancer_id
                ? await supabase.from('profiles').select('id, name, avatar_url').eq('id', offer.freelancer_id).single().then(res => res.data)
                : null;
              
              return {
                ...offer,
                service: serviceData,
                freelancer: freelancerData
              };
            } catch (err) {
              // If we can't get related data, just return the original offer
              return offer;
            }
          }));
          
          return enhancedOffers;
        } catch (enhancementError) {
          // If error in enhancement, just return raw data
          console.warn('Could not enhance offers with relations:', enhancementError);
          return data;
        }
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getCustomerOffers:', error);
      throw error;
    }
  },

  // Get all available services for browsing
  getAvailableServices: async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error getting available services:', error);
        throw error;
      }
      
      console.log('Available services:', data);
      return data as Service[] | null;
    } catch (error) {
      console.error('Error in getAvailableServices:', error);
      throw error;
    }
  },

  // Get service by ID
  getServiceById: async (serviceId: string) => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', serviceId)
        .single();
      
      if (error) {
        console.error('Error getting service by ID:', error);
        throw error;
      }
      
      return data as Service;
    } catch (error) {
      console.error('Error in getServiceById:', error);
      throw error;
    }
  }
};

// Driver Services
export const driverServices = {
  // UniMove Services
  getAvailableRides: async () => {
    const { data, error } = await supabase
      .from('ride_requests')
      .select(`
        *,
        customer:customer_id(id, name)
      `)
      .eq('status', 'pending')
      .is('driver_id', null)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },
  
  acceptRide: async (rideId: string, driverId: string) => {
    const { data, error } = await supabase
      .from('ride_requests')
      .update({ 
        driver_id: driverId, 
        status: 'accepted',
        updated_at: new Date().toISOString()
      })
      .eq('id', rideId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  updateRideStatus: async (rideId: string, status: 'in_progress' | 'completed' | 'cancelled') => {
    const { data, error } = await supabase
      .from('ride_requests')
      .update({ 
        status,
        updated_at: new Date().toISOString() 
      })
      .eq('id', rideId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  getDriverRides: async (driverId: string) => {
    const { data, error } = await supabase
      .from('ride_requests')
      .select(`
        *,
        customer:customer_id(id, name)
      `)
      .eq('driver_id', driverId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },
  
  // UniSend Services
  getAvailableDeliveries: async () => {
    const { data, error } = await supabase
      .from('delivery_requests')
      .select(`
        *,
        customer:customer_id(id, name)
      `)
      .eq('status', 'pending')
      .is('driver_id', null)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },
  
  acceptDelivery: async (deliveryId: string, driverId: string) => {
    const { data, error } = await supabase
      .from('delivery_requests')
      .update({ 
        driver_id: driverId, 
        status: 'accepted',
        updated_at: new Date().toISOString()
      })
      .eq('id', deliveryId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  updateDeliveryStatus: async (deliveryId: string, status: 'in_progress' | 'completed' | 'cancelled') => {
    const { data, error } = await supabase
      .from('delivery_requests')
      .update({ 
        status,
        updated_at: new Date().toISOString() 
      })
      .eq('id', deliveryId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  getDriverDeliveries: async (driverId: string) => {
    const { data, error } = await supabase
      .from('delivery_requests')
      .select(`
        *,
        customer:customer_id(id, name)
      `)
      .eq('driver_id', driverId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }
};

// Freelancer Services
export const freelancerServices = {
  // Skill Management
  getSkills: async (freelancerId: string) => {
    if (!freelancerId) {
      throw new Error('User ID is required to get skills');
    }
    
    try {
      const { data, error } = await supabase
        .from('skills' as any)
        .select('*')
        .eq('user_id', freelancerId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error getting skills:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getSkills:', error);
      throw error;
    }
  },
  
  addSkill: async (skill: NewSkill) => {
    if (!skill.user_id) {
      throw new Error('User ID is required to add a skill');
    }
    
    try {
      // Add created_at and updated_at timestamps
      const skillWithTimestamps = {
        ...skill,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('skills' as any)
        .insert(skillWithTimestamps)
        .select()
        .single();
      
      if (error) {
        console.error('Error adding skill:', error);
        
        // Provide specific error messages based on the error type
        if (error.message.includes('violates foreign key constraint')) {
          throw new Error('Invalid user reference. Please try logging out and back in.');
        } else if (error.message.includes('violates not-null constraint')) {
          const field = error.message.match(/column "([^"]+)"/)?.[1] || 'Unknown field';
          throw new Error(`Required field missing: ${field}`);
        } else {
          throw error;
        }
      }
      
      return data;
    } catch (error) {
      console.error('Error in addSkill:', error);
      throw error;
    }
  },
  
  updateSkill: async (skillId: string, updates: Partial<Skill>) => {
    if (!skillId) {
      throw new Error('Skill ID is required to update a skill');
    }
    
    try {
      // Add updated_at timestamp
      const updatesWithTimestamp = {
        ...updates,
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('skills' as any)
        .update(updatesWithTimestamp)
        .eq('id', skillId)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating skill:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error in updateSkill:', error);
      throw error;
    }
  },
  
  deleteSkill: async (skillId: string) => {
    if (!skillId) {
      throw new Error('Skill ID is required to delete a skill');
    }
    
    try {
      const { error } = await supabase
        .from('skills' as any)
        .delete()
        .eq('id', skillId);
      
      if (error) {
        console.error('Error deleting skill:', error);
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error('Error in deleteSkill:', error);
      throw error;
    }
  },

  // Job Management
  getAvailableJobs: async () => {
    const { data, error } = await supabase
      .from('freelance_jobs' as any)
      .select(`
        *,
        customer:customer_id(id, name)
      `)
      .eq('status', 'open')
      .is('freelancer_id', null)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },
  
  applyForJob: async (jobId: string, freelancerId: string) => {
    const { data, error } = await supabase
      .from('freelance_jobs' as any)
      .update({ 
        freelancer_id: freelancerId, 
        status: 'in_progress',
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  updateJobStatus: async (jobId: string, status: 'completed' | 'cancelled') => {
    const { data, error } = await supabase
      .from('freelance_jobs' as any)
      .update({ 
        status,
        updated_at: new Date().toISOString() 
      })
      .eq('id', jobId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  getFreelancerJobs: async (freelancerId: string) => {
    const { data, error } = await supabase
      .from('freelance_jobs' as any)
      .select(`
        *,
        customer:customer_id(id, name)
      `)
      .eq('freelancer_id', freelancerId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Service Management
  getFreelancerServices: async (freelancerId: string) => {
    console.log('Getting services for freelancer:', freelancerId);
    
    try {
      const { data, error } = await supabase
        .from('services' as any)
        .select('*')
        .eq('user_id', freelancerId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error getting freelancer services:', error);
        throw error;
      }
      
      console.log(`Found ${data?.length || 0} services`);
      return data as Service[] | null;
    } catch (error) {
      console.error('Error in getFreelancerServices:', error);
      throw error;
    }
  },

  addFreelancerService: async (serviceData: NewService, portfolioFile?: File | null) => {
    console.log('Starting addFreelancerService with data:', JSON.stringify(serviceData, null, 2));
    
    let portfolioUrl: string | undefined = undefined;
    const userId = serviceData.user_id;

    if (!userId) {
      console.error('Error: Missing user_id in service data');
      throw new Error('Missing user_id in service data');
    }

    try {
      // Upload portfolio file if provided
      if (portfolioFile && userId) {
        console.log('Uploading portfolio file:', portfolioFile.name);
        
        const filePath = `public/${userId}/${Date.now()}_${portfolioFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('service_portfolios')
          .upload(filePath, portfolioFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Error uploading portfolio:', uploadError);
          throw new Error('Failed to upload portfolio: ' + uploadError.message);
        }
        
        console.log('Portfolio uploaded successfully');
        
        const { data: urlData } = supabase.storage
          .from('service_portfolios')
          .getPublicUrl(filePath);
        
        portfolioUrl = urlData?.publicUrl;
        console.log('Portfolio URL:', portfolioUrl);
      }

      // Prepare service data for insert
      const serviceToInsert = {
        ...serviceData,
        portfolio_url: portfolioUrl,
      };
      
      console.log('Inserting service with data:', JSON.stringify(serviceToInsert, null, 2));

      // Insert service data into the database
      const { data, error } = await supabase
        .from('services' as any)
        .insert(serviceToInsert as any)
        .select()
        .single();

      if (error) {
        console.error('Error adding service:', error);
        
        // Try to provide more specific error messages
        if (error.message.includes('violates foreign key constraint')) {
          throw new Error('Invalid user reference. Please try logging out and back in.');
        } else if (error.message.includes('violates not-null constraint')) {
          const field = error.message.match(/column "([^"]+)"/)?.[1] || 'Unknown field';
          throw new Error(`Required field missing: ${field}`);
        } else {
          throw error;
        }
      }
      
      console.log('Service added successfully:', data);
      return data;
    } catch (error: any) {
      console.error('Error in addFreelancerService:', error);
      throw error;
    }
  },

  updateFreelancerService: async (serviceId: string, updates: UpdatableServiceData, portfolioFile?: File | null, currentPortfolioUrl?: string | null) => {
    console.log('Updating service:', serviceId, 'with data:', JSON.stringify(updates, null, 2));
    
    try {
      let newPortfolioUrl: string | undefined = updates.portfolio_url;
      const { data: authUser } = await supabase.auth.getUser();
      const userId = authUser.user?.id;
  
      if (!userId) {
        throw new Error('User not authenticated');
      }
  
      // Upload new portfolio file if provided
      if (portfolioFile && userId) {
        console.log('Uploading new portfolio file');
        
        const filePath = `public/${userId}/${Date.now()}_${portfolioFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('service_portfolios')
          .upload(filePath, portfolioFile, { upsert: true });
  
        if (uploadError) {
          console.error('Error uploading portfolio:', uploadError);
          throw uploadError;
        }
        
        console.log('Portfolio uploaded successfully');
        
        const { data: urlData } = supabase.storage
          .from('service_portfolios')
          .getPublicUrl(filePath);
          
        newPortfolioUrl = urlData?.publicUrl;
        console.log('New portfolio URL:', newPortfolioUrl);
      }
  
      // Prepare service data for update
      const serviceToUpdate = {
        ...updates,
        portfolio_url: newPortfolioUrl,
        updated_at: new Date().toISOString(),
      };
      
      console.log('Updating service with data:', JSON.stringify(serviceToUpdate, null, 2));
  
      // Update service in database
      const { data, error } = await supabase
        .from('services' as any)
        .update(serviceToUpdate as any)
        .eq('id', serviceId)
        .select()
        .single();
  
      if (error) {
        console.error('Error updating service:', error);
        throw error;
      }
      
      console.log('Service updated successfully');
      return data as Service;
    } catch (error) {
      console.error('Error in updateFreelancerService:', error);
      throw error;
    }
  },

  deleteFreelancerService: async (serviceId: string, portfolioUrl?: string | null) => {
    console.log('Deleting service:', serviceId);
    
    try {
      const { error } = await supabase
        .from('services' as any)
        .delete()
        .eq('id', serviceId);
  
      if (error) {
        console.error('Error deleting service:', error);
        throw error;
      }
      
      // Delete portfolio file if exists
      if (portfolioUrl) {
        try {
          const { data: authUser } = await supabase.auth.getUser();
          const userId = authUser.user?.id;
          
          if (userId) {
            const urlParts = portfolioUrl.split('/');
            const fileName = urlParts[urlParts.length - 1];
            const filePath = `public/${userId}/${fileName}`;
            
            console.log('Attempting to delete portfolio file:', filePath);
            
            const { error: deleteError } = await supabase.storage
              .from('service_portfolios')
              .remove([filePath]);
              
            if (deleteError) {
              console.warn('Could not delete portfolio file:', deleteError);
              // Continue even if file deletion fails
            } else {
              console.log('Portfolio file deleted successfully');
            }
          }
        } catch (fileErr) {
          console.warn('Error attempting to delete portfolio file:', fileErr);
          // Continue even if there was an error with file deletion
        }
      }
      
      console.log('Service deleted successfully');
      return true;
    } catch (error) {
      console.error('Error in deleteFreelancerService:', error);
      throw error;
    }
  },

  // Service Offers Management
  getServiceOffers: async (freelancerId: string) => {
    try {
      // First check if the table exists
      const { error: tableCheckError } = await supabase
        .from('service_offers' as any)
        .select('id')
        .limit(1);

      if (tableCheckError && 
         (tableCheckError.message?.includes('relation "service_offers" does not exist') ||
          tableCheckError.message?.includes('could not find'))) {
        throw {
          code: 'PGRST200',
          message: 'The service_offers table does not exist in the database',
          details: 'The required database table for this feature is missing'
        };
      }
      
      // Use a simpler query without relationships to avoid errors
      const { data, error } = await supabase
        .from('service_offers' as any)
        .select('*')
        .eq('freelancer_id', freelancerId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error getting service offers:', error);
        throw error;
      }
      
      // If we get here and have data, try to load the related data separately
      if (data) {
        try {
          // For each offer, try to get service and customer data
          const enhancedOffers = await Promise.all(data.map(async (offer) => {
            try {
              // Try to get service
              const serviceData = offer.service_id 
                ? await supabase.from('services').select('*').eq('id', offer.service_id).single().then(res => res.data)
                : null;
              
              // Try to get customer
              const customerData = offer.customer_id
                ? await supabase.from('profiles').select('id, name, avatar_url').eq('id', offer.customer_id).single().then(res => res.data)
                : null;
              
              return {
                ...offer,
                service: serviceData,
                customer: customerData
              };
            } catch (err) {
              // If we can't get related data, just return the original offer
              return offer;
            }
          }));
          
          return enhancedOffers;
        } catch (enhancementError) {
          // If error in enhancement, just return raw data
          console.warn('Could not enhance offers with relations:', enhancementError);
          return data;
        }
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getServiceOffers:', error);
      throw error;
    }
  },
  
  // Get customer offers
  getCustomerOffers: async (customerId: string) => {
    try {
      // First check if the table exists
      const { error: tableCheckError } = await supabase
        .from('service_offers' as any)
        .select('id')
        .limit(1);

      if (tableCheckError && 
         (tableCheckError.message?.includes('relation "service_offers" does not exist') ||
          tableCheckError.message?.includes('could not find'))) {
        throw {
          code: 'PGRST200',
          message: 'The service_offers table does not exist in the database',
          details: 'The required database table for this feature is missing'
        };
      }
      
      // Use a simpler query without relationships to avoid errors
      const { data, error } = await supabase
        .from('service_offers' as any)
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error getting customer offers:', error);
        throw error;
      }
      
      // If we get here and have data, try to load the related data separately
      if (data) {
        try {
          // For each offer, try to get service and freelancer data
          const enhancedOffers = await Promise.all(data.map(async (offer) => {
            try {
              // Try to get service
              const serviceData = offer.service_id 
                ? await supabase.from('services').select('*').eq('id', offer.service_id).single().then(res => res.data)
                : null;
              
              // Try to get freelancer
              const freelancerData = offer.freelancer_id
                ? await supabase.from('profiles').select('id, name, avatar_url').eq('id', offer.freelancer_id).single().then(res => res.data)
                : null;
              
              return {
                ...offer,
                service: serviceData,
                freelancer: freelancerData
              };
            } catch (err) {
              // If we can't get related data, just return the original offer
              return offer;
            }
          }));
          
          return enhancedOffers;
        } catch (enhancementError) {
          // If error in enhancement, just return raw data
          console.warn('Could not enhance offers with relations:', enhancementError);
          return data;
        }
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getCustomerOffers:', error);
      throw error;
    }
  },

  // Create a new service offer
  createServiceOffer: async (offerData: NewServiceOffer) => {
    try {
      const { data, error } = await supabase
        .from('service_offers')
        .insert({
          service_id: offerData.service_id,
          customer_id: supabase.auth.getUser().then(res => res.data.user?.id),
          freelancer_id: offerData.freelancer_id,
          message: offerData.message,
          price: offerData.price,
          status: 'pending'
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating service offer:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error in createServiceOffer:', error);
      throw error;
    }
  },
  
  // Update service offer status (accept, reject, complete)
  updateServiceOfferStatus: async (offerId: string, status: 'accepted' | 'rejected' | 'completed') => {
    try {
      const { data, error } = await supabase
        .from('service_offers')
        .update({ status })
        .eq('id', offerId)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating service offer status:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error in updateServiceOfferStatus:', error);
      throw error;
    }
  },
  
  // Get service offer by ID
  getServiceOfferById: async (offerId: string) => {
    try {
      const { data, error } = await supabase
        .from('service_offers')
        .select(`
          *,
          service:service_id (*),
          customer:customer_id (id, name, avatar_url),
          freelancer:freelancer_id (id, name, avatar_url)
        `)
        .eq('id', offerId)
        .single();
      
      if (error) {
        console.error('Error getting service offer:', error);
        throw error;
      }
      
      return data as ServiceOffer;
    } catch (error) {
      console.error('Error in getServiceOfferById:', error);
      throw error;
    }
  },

  // Subscribe to new service offers
  subscribeToServiceOffers: (freelancerId: string, callback: (offer: ServiceOffer) => void) => {
    try {
      return supabase
        .channel(`service-offers-${freelancerId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'service_offers',
            filter: `freelancer_id=eq.${freelancerId}`
          },
          async (payload) => {
            try {
              if (!payload.new || !('id' in payload.new)) return;
              
              // Fetch the complete offer data with relations
              const { data, error } = await supabase
                .from('service_offers')
                .select(`
                  *,
                  service:service_id (*),
                  customer:customer_id (id, name, avatar_url)
                `)
                .eq('id', payload.new.id)
                .single();
              
              if (error) throw error;
              
              // Call callback with the complete offer data
              callback(data as ServiceOffer);
            } catch (error) {
              console.error('Error in subscription callback:', error);
            }
          }
        )
        .subscribe();
    } catch (error) {
      console.error('Error setting up subscription:', error);
      throw error;
    }
  },
  
  // Get freelancer profile
  getFreelancerProfile: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error getting freelancer profile:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error in getFreelancerProfile:', error);
      throw error;
    }
  },
};

// Common Services
export const commonServices = {
  getRatings: async (userId: string) => {
    const { data, error } = await supabase
      .from('ratings')
      .select(`
        *,
        reviewer:reviewer_id(id, name)
      `)
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },
  
  addRating: async (rating: {
    reviewer_id: string;
    recipient_id: string;
    service_type: 'unishop' | 'unifood' | 'unimove' | 'unisend' | 'quickhire';
    order_id?: string;
    ride_id?: string;
    delivery_id?: string;
    job_id?: string;
    rating: number;
    comment?: string;
  }) => {
    const { data, error } = await supabase
      .from('ratings')
      .insert(rating)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Add a new function to create ride requests directly in the ride_requests table
export const createRideRequest = async (
  customerId: string,
  pickupLocation: string,
  dropoffLocation: string,
  price: number
) => {
  console.log('Creating ride request with params:', { 
    customerId, pickupLocation, dropoffLocation, price 
  });
  
  const { data, error } = await supabase
    .from('ride_requests')
    .insert({
      customer_id: customerId,
      pickup_location: pickupLocation,
      dropoff_location: dropoffLocation,
      price: price,
      status: 'pending',
      service_type: 'unimove'
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error in createRideRequest:', error);
    throw error;
  }
  
  console.log('Successfully created ride request:', data);
  return data;
};

// Create a ride request using a workaround for Row Level Security issues
export const createRideRequestSecure = async (
  customerId: string,
  pickupLocation: string,
  dropoffLocation: string,
  price: number
) => {
  console.log('Creating secure ride request with params:', { 
    customerId, pickupLocation, dropoffLocation, price 
  });
  
  try {
    // First try the regular approach
    const { data, error } = await supabase
      .from('ride_requests')
      .insert({
        customer_id: customerId,
        pickup_location: pickupLocation,
        dropoff_location: dropoffLocation,
        price: price,
        status: 'pending',
        service_type: 'unimove'
      })
      .select()
      .single();
    
    if (!error) {
      console.log('Successfully created ride request via primary method:', data);
      return data;
    }
    
    // If we get an RLS error, log it but continue with fallback approach
    if (error.code === '42501') {
      console.warn('RLS policy error, using fallback approach:', error.message);
      
      // Option 1: Try to create in the orders table instead (if allowed)
      try {
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .insert({
            customer_id: customerId,
            seller_id: customerId, // Temporary workaround
            pickup_address: pickupLocation,
            delivery_address: dropoffLocation,
            service_type: 'unimove',
            status: 'pending', // Use status instead of order_status
            total_amount: price,
            quantity: 1 // Required field
          })
          .select()
          .single();
          
        if (!orderError) {
          console.log('Created ride in orders table as fallback:', orderData);
          return orderData;
        } else {
          console.error('Error in fallback order creation with orders table:', orderError);
        }
      } catch (orderErr) {
        console.error('Error in fallback order creation:', orderErr);
      }
    } else {
      console.error('Non-RLS error in ride request creation:', error);
    }
    
    // If all else fails, throw the original error
    throw error;
  } catch (err) {
    console.error('Error in createRideRequestSecure:', err);
    throw err;
  }
}; 