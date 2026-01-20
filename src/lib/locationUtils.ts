// Phase 7: Location Verification

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export const getCurrentLocation = (): Promise<LocationCoordinates> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    // First try with high accuracy (GPS)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('GPS accuracy:', position.coords.accuracy, 'meters');
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        // If high accuracy fails, try with lower accuracy as fallback
        console.warn('High accuracy location failed, trying fallback:', error.message);
        navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log('Fallback GPS accuracy:', position.coords.accuracy, 'meters');
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          (fallbackError) => {
            reject(fallbackError);
          },
          {
            enableHighAccuracy: false,
            timeout: 15000,
            maximumAge: 30000,
          }
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  });
};

export const calculateDistance = (
  point1: LocationCoordinates,
  point2: LocationCoordinates
): number => {
  // Haversine formula to calculate distance between two GPS coordinates
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (point1.latitude * Math.PI) / 180;
  const φ2 = (point2.latitude * Math.PI) / 180;
  const Δφ = ((point2.latitude - point1.latitude) * Math.PI) / 180;
  const Δλ = ((point2.longitude - point1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

export const isWithinGeofence = (
  userLocation: LocationCoordinates,
  classroomLocation: LocationCoordinates,
  radiusMeters: number = 100
): boolean => {
  const distance = calculateDistance(userLocation, classroomLocation);
  return distance <= radiusMeters;
};

export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(2)}km`;
};
