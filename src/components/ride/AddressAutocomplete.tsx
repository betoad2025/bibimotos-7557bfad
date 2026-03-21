import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Loader2, X } from 'lucide-react';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
import { cn } from '@/lib/utils';

interface CityBias {
  lat: number;
  lng: number;
  name: string;
  state: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (location: { lat: number; lng: number; address: string }) => void;
  placeholder?: string;
  icon?: 'origin' | 'destination';
  showCurrentLocation?: boolean;
  className?: string;
  disabled?: boolean;
  cityBias?: CityBias | null;
}

interface Suggestion {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Digite o endereço',
  icon = 'origin',
  showCurrentLocation = false,
  className,
  disabled = false,
  cityBias,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sessionTokenRef = useRef<string>(crypto.randomUUID());
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  
  const { autocomplete, geocode, getCurrentLocation, reverseGeocode, loading } = useGoogleMaps();

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch autocomplete suggestions with city bias
  const fetchSuggestions = useCallback(async (input: string) => {
    if (input.length < 3) {
      setSuggestions([]);
      return;
    }

    const results = await autocomplete(
      input, 
      sessionTokenRef.current,
      cityBias ? { lat: cityBias.lat, lng: cityBias.lng, radius: 30000 } : undefined
    );
    setSuggestions(results);
    setShowSuggestions(results.length > 0);
  }, [autocomplete, cityBias]);

  // Handle input change with debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchSuggestions(newValue);
    }, 300);
  };

  // Handle suggestion selection
  const handleSelectSuggestion = async (suggestion: Suggestion) => {
    onChange(suggestion.description);
    setShowSuggestions(false);
    setSuggestions([]);
    
    const location = await geocode(suggestion.description);
    if (location) {
      onSelect(location);
    }
    
    sessionTokenRef.current = crypto.randomUUID();
  };

  // Handle current location
  const handleCurrentLocation = async () => {
    setGettingLocation(true);
    try {
      const coords = await getCurrentLocation();
      if (coords) {
        const address = await reverseGeocode(coords.lat, coords.lng);
        if (address) {
          onChange(address);
          onSelect({ ...coords, address });
        }
      }
    } finally {
      setGettingLocation(false);
    }
  };

  // Clear input
  const handleClear = () => {
    onChange('');
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const IconComponent = icon === 'origin' ? MapPin : Navigation;
  const iconColor = icon === 'origin' ? 'text-green-500' : 'text-red-500';

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative flex items-center">
        <IconComponent className={cn('absolute left-3 h-4 w-4', iconColor)} />
        <Input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          className="pl-10 pr-20"
          disabled={disabled}
        />
        <div className="absolute right-2 flex items-center gap-1">
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleClear}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          {showCurrentLocation && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleCurrentLocation}
              disabled={gettingLocation}
            >
              {gettingLocation ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Navigation className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-md border bg-popover shadow-lg">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.placeId}
              type="button"
              className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-accent transition-colors"
              onClick={() => handleSelectSuggestion(suggestion)}
            >
              <span className="font-medium text-sm">{suggestion.mainText}</span>
              <span className="text-xs text-muted-foreground">{suggestion.secondaryText}</span>
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-md border bg-popover p-3 shadow-lg">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Buscando endereços...
          </div>
        </div>
      )}
    </div>
  );
}
