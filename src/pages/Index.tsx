import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Bike, 
  Coffee, 
  ShoppingBag, 
  Headphones,
  Send,
  ChevronRight,
} from 'lucide-react';
import ServiceCard from '@/components/ServiceCard';
import PromoCard from '@/components/PromoCard';
import BottomNavigation from '@/components/BottomNavigation';

const Index: React.FC = () => {
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  
  React.useEffect(() => {
    let lastScrollY = window.scrollY;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsHeaderVisible(false);
      } else {
        setIsHeaderVisible(true);
      }
      lastScrollY = currentScrollY;
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className={`sticky top-0 z-40 transition-transform duration-300 ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="flex items-center justify-center py-4 px-4 bg-white shadow-sm">
          <h1 className="text-2xl font-bold">
            <span className="text-uniblue">Uni</span>
            <span className="text-unired">Needs</span>
          </h1>
        </div>
      </header>

      <main className="container px-4 pb-8 animate-fade-in">
        {/* Special Offer Banner */}
        <div className="mt-4 mb-5 bg-unired rounded-xl p-4 text-white text-center animate-scale-in">
          <h2 className="text-xl font-bold">Special Offer 30% Off</h2>
        </div>

        {/* Services Section */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-3">Our Services</h2>
          <div className="grid grid-cols-2 gap-4">
            <ServiceCard 
              title="UniMove" 
              icon={<Bike size={28} />} 
              to="/unimove" 
            />
            <ServiceCard 
              title="UniFood" 
              icon={<Coffee size={28} />} 
              to="/unifood" 
            />
            <ServiceCard 
              title="UniShop" 
              icon={<ShoppingBag size={28} />} 
              to="/unishop" 
            />
            <ServiceCard 
              title="QuickHire" 
              icon={<Headphones size={28} />} 
              to="/quickhire" 
            />
            <ServiceCard
              title="UniSend"
              icon={<Send size={28} />}
              to="/unisend"
              className="col-span-2"
            />
          </div>
        </div>

        {/* UniMove Deals Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">UniMove Deals</h2>
            <Link to="/unimove" className="text-uniblue text-sm font-medium flex items-center">
              See All <ChevronRight size={16} />
            </Link>
          </div>
          
          <div className="flex overflow-x-auto gap-3 pb-2 -mx-1 px-1">
            <PromoCard 
              title="Ride Discount" 
              badge="SAVE 30%" 
              colorClass="bg-uniblue" 
              description="30% OFF Your Next Ride" 
            />
            <PromoCard 
              title="First Delivery" 
              badge="FREE" 
              colorClass="bg-uniblue-dark" 
              description="Free Delivery for New Users" 
            />
            <PromoCard 
              title="Weekend Special" 
              badge="SAVE 25%" 
              colorClass="bg-uniblue" 
              description="Weekend Special 25% Off" 
            />
          </div>
        </div>

        {/* UniFood Deals Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">UniFood Deals</h2>
            <Link to="/unifood" className="text-uniblue text-sm font-medium flex items-center">
              See All <ChevronRight size={16} />
            </Link>
          </div>
          
          <div className="flex overflow-x-auto gap-3 pb-2 -mx-1 px-1">
            <PromoCard 
              title="Free Coffee" 
              badge="FREE" 
              colorClass="bg-uniblue-dark" 
              description="With Any Breakfast Order" 
            />
            <PromoCard 
              title="Lunch Special" 
              badge="SAVE 20%" 
              colorClass="bg-uniblue" 
              description="20% OFF Between 11am-2pm" 
            />
            <PromoCard 
              title="Dinner Bundle" 
              badge="DEAL" 
              colorClass="bg-uniblue-dark" 
              description="2 Meals for $15" 
            />
          </div>
        </div>

        {/* UniShop Deals Section - ADDED */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">UniShop Deals</h2>
            <Link to="/unishop" className="text-uniblue text-sm font-medium flex items-center">
              See All <ChevronRight size={16} />
            </Link>
          </div>
          
          <div className="flex overflow-x-auto gap-3 pb-2 -mx-1 px-1">
            <PromoCard 
              title="Campus Essentials" 
              badge="SAVE 15%" 
              colorClass="bg-uniblue" 
              description="Stationery & Study Items" 
            />
            <PromoCard 
              title="Tech Gadgets" 
              badge="FLASH SALE" 
              colorClass="bg-unired" 
              description="Limited Time Offers" 
            />
            <PromoCard 
              title="Dorm Furniture" 
              badge="CLEARANCE" 
              colorClass="bg-uniblue-dark" 
              description="Up to 40% Off Selected Items" 
            />
          </div>
        </div>

        {/* QuickHire Deals Section - ADDED */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">QuickHire Services</h2>
            <Link to="/quickhire" className="text-uniblue text-sm font-medium flex items-center">
              See All <ChevronRight size={16} />
            </Link>
          </div>
          
          <div className="flex overflow-x-auto gap-3 pb-2 -mx-1 px-1">
            <PromoCard 
              title="Web Development" 
              badge="TOP RATED" 
              colorClass="bg-uniblue" 
              description="Expert Web Developers" 
            />
            <PromoCard 
              title="Graphic Design" 
              badge="TRENDING" 
              colorClass="bg-unired" 
              description="Professional Design Services" 
            />
            <PromoCard 
              title="Content Writing" 
              badge="POPULAR" 
              colorClass="bg-uniblue-dark" 
              description="High-Quality Content Writers" 
            />
          </div>
        </div>

        {/* UniSend Deals Section - ADDED */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">UniSend Deals</h2>
            <Link to="/unisend" className="text-uniblue text-sm font-medium flex items-center">
              See All <ChevronRight size={16} />
            </Link>
          </div>
          
          <div className="flex overflow-x-auto gap-3 pb-2 -mx-1 px-1">
            <PromoCard 
              title="Same-Day Delivery" 
              badge="EXPRESS" 
              colorClass="bg-unired" 
              description="Fast Delivery Guarantee" 
            />
            <PromoCard 
              title="Document Delivery" 
              badge="STUDENT PRICE" 
              colorClass="bg-uniblue" 
              description="50% Off for Students" 
            />
            <PromoCard 
              title="Package Service" 
              badge="NEW" 
              colorClass="bg-uniblue-dark" 
              description="Secure & Tracked Shipping" 
            />
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default Index;
