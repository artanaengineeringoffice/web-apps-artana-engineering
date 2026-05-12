// composables/useLocation.js
import { ref } from "vue";

const OFFICE_LAT = -6.5135;
const OFFICE_LNG = 107.4566;
const RADIUS_METERS = 2000000;

export function useLocation() {
  const locationLoading = ref(false);
  const locationError = ref(null);
  const currentLocation = ref(null);
  const isWithinRadius = ref(null);

  const getDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = (deg) => deg * (Math.PI / 180);
    const R = 6371e3;
    const φ1 = toRad(lat1);
    const φ2 = toRad(lat2);
    const Δφ = toRad(lat2 - lat1);
    const Δλ = toRad(lon2 - lon1);

    const a = Math.sin(Δφ/2)**2 +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ/2)**2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const checkLocation = async () => {
    locationLoading.value = true;
    locationError.value = null;

    try {
      const pos = await new Promise((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, {
          enableHighAccuracy: true,
          timeout: 10000
        })
      );

      currentLocation.value = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      };

      const distance = getDistance(
        OFFICE_LAT,
        OFFICE_LNG,
        currentLocation.value.lat,
        currentLocation.value.lng
      );

      isWithinRadius.value = distance <= RADIUS_METERS;

      return {
        valid: isWithinRadius.value,
        distance
      };

    } catch (err) {
      locationError.value = err.message;
      isWithinRadius.value = false;
      throw err;
    } finally {
      locationLoading.value = false;
    }
  };

  return {
    locationLoading,
    locationError,
    currentLocation,
    isWithinRadius,
    checkLocation,
    RADIUS_METERS
  };
}