import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Navigation } from 'lucide-react';
import type { Order } from '@/types/unimove';

// Fix for Leaflet marker icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Set default icon
const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom icons for different points
const pickupIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const destinationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const driverIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to recenter map when coordinates change
function SetViewOnChange({ coords }: { coords: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (coords && coords[0] !== undefined && coords[1] !== undefined) {
      map.setView(coords, 13);
    }
  }, [coords, map]);
  return null;
}

// Validate if coordinates are valid
function isValidCoords(coords: any): coords is [number, number] {
  return Array.isArray(coords) && 
         coords.length === 2 && 
         typeof coords[0] === 'number' && 
         typeof coords[1] === 'number' &&
         !isNaN(coords[0]) && 
         !isNaN(coords[1]);
}

interface MapComponentProps {
  order?: Order | null;
  isDriver?: boolean;
  onLocationSelect?: (coords: [number, number]) => void;
}

const MapComponent: React.FC<MapComponentProps> = ({ 
  order, 
  isDriver = false,
  onLocationSelect
}) => {
  const [driverPosition, setDriverPosition] = useState<[number, number] | null>(null);
  const [route, setRoute] = useState<[number, number][]>([]);
  const [routeInfo, setRouteInfo] = useState<{ distance: number, duration: number } | null>(null);
  const moveIntervalRef = useRef<number | null>(null);
  
  // Default center in Indonesia (Jakarta)
  const defaultCenter: [number, number] = [-6.2088, 106.8456];

  // Extract valid coordinates from order
  const pickupCoords = order?.pickup_coordinates && isValidCoords(order.pickup_coordinates) 
    ? order.pickup_coordinates 
    : null;
    
  const deliveryCoords = order?.delivery_coordinates && isValidCoords(order.delivery_coordinates) 
    ? order.delivery_coordinates 
    : null;
  
  // Function to get route from OSRM
  const fetchRoute = async (startCoords: [number, number], endCoords: [number, number]) => {
    if (!isValidCoords(startCoords) || !isValidCoords(endCoords)) {
      console.error('Invalid coordinates for route');
      return [];
    }
    
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${startCoords[1]},${startCoords[0]};${endCoords[1]},${endCoords[0]}?overview=full&geometries=geojson`
      );
      const data = await response.json();
      
      if (data.code === 'Ok' && data.routes.length > 0) {
        const routeCoords = data.routes[0].geometry.coordinates.map(
          (coord: [number, number]) => [coord[1], coord[0]] as [number, number]
        );
        setRoute(routeCoords);
        
        // Set route info
        const distanceKm = (data.routes[0].distance / 1000).toFixed(1);
        const durationMin = Math.round(data.routes[0].duration / 60);
        setRouteInfo({
          distance: parseFloat(distanceKm),
          duration: durationMin
        });
        
        return routeCoords;
      }
      return [];
    } catch (error) {
      console.error('Error fetching route:', error);
      return [];
    }
  };
  
  // Simulate driver movement along the route
  useEffect(() => {
    if (!order) return;
    
    // Fetch route if we have valid coordinates
    if (pickupCoords && deliveryCoords) {
      fetchRoute(pickupCoords, deliveryCoords);
    }
    
    // Simulate driver movement when an order is active
    if (order && (order.status === 'accepted' || order.status === 'in_progress') && pickupCoords) {
      if (!driverPosition) {
        // Start slightly away from pickup for driver
        const initialPos: [number, number] = isDriver
          ? [pickupCoords[0] - 0.005, pickupCoords[1] - 0.005]
          : pickupCoords;
          
        setDriverPosition(initialPos);
      }
      
      // Follow route if available, otherwise move directly
      if (route.length > 0 && driverPosition && isValidCoords(driverPosition)) {
        let routeIndex = 0;
        
        // Find closest point on route to current driver position
        let minDistance = Infinity;
        for (let i = 0; i < route.length; i++) {
          const dist = L.latLng(driverPosition).distanceTo(L.latLng(route[i]));
          if (dist < minDistance) {
            minDistance = dist;
            routeIndex = i;
          }
        }
        
        if (moveIntervalRef.current) {
          window.clearInterval(moveIntervalRef.current);
        }
        
        moveIntervalRef.current = window.setInterval(() => {
          setDriverPosition(current => {
            if (!current || !isValidCoords(current)) return current;
            
            routeIndex++;
            
            // If reached end of route
            if (routeIndex >= route.length) {
              if (moveIntervalRef.current) {
                window.clearInterval(moveIntervalRef.current);
                moveIntervalRef.current = null;
              }
              return route[route.length - 1];
            }
            
            return route[routeIndex];
          });
        }, 1000);
      }
    } else {
      // Clear interval and reset when order is completed or cancelled
      if (moveIntervalRef.current) {
        window.clearInterval(moveIntervalRef.current);
        moveIntervalRef.current = null;
      }
      
      if (!order || order.status === 'completed' || order.status === 'cancelled') {
        setDriverPosition(null);
        setRoute([]);
        setRouteInfo(null);
      }
    }
    
    return () => {
      if (moveIntervalRef.current) {
        window.clearInterval(moveIntervalRef.current);
      }
    };
  }, [order, isDriver, driverPosition, route, pickupCoords, deliveryCoords]);
  
  // Handle map click for location selection
  const handleMapClick = (e: L.LeafletMouseEvent) => {
    if (onLocationSelect) {
      onLocationSelect([e.latlng.lat, e.latlng.lng]);
    }
  };

  // Determine which center coordinates to use (ensure they are valid)
  const mapCenter = isValidCoords(driverPosition) ? driverPosition : 
                   (pickupCoords ? pickupCoords : defaultCenter);

  return (
    <div className="h-[35vh] relative overflow-hidden border border-gray-300">
      {/* Fallback if map can't load */}
      {!order && !isDriver && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
          <Navigation size={48} />
        </div>
      )}
      
      <MapContainer 
        center={mapCenter}
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
        whenCreated={(map) => {
          if (onLocationSelect) {
            map.on('click', handleMapClick);
          }
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Set view to relevant position if coordinates are valid */}
        {isValidCoords(driverPosition) && <SetViewOnChange coords={driverPosition} />}
        {!driverPosition && pickupCoords && <SetViewOnChange coords={pickupCoords} />}
        
        {/* Pickup marker - only render if coordinates are valid */}
        {pickupCoords && (
          <Marker position={pickupCoords} icon={pickupIcon}>
            <Popup>
              Pickup Location<br/>
              {order?.pickup_address}
            </Popup>
          </Marker>
        )}
        
        {/* Destination marker - only render if coordinates are valid */}
        {deliveryCoords && (
          <Marker position={deliveryCoords} icon={destinationIcon}>
            <Popup>
              Destination<br/>
              {order?.delivery_address}
            </Popup>
          </Marker>
        )}
        
        {/* Driver position - only render if coordinates are valid */}
        {isValidCoords(driverPosition) && (
          <Marker position={driverPosition} icon={driverIcon}>
            <Popup>
              Driver location
            </Popup>
          </Marker>
        )}
        
        {/* Route polyline - only render if route has valid points */}
        {route.length > 0 && (
          <Polyline 
            positions={route}
            color="#3B82F6"
            weight={4}
            opacity={0.7}
          />
        )}
      </MapContainer>
      
      {/* Route info display */}
      {routeInfo && (
        <div className="absolute bottom-2 right-2 bg-white p-2 rounded shadow z-[1000]">
          <div className="text-xs font-medium">Distance: {routeInfo.distance} km</div>
          <div className="text-xs font-medium">Duration: {routeInfo.duration} min</div>
        </div>
      )}
    </div>
  );
};

export default MapComponent;
