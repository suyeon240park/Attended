// App.js
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Alert, StyleSheet, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as Location from 'expo-location';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// List of seminars
const seminars = [
  {
    id: '1',
    name: 'Seminar 1',
    startTime: new Date(Date.now() + 10 * 1000), // 10 seconds from now
    endTime: new Date(Date.now() + 0.5 * 60 * 1000), // 30 sec from now
    location: { latitude: 37.7749, longitude: -122.4194 }, // San Francisco
  },
  {
    id: '2',
    name: 'Seminar 2',
    startTime: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
    endTime: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
    location: { latitude: 34.0522, longitude: -118.2437 }, // Los Angeles
  },
];

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={MainScreen} options={{ title: 'Seminar App' }} />
        <Stack.Screen
          name="LocationCheck"
          component={LocationCheckPage}
          options={{ title: 'Location Check' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function MainScreen() {
  const [expoPushToken, setExpoPushToken] = useState('');
  const notificationListener = useRef();
  const responseListener = useRef();
  const navigation = useNavigation();

  useEffect(() => {
    // Request permissions and get Expo push token
    registerForPushNotificationsAsync().then((token) => setExpoPushToken(token));

    // Schedule notifications for seminars
    scheduleSeminarNotifications();

    // Listener for incoming notifications
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification Received:', notification);
    });

    // Listener for user interaction with the notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const { type, seminarId, seminarLocation } = response.notification.request.content.data;

      if (type === 'end') {
        // Navigate to LocationCheckPage and pass seminar data
        navigation.navigate('LocationCheck', { seminarId, seminarLocation });
      }
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, [navigation]);

  const scheduleSeminarNotifications = async () => {
    for (const seminar of seminars) {
      const startTrigger = new Date(seminar.startTime.getTime() - 1 * 60 * 1000);
      if (startTrigger > new Date()) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Seminar Starting Soon',
            body: `Your seminar "${seminar.name}" is starting at ${seminar.startTime.toLocaleTimeString()}.`,
            data: { seminarId: seminar.id, type: 'start' },
          },
          trigger: startTrigger,
        });
      }

      const endTrigger = seminar.endTime;
      if (endTrigger > new Date()) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Seminar Ended',
            body: `Your seminar "${seminar.name}" has ended. Tap to verify your location.`,
            data: {
              seminarId: seminar.id,
              type: 'end',
              seminarLocation: seminar.location,
            },
          },
          trigger: endTrigger,
        });
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Seminar Notifications App</Text>
      <Text style={styles.infoText}>Notifications have been scheduled for upcoming seminars.</Text>
    </View>
  );
}

function LocationCheckPage({ route }) {
  const { seminarId, seminarLocation } = route.params;
  const [locationStatus, setLocationStatus] = useState('Checking your location...');
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    const verifyUserLocation = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        setLocationStatus('Unable to verify location.');
        return;
      }

      let userLocation = await Location.getCurrentPositionAsync({});
      const distance = getDistance(
        seminarLocation.latitude,
        seminarLocation.longitude,
        userLocation.coords.latitude,
        userLocation.coords.longitude
      );

      if (distance <= 50) {
        setLocationStatus('You are still at the seminar location.');
      } else {
        setLocationStatus('You have left the seminar location.');
      }
    };

    verifyUserLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getDistance = (lat1, lon1, lat2, lon2) => {
    const toRadians = (degree) => (degree * Math.PI) / 180;
    const R = 6371000; // Earth's radius in meters
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Location Verification</Text>
      <Text style={styles.infoText}>{locationStatus}</Text>
      {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
    </View>
  );
}

// Function to request permissions and get Expo push token
async function registerForPushNotificationsAsync() {
  let token;
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      Alert.alert('Permission Required', 'Failed to get push token for notifications!');
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
  } else {
    Alert.alert('Notice', 'Must use physical device for Notifications');
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token;
}

// Styles
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  infoText: { fontSize: 16, textAlign: 'center' },
  errorText: { fontSize: 16, color: 'red', textAlign: 'center', marginTop: 10 },
});
