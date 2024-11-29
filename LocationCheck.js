import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import { request, PERMISSIONS } from 'react-native-permissions';

const getDistanceFromLatLonInMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Radius of the Earth in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in meters
};

const checkLocation = async (targetLocation, setIsInTargetLocation) => {
  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Location permission denied');
        return;
      }
    } else if (Platform.OS === 'ios') {
      const granted = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
      if (granted !== 'granted') {
        console.log('Location permission denied');
        return;
      }
    }
    getLocation();
  };

  const getLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const distance = getDistanceFromLatLonInMeters(latitude, longitude, targetLocation.latitude, targetLocation.longitude);
        setIsInTargetLocation(distance <= targetLocation.radius);
      },
      (error) => {
        console.log(error.code, error.message);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  await requestLocationPermission();
};

export { checkLocation };
