import React, { useRef, useEffect } from 'react';

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

  useEffect(() => {
    // Check if the Google Maps script is loaded and if the input element is available
    if (window.google && window.google.maps && inputRef.current && !autocompleteRef.current) {
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        fields: ["formatted_address", "geometry"],
        types: ["address"],
        componentRestrictions: { country: "do" } // Restrict to Dominican Republic
      });
      autocompleteRef.current = autocomplete;

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place && place.geometry) {
          onPlaceSelected({
            address: place.formatted_address || '',
            latitude: place.geometry.location.lat(),
            longitude: place.geometry.location.lng(),
          });
        }
      });
    }

    // Basic cleanup
    return () => {
      if (window.google && window.google.maps && inputRef.current) {
        // The pac-container is notoriously hard to clean up in React.
        // Clearing listeners is a safe minimum.
        window.google.maps.event.clearInstanceListeners(inputRef.current);
      }
    };
  }, [onPlaceSelected]);

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
