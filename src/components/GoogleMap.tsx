import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { supabase } from '@/integrations/supabase/client';

/// <reference types="@types/google.maps" />

interface MapProps {
  height?: string;
  markers?: Array<{
    lat: number;
    lng: number;
    title: string;
    info?: string;
  }>;
  routes?: Array<{
    origin: { lat: number; lng: number };
    destination: { lat: number; lng: number };
    title: string;
    color?: string;
  }>;
  center?: { lat: number; lng: number };
  zoom?: number;
  onMapClick?: (lat: number, lng: number) => void;
  className?: string;
}

const GoogleMap: React.FC<MapProps> = ({
  height = '400px',
  markers = [],
  routes = [],
  center = { lat: 39.8283, lng: -98.5795 }, // Center of USA
  zoom = 4,
  onMapClick,
  className = ''
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null);
  const [directionsRenderers, setDirectionsRenderers] = useState<google.maps.DirectionsRenderer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeMap = async () => {
      try {
        console.log('Starting map initialization...');
        
        // Get Google Maps API key from Supabase Edge Function
        console.log('Fetching Google Maps API key...');
        const { data, error } = await supabase.functions.invoke('get-google-maps-key');
        
        if (error) {
          console.error('Supabase function error:', error);
          throw new Error('Failed to get Google Maps API key');
        }

        if (!data?.apiKey) {
          console.error('No API key in response:', data);
          throw new Error('Google Maps API key not configured');
        }

        console.log('API key retrieved successfully, loading Google Maps...');

        const loader = new Loader({
          apiKey: data.apiKey,
          version: 'weekly',
          libraries: ['places']
        });

        const google = await loader.load();
        console.log('Google Maps API loaded successfully');
        
        if (!mapRef.current) {
          console.error('Map ref is null');
          return;
        }

        console.log('Creating map instance...');
        const mapInstance = new google.maps.Map(mapRef.current, {
          center,
          zoom,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
        });

        console.log('Map instance created successfully');
        setMap(mapInstance);

        // Initialize directions service
        const directionsServiceInstance = new google.maps.DirectionsService();
        setDirectionsService(directionsServiceInstance);

        // Add click listener if provided
        if (onMapClick) {
          mapInstance.addListener('click', (event: google.maps.MapMouseEvent) => {
            if (event.latLng) {
              onMapClick(event.latLng.lat(), event.latLng.lng());
            }
          });
        }

        console.log('Map initialization complete');
        setIsLoading(false);
      } catch (err) {
        console.error('Error initializing map:', err);
        setError(err instanceof Error ? err.message : 'Failed to load map');
        setIsLoading(false);
      }
    };

    initializeMap();
  }, [center.lat, center.lng, zoom, onMapClick]);

  // Update routes when routes prop changes
  useEffect(() => {
    if (!map || !directionsService || typeof google === 'undefined') return;

    // Clear existing route renderers
    directionsRenderers.forEach(renderer => {
      renderer.setMap(null);
    });

    const newRenderers: google.maps.DirectionsRenderer[] = [];

    // Create new routes
    routes.forEach((route, index) => {
      const directionsRenderer = new google.maps.DirectionsRenderer({
        suppressMarkers: false, // Show start/end markers
        polylineOptions: {
          strokeColor: route.color || '#4285F4',
          strokeWeight: 4,
          strokeOpacity: 0.8,
        },
      });

      directionsRenderer.setMap(map);
      newRenderers.push(directionsRenderer);

      // Calculate and display route
      directionsService.route(
        {
          origin: route.origin,
          destination: route.destination,
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            directionsRenderer.setDirections(result);
          } else {
            console.error('Directions request failed due to ' + status);
          }
        }
      );
    });

    setDirectionsRenderers(newRenderers);
  }, [map, directionsService, routes]);

  // Update markers when markers prop changes
  useEffect(() => {
    console.log('GoogleMap markers effect called with:', markers);
    if (!map || typeof google === 'undefined') {
      console.log('Map not ready yet or google undefined');
      return;
    }

    // Clear existing markers
    // Note: In a real app, you'd want to keep track of markers to remove them properly
    
    // Add new markers
    markers.forEach((marker, index) => {
      console.log(`Creating marker ${index}:`, marker);
      const mapMarker = new google.maps.Marker({
        position: { lat: marker.lat, lng: marker.lng },
        map,
        title: marker.title,
      });

      if (marker.info) {
        const infoWindow = new google.maps.InfoWindow({
          content: `<div><h3>${marker.title}</h3><p>${marker.info}</p></div>`,
        });

        mapMarker.addListener('click', () => {
          infoWindow.open(map, mapMarker);
        });
      }
    });
  }, [map, markers]);

  if (isLoading) {
    return (
      <div 
        className="flex items-center justify-center bg-muted rounded-lg"
        style={{ height }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className="flex items-center justify-center bg-muted rounded-lg border-2 border-dashed border-muted-foreground/25"
        style={{ height }}
      >
        <div className="text-center p-4">
          <p className="text-destructive font-medium">Map Error</p>
          <p className="text-muted-foreground text-sm mt-1">{error}</p>
          <p className="text-xs text-muted-foreground mt-2">
            Please configure Google Maps API key in Supabase secrets
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={mapRef} 
      className={`w-full rounded-lg shadow-card border ${className}`}
      style={{ height }}
    />
  );
};

export default GoogleMap;
