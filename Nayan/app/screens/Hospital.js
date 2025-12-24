import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Linking, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import Ionicons from '@expo/vector-icons/Ionicons';

const HospitalScreen = () => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userCoords, setUserCoords] = useState(null);

  // Indian emergency numbers
  const AMBULANCE_EMERGENCY = '108';
  const HOSPITAL_EMERGENCY = '102';

  useEffect(() => {
    const getLocationAndHospitals = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Location permission is required.', [
            { text: 'Call Ambulance (108)', onPress: () => handleCall(AMBULANCE_EMERGENCY) },
            { text: 'OK' }
          ]);
          setLoading(false);
          return;
        }

        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        const coords = currentLocation.coords;
        setUserCoords({ lat: coords.latitude, lng: coords.longitude });
        console.log('Current location:', coords);

        // Use tight bounding box for more accurate nearby results
        const radius = 0.03; // ~3km in degrees
        const url = `https://nominatim.openstreetmap.org/search?` +
          `format=json&` +
          `q=hospital&` +
          `viewbox=${coords.longitude - radius},${coords.latitude + radius},${coords.longitude + radius},${coords.latitude - radius}&` +
          `bounded=1&` +
          `limit=20&` +
          `addressdetails=1`;

        const response = await fetch(url, {
          headers: {
            'User-Agent': 'SakhiSahayakApp/1.0',
            'Accept': 'application/json',
          },
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();

        // Calculate distance and sort by nearest
        const hospitalList = data.map((result, index) => {
          const lat = parseFloat(result.lat);
          const lon = parseFloat(result.lon);
          const distance = getDistance(coords.latitude, coords.longitude, lat, lon);

          return {
            id: index,
            name: result.name || result.display_name?.split(',')[0] || 'Hospital',
            address: result.display_name || 'Address not available',
            latitude: lat,
            longitude: lon,
            phone: AMBULANCE_EMERGENCY,
            distance: distance,
          };
        });

        // Sort by distance
        hospitalList.sort((a, b) => a.distance - b.distance);
        setHospitals(hospitalList.slice(0, 15));

        if (hospitalList.length === 0) {
          Alert.alert('No Hospitals Found', 'Could not find hospitals nearby. Call ambulance?', [
            { text: 'Call 108', onPress: () => handleCall(AMBULANCE_EMERGENCY) },
            { text: 'Cancel' }
          ]);
        }
      } catch (error) {
        console.error('Error fetching hospitals:', error);
        Alert.alert('Error', 'Could not fetch hospitals. Call ambulance?', [
          { text: 'Call 108', onPress: () => handleCall(AMBULANCE_EMERGENCY) },
          { text: 'Cancel' }
        ]);
      } finally {
        setLoading(false);
      }
    };

    getLocationAndHospitals();
  }, []);

  // Haversine formula for distance
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const formatDistance = (km) => {
    if (km < 1) return `${Math.round(km * 1000)} m`;
    return `${km.toFixed(1)} km`;
  };

  const handleCall = (phone) => {
    const cleanNumber = String(phone).replace(/[^0-9+]/g, '');
    const phoneUrl = `tel:${cleanNumber}`;

    Linking.canOpenURL(phoneUrl)
      .then((supported) => {
        if (supported) Linking.openURL(phoneUrl);
        else Alert.alert('Error', 'Phone calls not supported.');
      })
      .catch((err) => console.error('Error making call:', err));
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E91E63" />
          <Text style={styles.loadingText}>Finding nearby hospitals...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.headerText}>Nearby Hospitals</Text>
        <TouchableOpacity style={styles.emergencyBanner} onPress={() => handleCall(AMBULANCE_EMERGENCY)}>
          <Text style={styles.emergencyText}>🚑 Emergency: Dial 108 (Ambulance)</Text>
        </TouchableOpacity>

        <FlatList
          data={hospitals}
          keyExtractor={(item) => `hospital-${item.id}`}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.hospitalCard}>
              <View style={styles.hospitalInfo}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.address} numberOfLines={2}>{item.address}</Text>
                <Text style={styles.distance}>📍 {formatDistance(item.distance)} away</Text>
              </View>
              <TouchableOpacity style={styles.callButton} onPress={() => handleCall(item.phone)}>
                <Ionicons name="call" size={24} color="#fff" />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No hospitals found nearby.</Text>
              <TouchableOpacity style={styles.emergencyButton} onPress={() => handleCall(AMBULANCE_EMERGENCY)}>
                <Text style={styles.emergencyButtonText}>📞 Call Ambulance (108)</Text>
              </TouchableOpacity>
            </View>
          }
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: '#666', marginTop: 10 },
  titleContainer: { flex: 1, paddingTop: 20 },
  headerText: { fontSize: 22, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  emergencyBanner: { backgroundColor: '#FCE4EC', padding: 12, borderRadius: 10, marginBottom: 15 },
  emergencyText: { color: '#C2185B', fontWeight: '600', textAlign: 'center', fontSize: 16 },
  hospitalCard: {
    padding: 15, backgroundColor: '#fff', borderRadius: 12, marginBottom: 10,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  hospitalInfo: { flex: 1, marginRight: 10 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  address: { fontSize: 13, color: '#666', marginTop: 4 },
  distance: { fontSize: 13, color: '#E91E63', marginTop: 4, fontWeight: '600' },
  callButton: { backgroundColor: '#E91E63', padding: 14, borderRadius: 30 },
  emptyContainer: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: '#666', fontSize: 16, marginBottom: 20 },
  emergencyButton: { backgroundColor: '#E91E63', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 25 },
  emergencyButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default HospitalScreen;