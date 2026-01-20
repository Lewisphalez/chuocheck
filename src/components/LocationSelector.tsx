import { useState, useEffect } from 'react';
import { MapPin, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getCurrentLocation } from '@/lib/locationUtils';
import { useToast } from '@/hooks/use-toast';

interface LocationSelectorProps {
  onLocationSelect: (latitude: number, longitude: number) => void;
  initialLatitude?: number;
  initialLongitude?: number;
}

export default function LocationSelector({ onLocationSelect, initialLatitude, initialLongitude }: LocationSelectorProps) {
  const [latitude, setLatitude] = useState(initialLatitude?.toString() || '');
  const [longitude, setLongitude] = useState(initialLongitude?.toString() || '');
  const [loading, setLoading] = useState(false);
  const [locationSet, setLocationSet] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Sync initial values
  useEffect(() => {
    if (initialLatitude !== undefined && initialLongitude !== undefined) {
      setLatitude(initialLatitude.toString());
      setLongitude(initialLongitude.toString());
      setLocationSet(true);
    }
  }, [initialLatitude, initialLongitude]);

  const handleGetCurrentLocation = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const location = await getCurrentLocation();
      const lat = location.latitude;
      const lng = location.longitude;
      
      setLatitude(lat.toString());
      setLongitude(lng.toString());
      setLocationSet(true);
      onLocationSelect(lat, lng);
      
      toast({
        title: "Location Set",
        description: `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      });
    } catch (err: any) {
      let errorMessage = 'Failed to get location';
      
      if (err.code === 1) {
        errorMessage = 'Location permission denied. Please enable location access in your browser settings.';
      } else if (err.code === 2) {
        errorMessage = 'Location unavailable. Please check your device settings.';
      } else if (err.code === 3) {
        errorMessage = 'Location request timed out. Please try again.';
      }
      
      setError(errorMessage);
      toast({
        title: "Location Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLatitudeChange = (value: string) => {
    setLatitude(value);
    const lat = parseFloat(value);
    const lng = parseFloat(longitude);
    
    if (!isNaN(lat) && !isNaN(lng)) {
      setLocationSet(true);
      onLocationSelect(lat, lng);
    } else {
      setLocationSet(false);
    }
  };

  const handleLongitudeChange = (value: string) => {
    setLongitude(value);
    const lat = parseFloat(latitude);
    const lng = parseFloat(value);
    
    if (!isNaN(lat) && !isNaN(lng)) {
      setLocationSet(true);
      onLocationSelect(lat, lng);
    } else {
      setLocationSet(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Classroom Location
          {locationSet && <CheckCircle className="h-4 w-4 text-green-600" />}
        </CardTitle>
        <CardDescription>Set the location for attendance verification</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="latitude">Latitude</Label>
            <Input
              id="latitude"
              type="number"
              step="0.000001"
              value={latitude}
              onChange={(e) => handleLatitudeChange(e.target.value)}
              placeholder="0.000000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="longitude">Longitude</Label>
            <Input
              id="longitude"
              type="number"
              step="0.000001"
              value={longitude}
              onChange={(e) => handleLongitudeChange(e.target.value)}
              placeholder="0.000000"
            />
          </div>
        </div>
        
        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
        
        <Button onClick={handleGetCurrentLocation} disabled={loading} className="w-full">
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <MapPin className="h-4 w-4 mr-2" />
          )}
          {loading ? 'Getting Location...' : 'Use Current Location'}
        </Button>
        
        {locationSet && (
          <p className="text-xs text-muted-foreground text-center">
            Location coordinates set successfully
          </p>
        )}
      </CardContent>
    </Card>
  );
}
