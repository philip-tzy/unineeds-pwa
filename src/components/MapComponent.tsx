
import React, { useEffect, useRef, useState } from 'react';
import { Navigation } from 'lucide-react';
import type { Order } from '@/types/unimove';

interface MapComponentProps {
  order?: Order | null;
  isDriver?: boolean;
}

const MapComponent: React.FC<MapComponentProps> = ({ order, isDriver = false }) => {
  const [driverPosition, setDriverPosition] = useState<[number, number] | null>(null);
  const moveIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    // Simulate driver movement when an order is active
    if (order && (order.status === 'accepted' || order.status === 'in_progress')) {
      if (!driverPosition && order.pickup_coordinates) {
        // Start slightly away from pickup for driver
        const initialPos: [number, number] = isDriver
          ? [order.pickup_coordinates[0] - 0.005, order.pickup_coordinates[1] - 0.005]
          : order.pickup_coordinates;
          
        setDriverPosition(initialPos);
      }
      
      const target = order.status === 'accepted' 
        ? order.pickup_coordinates 
        : order.delivery_coordinates;
      
      if (target && driverPosition) {
        if (moveIntervalRef.current) {
          window.clearInterval(moveIntervalRef.current);
        }
        
        moveIntervalRef.current = window.setInterval(() => {
          setDriverPosition(current => {
            if (!current || !target) return current;
            
            // Simple linear interpolation toward target
            const dx = target[0] - current[0];
            const dy = target[1] - current[1];
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // If close enough to target, stop movement
            if (distance < 0.0005) {
              if (moveIntervalRef.current) {
                window.clearInterval(moveIntervalRef.current);
                moveIntervalRef.current = null;
              }
              return target;
            }
            
            // Move toward target
            const step = 0.0002;
            const ratio = step / distance;
            return [
              current[0] + dx * ratio,
              current[1] + dy * ratio
            ];
          });
        }, 500);
      }
    } else {
      // Clear interval and reset when order is completed or cancelled
      if (moveIntervalRef.current) {
        window.clearInterval(moveIntervalRef.current);
        moveIntervalRef.current = null;
      }
      
      if (!order || order.status === 'completed' || order.status === 'cancelled') {
        setDriverPosition(null);
      }
    }
    
    return () => {
      if (moveIntervalRef.current) {
        window.clearInterval(moveIntervalRef.current);
      }
    };
  }, [order, isDriver, driverPosition]);

  return (
    <div className="h-[35vh] bg-gray-200 relative overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center text-gray-400">
        <Navigation size={48} />
      </div>
      
      {/* Simulated map elements */}
      {order && (
        <>
          {/* Pickup point */}
          {order.pickup_coordinates && (
            <div 
              className="absolute w-3 h-3 bg-green-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 z-10"
              style={{ 
                left: `${((order.pickup_coordinates[0] + 122.5) * 500) % 100}%`, 
                top: `${((order.pickup_coordinates[1] - 37.7) * 500) % 100}%` 
              }}
            />
          )}
          
          {/* Destination point */}
          {order.delivery_coordinates && (
            <div 
              className="absolute w-3 h-3 bg-red-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 z-10"
              style={{ 
                left: `${((order.delivery_coordinates[0] + 122.5) * 500) % 100}%`, 
                top: `${((order.delivery_coordinates[1] - 37.7) * 500) % 100}%` 
              }}
            />
          )}
          
          {/* Driver position */}
          {driverPosition && (
            <div 
              className="absolute w-4 h-4 bg-blue-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center"
              style={{ 
                left: `${((driverPosition[0] + 122.5) * 500) % 100}%`, 
                top: `${((driverPosition[1] - 37.7) * 500) % 100}%` 
              }}
            >
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          )}
          
          {/* Path line */}
          {(order.pickup_coordinates && order.delivery_coordinates) && (
            <svg className="absolute inset-0 w-full h-full">
              <line 
                x1={`${((order.pickup_coordinates[0] + 122.5) * 500) % 100}%`} 
                y1={`${((order.pickup_coordinates[1] - 37.7) * 500) % 100}%`}
                x2={`${((order.delivery_coordinates[0] + 122.5) * 500) % 100}%`} 
                y2={`${((order.delivery_coordinates[1] - 37.7) * 500) % 100}%`}
                stroke="#6B7280" 
                strokeWidth="2" 
                strokeDasharray="5,5"
              />
            </svg>
          )}
        </>
      )}
    </div>
  );
};

export default MapComponent;
