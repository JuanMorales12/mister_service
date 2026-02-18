import React, { useRef, useEffect, useCallback } from 'react';

declare global {
  interface Window {
    google: any;
  }
}

interface AddressAutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelected: (details: { address: string; latitude?: number; longitude?: number }) => void;
  required?: boolean;
}

export const AddressAutocompleteInput: React.FC<AddressAutocompleteInputProps> = ({ value, onChange, onPlaceSelected, required }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const onPlaceSelectedRef = useRef(onPlaceSelected);

  // Keep the ref in sync with the latest callback without re-initializing autocomplete
  useEffect(() => {
    onPlaceSelectedRef.current = onPlaceSelected;
  }, [onPlaceSelected]);

  useEffect(() => {
    const initializeAutocomplete = () => {
      if (window.google && window.google.maps && window.google.maps.places && inputRef.current && !autocompleteRef.current) {
        try {
          const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
            fields: ["formatted_address", "geometry", "name"],
            types: ["establishment", "geocode"],
            componentRestrictions: { country: "do" }
          });
          autocompleteRef.current = autocomplete;

          autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (place && place.geometry) {
              onPlaceSelectedRef.current({
                address: place.formatted_address || '',
                latitude: place.geometry.location.lat(),
                longitude: place.geometry.location.lng(),
              });
            }
          });
          return true;
        } catch (error) {
          console.error('Error initializing autocomplete:', error);
          return false;
        }
      }
      return false;
    };

    // Try to initialize immediately
    if (!initializeAutocomplete()) {
      // If it fails, set up an interval to retry until Google Maps is ready
      const checkInterval = setInterval(() => {
        if (initializeAutocomplete()) {
          clearInterval(checkInterval);
        }
      }, 100);

      // Clean up interval after 10 seconds to avoid infinite checking
      const timeout = setTimeout(() => {
        clearInterval(checkInterval);
      }, 10000);

      return () => {
        clearInterval(checkInterval);
        clearTimeout(timeout);
        if (window.google && window.google.maps && inputRef.current) {
          window.google.maps.event.clearInstanceListeners(inputRef.current);
        }
        autocompleteRef.current = null;
      };
    }

    // Basic cleanup on unmount
    return () => {
      if (window.google && window.google.maps && inputRef.current) {
        window.google.maps.event.clearInstanceListeners(inputRef.current);
      }
      autocompleteRef.current = null;
    };
  }, []);

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      className="mt-1 input-style"
      placeholder="Escribe una dirección..."
    />
  );
};
