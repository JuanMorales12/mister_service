import React, { useRef, useEffect, useState, useCallback } from 'react';
import L from 'leaflet';

// Fix default icon paths for Leaflet with module bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

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

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Inject Leaflet CSS from CDN once */
function ensureLeafletCSS() {
  const LEAFLET_CSS_ID = 'leaflet-css-cdn';
  if (!document.getElementById(LEAFLET_CSS_ID)) {
    const link = document.createElement('link');
    link.id = LEAFLET_CSS_ID;
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
    link.crossOrigin = '';
    document.head.appendChild(link);
  }
}

/** Reverse geocode with Nominatim (free, no key) */
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      { headers: { 'Accept-Language': 'es' } }
    );
    const data = await res.json();
    return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  } catch {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
}

/** Try to extract coordinates from a Google Maps URL */
function extractCoordsFromGoogleMapsUrl(text: string): { lat: number; lng: number } | null {
  const trimmed = text.trim();

  // Pattern 1: @lat,lng in full Google Maps URLs
  const atMatch = trimmed.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (atMatch) {
    const lat = parseFloat(atMatch[1]);
    const lng = parseFloat(atMatch[2]);
    if (isFinite(lat) && isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      return { lat, lng };
    }
  }

  // Pattern 2: ?q=lat,lng or &q=lat,lng
  const qMatch = trimmed.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (qMatch) {
    const lat = parseFloat(qMatch[1]);
    const lng = parseFloat(qMatch[2]);
    if (isFinite(lat) && isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      return { lat, lng };
    }
  }

  // Pattern 3: /dir/ or /place/ segments with lat,lng
  const dirMatch = trimmed.match(/\/(dir|place)\/(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (dirMatch) {
    const lat = parseFloat(dirMatch[2]);
    const lng = parseFloat(dirMatch[3]);
    if (isFinite(lat) && isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      return { lat, lng };
    }
  }

  // Pattern 4: ll=lat,lng
  const llMatch = trimmed.match(/ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (llMatch) {
    const lat = parseFloat(llMatch[1]);
    const lng = parseFloat(llMatch[2]);
    if (isFinite(lat) && isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      return { lat, lng };
    }
  }

  // Pattern 5: just two comma-separated numbers (raw lat,lng paste)
  const rawMatch = trimmed.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
  if (rawMatch) {
    const lat = parseFloat(rawMatch[1]);
    const lng = parseFloat(rawMatch[2]);
    if (isFinite(lat) && isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      return { lat, lng };
    }
  }

  return null;
}

/** Check if text looks like a Google Maps URL */
function isGoogleMapsUrl(text: string): boolean {
  const t = text.trim().toLowerCase();
  return (
    t.includes('google.com/maps') ||
    t.includes('google.com.do/maps') ||
    t.includes('maps.google.com') ||
    t.includes('goo.gl/maps') ||
    t.includes('maps.app.goo.gl') ||
    t.includes('maps.app.google')
  );
}

const SUPABASE_URL = 'https://uibnicteyimgorcxasqx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpYm5pY3RleWltZ29yY3hhc3F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMzA2MzUsImV4cCI6MjA4NzgwNjYzNX0.Iwi6-dgq2Zo934B_8F7BLCk12UVOX6D1h0eQ1PUhBCo';

/** For short URLs (goo.gl/maps, maps.app.goo.gl), follow redirect via Supabase Edge Function */
async function resolveShortGoogleMapsUrl(url: string): Promise<{ lat: number; lng: number } | null> {
  const direct = extractCoordsFromGoogleMapsUrl(url);
  if (direct) return direct;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`${SUPABASE_URL}/functions/v1/resolve-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ url }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.finalUrl) {
        return extractCoordsFromGoogleMapsUrl(data.finalUrl);
      }
    }
  } catch {
    // Edge function unavailable - fail gracefully
  }

  return null;
}

// ── Component ────────────────────────────────────────────────────────────────

export const AddressAutocompleteInput: React.FC<AddressAutocompleteInputProps> = ({
  value,
  onChange,
  onPlaceSelected,
  required,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [pasteLoading, setPasteLoading] = useState(false);

  // Stable callback ref to avoid re-creating autocomplete listeners
  const onPlaceSelectedRef = useRef(onPlaceSelected);
  onPlaceSelectedRef.current = onPlaceSelected;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // ── Leaflet CSS injection ──
  useEffect(() => {
    ensureLeafletCSS();
  }, []);

  // ── Update location: map + marker + callbacks ──
  const updateLocation = useCallback(
    async (lat: number, lng: number, address?: string) => {
      const finalAddress = address || (await reverseGeocode(lat, lng));
      setCoords({ lat, lng });
      onChangeRef.current(finalAddress);
      onPlaceSelectedRef.current({
        address: finalAddress,
        latitude: lat,
        longitude: lng,
      });
    },
    []
  );

  // ── Google Places Autocomplete ──
  useEffect(() => {
    if (window.google && window.google.maps && inputRef.current && !autocompleteRef.current) {
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        fields: ['formatted_address', 'geometry'],
        types: ['address'],
        componentRestrictions: { country: 'do' },
      });
      autocompleteRef.current = autocomplete;

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place && place.geometry) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          const address = place.formatted_address || '';
          setCoords({ lat, lng });
          onChangeRef.current(address);
          onPlaceSelectedRef.current({ address, latitude: lat, longitude: lng });
        }
      });
    }

    return () => {
      if (window.google && window.google.maps && inputRef.current) {
        window.google.maps.event.clearInstanceListeners(inputRef.current);
      }
    };
  }, []);

  // ── Leaflet map init / update ──
  useEffect(() => {
    if (!coords) {
      // Destroy map if coords are cleared
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
      return;
    }

    const { lat, lng } = coords;

    if (!mapContainerRef.current) return;

    // Initialize map if needed
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [lat, lng],
        zoom: 16,
        scrollWheelZoom: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      const marker = L.marker([lat, lng], { draggable: true }).addTo(map);

      marker.on('dragend', async () => {
        const pos = marker.getLatLng();
        await updateLocation(pos.lat, pos.lng);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;

      // Fix tiles not loading due to container size changes
      setTimeout(() => map.invalidateSize(), 200);
    } else {
      // Update existing map & marker
      mapInstanceRef.current.setView([lat, lng], mapInstanceRef.current.getZoom());
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      }
      setTimeout(() => mapInstanceRef.current?.invalidateSize(), 100);
    }

    return () => {
      // Cleanup on unmount
    };
  }, [coords, updateLocation]);

  // Full cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  // ── Handle paste: detect Google Maps URLs or raw coords ──
  const handlePaste = useCallback(
    async (e: React.ClipboardEvent<HTMLInputElement>) => {
      const pasted = e.clipboardData.getData('text');
      if (!pasted) return;

      // Check if it looks like a Google Maps URL or raw coordinates
      const directCoords = extractCoordsFromGoogleMapsUrl(pasted);

      if (directCoords) {
        e.preventDefault();
        setPasteLoading(true);
        await updateLocation(directCoords.lat, directCoords.lng);
        setPasteLoading(false);
        return;
      }

      if (isGoogleMapsUrl(pasted)) {
        // It's a Google Maps URL but we couldn't extract coords directly
        // Try resolving short URL via Edge Function
        e.preventDefault();
        setPasteLoading(true);
        const resolved = await resolveShortGoogleMapsUrl(pasted);
        if (resolved) {
          await updateLocation(resolved.lat, resolved.lng);
        } else {
          // Could not resolve - just put the URL in the input
          onChangeRef.current(pasted);
        }
        setPasteLoading(false);
        return;
      }

      // Not a map URL - let normal paste behavior happen
    },
    [updateLocation]
  );

  // ── Geolocation: "Mi ubicacion" ──
  const handleGetMyLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización.');
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        await updateLocation(latitude, longitude);
        setGeoLoading(false);
      },
      (err) => {
        console.error('Geolocation error:', err);
        alert('No se pudo obtener tu ubicación. Verifica los permisos del navegador.');
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [updateLocation]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ position: 'relative' }}>
      {/* Input row with geolocation button */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onPaste={handlePaste}
          required={required}
          className="mt-1 input-style"
          placeholder="Escribe una dirección o pega un link de Google Maps..."
          style={{ flex: 1 }}
        />
        <button
          type="button"
          onClick={handleGetMyLocation}
          disabled={geoLoading}
          title="Usar mi ubicación actual"
          style={{
            marginTop: '0.25rem',
            padding: '0 12px',
            backgroundColor: geoLoading ? '#94a3b8' : '#0ea5e9',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: geoLoading ? 'not-allowed' : 'pointer',
            fontSize: '13px',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => {
            if (!geoLoading) (e.currentTarget.style.backgroundColor = '#0284c7');
          }}
          onMouseLeave={(e) => {
            if (!geoLoading) (e.currentTarget.style.backgroundColor = '#0ea5e9');
          }}
        >
          {/* Location icon SVG */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7z" />
            <circle cx="12" cy="9" r="2.5" />
          </svg>
          {geoLoading ? 'Buscando...' : 'Mi ubicación'}
        </button>
      </div>

      {/* Paste loading indicator */}
      {pasteLoading && (
        <div
          style={{
            marginTop: '4px',
            fontSize: '12px',
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              width: '12px',
              height: '12px',
              border: '2px solid #cbd5e1',
              borderTopColor: '#0ea5e9',
              borderRadius: '50%',
              animation: 'addr-spin 0.6s linear infinite',
            }}
          />
          Procesando enlace de Google Maps...
          <style>{`@keyframes addr-spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Coordinates display */}
      {coords && (
        <div
          style={{
            marginTop: '4px',
            fontSize: '11px',
            color: '#94a3b8',
            fontFamily: 'monospace',
          }}
        >
          {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
        </div>
      )}

      {/* Leaflet map container - only rendered when coords exist */}
      {coords && (
        <div
          style={{
            marginTop: '8px',
            borderRadius: '0.5rem',
            overflow: 'hidden',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <div
            ref={mapContainerRef}
            style={{
              height: '200px',
              width: '100%',
              zIndex: 0,
            }}
          />
          <div
            style={{
              backgroundColor: '#f8fafc',
              padding: '6px 10px',
              fontSize: '11px',
              color: '#64748b',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {/* Pin icon */}
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7z" />
              <circle cx="12" cy="9" r="2.5" />
            </svg>
            Arrastra el pin para ajustar la ubicación
          </div>
        </div>
      )}
    </div>
  );
};
