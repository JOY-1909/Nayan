import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, SafeAreaView, StyleSheet, Text, TouchableOpacity, View, Image, Vibration, Alert, ScrollView, Linking } from 'react-native';
import { ExpoLeaflet } from 'expo-leaflet';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';

const mapLayers = [
  {
    attribution: '&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
    baseLayerIsChecked: true,
    baseLayerName: 'OpenStreetMap',
    layerType: 'TileLayer',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  },
];

const mapOptions = {
  attributionControl: false,
  zoomControl: false,
};

const MapScreen = ({ navigation }) => {
  const [zoom, setZoom] = useState(15);
  const [mapCenterPosition, setMapCenterPosition] = useState({ lat: 19.0760, lng: 72.8777 });
  const [ownPosition, setOwnPosition] = useState(null);
  const [userHeading, setUserHeading] = useState(0);
  const [showOptionButtons, setShowOptionButtons] = useState(false);
  const [markers, setMarkers] = useState([]);
  const [nearbyVisible, setNearbyVisible] = useState(false);
  const [hotspotVisible, setHotspotVisible] = useState(false);
  const [mapShapes, setMapShapes] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userCoords, setUserCoords] = useState(null);
  const [places, setPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [listModalVisible, setListModalVisible] = useState(false);

  const hotspots = [
    { center: { lat: 19.0295559 + 0.04, lng: 72.8506955 + 0.04 }, radius: 500 },
    { center: { lat: 19.0295559, lng: 72.8506955 }, radius: 700 },
    { center: { lat: 19.085559, lng: 72.8606955 }, radius: 500 },
    { center: { lat: 19.0495559, lng: 72.8906955 }, radius: 500 },
  ];

  // Indian emergency numbers
  const emergencyNumbers = {
    police: '100',
    hospital: '102',
    ambulance: '108',
    medical: '108',
    fire: '101',
    women_helpline: '1091',
    general: '112',
  };

  useEffect(() => {
    const requestNotificationPermissions = async () => {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        await Notifications.requestPermissionsAsync();
      }
    };
    requestNotificationPermissions();
  }, []);

  useEffect(() => {
    if (hotspotVisible) {
      setMapShapes(hotspots.map((hotspot, index) => ({
        shapeType: 'circle',
        color: '#EB3223',
        id: `hotspot-${index + 1}`,
        center: hotspot.center,
        radius: hotspot.radius,
      })));
    } else {
      setMapShapes([]);
    }
  }, [hotspotVisible]);

  useEffect(() => {
    const getLocationAsync = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });
      if (location.coords) {
        const { latitude, longitude } = location.coords;
        setUserCoords({ lat: latitude, lng: longitude });
        setOwnPosition([{
          id: 'user-location',
          position: { lat: latitude, lng: longitude },
          icon: '📍',
          size: [32, 32],
        }]);
        setMapCenterPosition({ lat: latitude, lng: longitude });
        checkIfInHotspot(latitude, longitude);
      }
    };

    getLocationAsync().catch(console.error);

    Location.watchHeadingAsync((heading) => {
      setUserHeading(heading.trueHeading);
    });
  }, []);

  const checkIfInHotspot = (latitude, longitude) => {
    hotspots.forEach((hotspot) => {
      const distance = getDistance({ lat: latitude, lng: longitude }, hotspot.center);
      if (distance <= hotspot.radius) {
        sendNotification();
        Vibration.vibrate(3000);
        setModalVisible(true);
      }
    });
  };

  const getDistance = (point1, point2) => {
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(point2.lat - point1.lat);
    const dLon = toRad(point2.lng - point1.lng);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(point1.lat)) * Math.cos(toRad(point2.lat)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c * 1000;
  };

  const formatDistance = (meters) => {
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
  };

  const sendNotification = async () => {
    await Notifications.scheduleNotificationAsync({
      content: { title: "Hotspot Alert", body: "You are entering a hotspot location!" },
      trigger: null,
    });
  };

  const handleModalResponse = (response) => {
    setModalVisible(false);
    if (response === 'yes') navigation.navigate('SafeMode');
  };

  const toggleOptions = () => setShowOptionButtons(!showOptionButtons);

  // Fetch nearby places using Nominatim with better accuracy
  const fetchNearbyPlaces = async (category) => {
    if (!userCoords) {
      Alert.alert('Location Error', 'Unable to get your location. Please try again.');
      return;
    }

    setLoading(true);
    setActiveCategory(category);

    try {
      // Use Nominatim with a tight bounding box for accuracy
      const radius = 0.02; // ~2km in degrees
      const searchTerm = category === 'medical' ? 'pharmacy' : category;

      const url = `https://nominatim.openstreetmap.org/search?` +
        `format=json&` +
        `q=${encodeURIComponent(searchTerm)}&` +
        `viewbox=${userCoords.lng - radius},${userCoords.lat + radius},${userCoords.lng + radius},${userCoords.lat - radius}&` +
        `bounded=1&` +
        `limit=20&` +
        `addressdetails=1`;

      const response = await fetch(url, {
        headers: { 'User-Agent': 'SakhiSahayakApp/1.0', 'Accept': 'application/json' },
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();

      // Get icon based on category
      const icons = { police: '🚔', hospital: '🏥', medical: '💊' };
      const icon = icons[category] || '�';

      // Process results with distance calculation
      const placesList = data.map((place, index) => {
        const lat = parseFloat(place.lat);
        const lon = parseFloat(place.lon);
        const distance = getDistance(userCoords, { lat, lng: lon });

        return {
          id: `${category}-${index}`,
          name: place.name || place.display_name?.split(',')[0] || `${category} ${index + 1}`,
          address: place.display_name || 'Address not available',
          phone: emergencyNumbers[category] || emergencyNumbers.general,
          lat, lng: lon, distance, icon,
        };
      });

      // Sort by distance and take closest 15
      placesList.sort((a, b) => a.distance - b.distance);
      const closestPlaces = placesList.slice(0, 15);

      setPlaces(closestPlaces);
      setMarkers(closestPlaces.map((place) => ({
        id: place.id,
        position: { lat: place.lat, lng: place.lng },
        icon: place.icon,
        size: [28, 28],
      })));

      if (closestPlaces.length === 0) {
        Alert.alert('No Results', `No ${category} found nearby. Showing emergency number.`, [
          { text: 'Call Emergency', onPress: () => handleCall(emergencyNumbers[category]) },
          { text: 'OK' }
        ]);
      } else {
        setListModalVisible(true);
      }
    } catch (error) {
      console.error(`Error fetching ${category}:`, error);
      Alert.alert('Connection Error', `Could not fetch ${category}. Do you want to call emergency services?`, [
        { text: 'Call ' + emergencyNumbers[category], onPress: () => handleCall(emergencyNumbers[category]) },
        { text: 'Cancel' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCall = (phoneNumber) => {
    const cleanNumber = String(phoneNumber).replace(/[^0-9+]/g, '');
    const phoneUrl = `tel:${cleanNumber}`;

    Linking.canOpenURL(phoneUrl)
      .then((supported) => {
        if (supported) Linking.openURL(phoneUrl);
        else Alert.alert('Error', 'Phone calls are not supported on this device.');
      })
      .catch((err) => console.error('Error making call:', err));
  };

  const handlePlaceSelect = (place) => {
    setSelectedPlace(place);
    setDetailModalVisible(true);
    setMapCenterPosition({ lat: place.lat, lng: place.lng });
    setZoom(17);
  };

  const handleCategoryPress = (category) => {
    if (activeCategory === category) {
      setActiveCategory(null);
      setMarkers([]);
      setPlaces([]);
    } else {
      fetchNearbyPlaces(category);
    }
  };

  const handleNearbyClick = () => {
    setNearbyVisible(!nearbyVisible);
    if (!nearbyVisible && userCoords) fetchNearbyPlaces('police');
    else {
      setMarkers([]);
      setPlaces([]);
      setActiveCategory(null);
    }
  };

  const handleHotspotClick = () => setHotspotVisible(!hotspotVisible);

  const mapMarkers = ownPosition ? [...ownPosition, ...markers] : markers;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mapheader}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Dash')}>
          <Image source={require('../../assets/backbutton.png')} style={styles.settingsIcon} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingsButton} onPress={toggleOptions}>
          <Image source={require('../../assets/settings.png')} style={styles.settingsIcon} />
        </TouchableOpacity>

        {showOptionButtons && (
          <View style={styles.optionButtons}>
            <TouchableOpacity style={[styles.optionButton, nearbyVisible && styles.activeButton]} onPress={handleNearbyClick}>
              <Text style={[styles.optionButtonText, nearbyVisible && styles.activeButtonText]}>Nearby Safe Places</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.optionButton, hotspotVisible && styles.activeButton]} onPress={handleHotspotClick}>
              <Text style={[styles.optionButtonText, hotspotVisible && styles.activeButtonText]}>Hotspot Areas</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#9150E4" />
          <Text style={styles.loadingText}>Finding nearby places...</Text>
        </View>
      )}

      <View style={{ flex: 1 }}>
        <ExpoLeaflet
          loadingIndicator={() => <ActivityIndicator />}
          mapCenterPosition={mapCenterPosition}
          mapLayers={mapLayers}
          mapMarkers={mapMarkers}
          mapShapes={mapShapes}
          mapOptions={mapOptions}
          zoom={zoom}
          onMessage={(message) => {
            if (message.event === 'onMapMarkerClicked') {
              const place = places.find(p => p.id === message.payload.mapMarkerID);
              if (place) handlePlaceSelect(place);
            }
          }}
        />
      </View>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={[styles.bottomButton, activeCategory === 'police' && styles.activeBottomButton]} onPress={() => handleCategoryPress('police')}>
          <Text style={styles.bottomButtonIcon}>🚔</Text>
          <Text style={[styles.bottomButtonText, activeCategory === 'police' && styles.activeBottomText]}>Police</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.bottomButton, activeCategory === 'hospital' && styles.activeBottomButton]} onPress={() => handleCategoryPress('hospital')}>
          <Text style={styles.bottomButtonIcon}>🏥</Text>
          <Text style={[styles.bottomButtonText, activeCategory === 'hospital' && styles.activeBottomText]}>Hospitals</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.bottomButton, activeCategory === 'medical' && styles.activeBottomButton]} onPress={() => handleCategoryPress('medical')}>
          <Text style={styles.bottomButtonIcon}>💊</Text>
          <Text style={[styles.bottomButtonText, activeCategory === 'medical' && styles.activeBottomText]}>Medical</Text>
        </TouchableOpacity>
      </View>

      {/* View List Button */}
      {places.length > 0 && (
        <TouchableOpacity style={styles.viewListButton} onPress={() => setListModalVisible(true)}>
          <Text style={styles.viewListButtonText}>📋 View List ({places.length})</Text>
        </TouchableOpacity>
      )}

      {/* Places List Modal */}
      <Modal animationType="slide" transparent={true} visible={listModalVisible} onRequestClose={() => setListModalVisible(false)}>
        <View style={styles.listModalContainer}>
          <View style={styles.listModalContent}>
            <View style={styles.listModalHeader}>
              <Text style={styles.listModalTitle}>
                {activeCategory ? `Nearby ${activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)}` : 'Nearby Places'}
              </Text>
              <TouchableOpacity onPress={() => setListModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.emergencyNote}>Emergency: {emergencyNumbers[activeCategory] || '112'}</Text>
            <ScrollView style={styles.placesList}>
              {places.map((place) => (
                <TouchableOpacity key={place.id} style={styles.placeItem} onPress={() => { setListModalVisible(false); handlePlaceSelect(place); }}>
                  <View style={styles.placeInfo}>
                    <Text style={styles.placeName}>{place.name}</Text>
                    <Text style={styles.placeAddress} numberOfLines={2}>{place.address}</Text>
                    <Text style={styles.placeDistance}>{formatDistance(place.distance)} away</Text>
                  </View>
                  <TouchableOpacity style={styles.callButtonSmall} onPress={() => handleCall(place.phone)}>
                    <Text style={styles.callButtonText}>📞</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Place Detail Modal */}
      <Modal animationType="slide" transparent={true} visible={detailModalVisible} onRequestClose={() => setDetailModalVisible(false)}>
        <View style={styles.detailModalContainer}>
          <View style={styles.detailModalContent}>
            {selectedPlace && (
              <>
                <Text style={styles.detailModalTitle}>{selectedPlace.name}</Text>
                <Text style={styles.detailModalAddress}>{selectedPlace.address}</Text>
                <Text style={styles.detailModalDistance}>📍 {formatDistance(selectedPlace.distance)} from you</Text>
                <Text style={styles.detailModalPhone}>📞 Emergency: {emergencyNumbers[activeCategory] || '112'}</Text>

                <View style={styles.detailModalButtons}>
                  <TouchableOpacity style={styles.callButtonLarge} onPress={() => handleCall(emergencyNumbers[activeCategory])}>
                    <Text style={styles.callButtonLargeText}>📞 Call Emergency ({emergencyNumbers[activeCategory]})</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.closeModalButton} onPress={() => setDetailModalVisible(false)}>
                    <Text style={styles.closeModalButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Safe Mode Modal */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Safe Mode?</Text>
            <Text style={styles.modalMessage}>You are entering a hotspot location!</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButton} onPress={() => handleModalResponse('yes')}>
                <Text style={styles.modalButtonText}>Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButton} onPress={() => handleModalResponse('no')}>
                <Text style={styles.modalButtonText}>Ignore</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50 },
  mapheader: { position: 'absolute', top: 50, width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, zIndex: 10 },
  backButton: { borderRadius: 25, padding: 5, elevation: 1 },
  settingsButton: { padding: 10, borderRadius: 25, elevation: 10 },
  settingsIcon: { width: 40, height: 40 },
  optionButtons: { position: 'absolute', top: 50, right: 60, backgroundColor: '#fff', padding: 10, borderRadius: 10, zIndex: 20 },
  optionButton: { padding: 10, marginBottom: 10, borderRadius: 5, borderWidth: 1, borderColor: '#9150E4' },
  activeButton: { backgroundColor: '#9150E4' },
  activeButtonText: { color: '#fff' },
  optionButtonText: { color: '#9150E4', fontSize: 14, fontWeight: '600' },
  loadingOverlay: { position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -75 }, { translateY: -30 }], backgroundColor: 'rgba(255,255,255,0.95)', padding: 20, borderRadius: 10, zIndex: 100, alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#9150E4', fontWeight: '600' },
  bottomBar: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: 'white', padding: 15, position: 'absolute', bottom: 0, width: '100%', borderTopWidth: 1, borderColor: '#ddd', borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  bottomButton: { flex: 1, alignItems: 'center', paddingVertical: 8, marginHorizontal: 5, borderRadius: 15 },
  activeBottomButton: { backgroundColor: '#9150E4' },
  bottomButtonIcon: { fontSize: 24, marginBottom: 4 },
  bottomButtonText: { fontSize: 12, color: '#9150E4', fontWeight: '600' },
  activeBottomText: { color: '#fff' },
  viewListButton: { position: 'absolute', bottom: 100, alignSelf: 'center', backgroundColor: '#9150E4', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25, elevation: 5 },
  viewListButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  listModalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  listModalContent: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '70%', paddingBottom: 20 },
  listModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  listModalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  closeButton: { fontSize: 24, color: '#666', padding: 5 },
  emergencyNote: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#FFF3E0', color: '#E65100', fontWeight: '600' },
  placesList: { paddingHorizontal: 15 },
  placeItem: { flexDirection: 'row', backgroundColor: '#f9f9f9', borderRadius: 10, padding: 15, marginVertical: 5, alignItems: 'center' },
  placeInfo: { flex: 1 },
  placeName: { fontSize: 16, fontWeight: '600', color: '#333' },
  placeAddress: { fontSize: 13, color: '#666', marginTop: 4 },
  placeDistance: { fontSize: 12, color: '#9150E4', fontWeight: '600', marginTop: 4 },
  callButtonSmall: { backgroundColor: '#4CAF50', padding: 12, borderRadius: 25, marginLeft: 10 },
  callButtonText: { fontSize: 18 },
  detailModalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  detailModalContent: { width: '85%', backgroundColor: 'white', borderRadius: 15, padding: 25, alignItems: 'center' },
  detailModalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 10 },
  detailModalAddress: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 10 },
  detailModalDistance: { fontSize: 14, color: '#9150E4', fontWeight: '600', marginBottom: 10 },
  detailModalPhone: { fontSize: 16, color: '#333', marginBottom: 20 },
  detailModalButtons: { width: '100%' },
  callButtonLarge: { backgroundColor: '#4CAF50', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
  callButtonLargeText: { color: 'white', fontSize: 16, fontWeight: '600' },
  closeModalButton: { backgroundColor: '#ddd', padding: 12, borderRadius: 10, alignItems: 'center' },
  closeModalButtonText: { color: '#333', fontSize: 14, fontWeight: '600' },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  modalContent: { width: '80%', padding: 20, backgroundColor: 'white', borderRadius: 10, alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  modalMessage: { fontSize: 16, marginBottom: 20, textAlign: 'center' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  modalButton: { flex: 1, padding: 10, marginHorizontal: 5, borderRadius: 5, backgroundColor: '#9150E4', alignItems: 'center' },
  modalButtonText: { color: 'white', fontWeight: '600' },
});

export default MapScreen;
