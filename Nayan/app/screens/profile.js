import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as Location from 'expo-location';

const ProfilePage = ({ navigation }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: 'Guest User',
    location: 'India',
    email: '',
    phone: '',
    about: 'This app is my trusted companion for safety. It alerts my loved ones in emergencies and helps me navigate safely.',
  });

  useEffect(() => {
    loadProfile();
    getCurrentLocation();
  }, []);

  const loadProfile = async () => {
    try {
      const savedProfile = await SecureStore.getItemAsync('userProfile');
      if (savedProfile) {
        setProfile(JSON.parse(savedProfile));
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const saveProfile = async () => {
    try {
      await SecureStore.setItemAsync('userProfile', JSON.stringify(profile));
      setIsEditing(false);
      Alert.alert('Success', 'Profile saved successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Could not save profile');
    }
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${location.coords.latitude}&lon=${location.coords.longitude}&format=json`,
          { headers: { 'User-Agent': 'SakhiSahayakApp/1.0' } }
        );
        const data = await response.json();
        const cityName = data.address?.city || data.address?.town || data.address?.village || 'India';
        setProfile(prev => ({ ...prev, location: `${cityName}, India` }));
      }
    } catch (error) {
      console.log('Could not get location:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <Image
          source={require('../assets/profilePic.png')}
          style={styles.profileImage}
        />
        {isEditing ? (
          <TextInput
            style={styles.nameInput}
            value={profile.name}
            onChangeText={(text) => setProfile({ ...profile, name: text })}
            placeholder="Your Name"
          />
        ) : (
          <Text style={styles.name}>{profile.name}</Text>
        )}
        <Text style={styles.location}>📍 {profile.location}</Text>
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        {isEditing ? (
          <TextInput
            style={styles.aboutInput}
            value={profile.about}
            onChangeText={(text) => setProfile({ ...profile, about: text })}
            placeholder="Tell us about yourself"
            multiline
          />
        ) : (
          <Text style={styles.aboutText}>{profile.about}</Text>
        )}
      </View>

      {/* Contact Info Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Info</Text>
        {isEditing ? (
          <>
            <TextInput
              style={styles.input}
              value={profile.email}
              onChangeText={(text) => setProfile({ ...profile, email: text })}
              placeholder="Email address"
              keyboardType="email-address"
            />
            <TextInput
              style={styles.input}
              value={profile.phone}
              onChangeText={(text) => setProfile({ ...profile, phone: text })}
              placeholder="Phone number"
              keyboardType="phone-pad"
            />
          </>
        ) : (
          <>
            <Text style={styles.contactText}>📧 {profile.email || 'Not set'}</Text>
            <Text style={styles.contactText}>📞 {profile.phone || 'Not set'}</Text>
          </>
        )}
      </View>

      {/* Edit/Save Button */}
      <View style={styles.buttonContainer}>
        {isEditing ? (
          <>
            <TouchableOpacity style={styles.saveButton} onPress={saveProfile}>
              <Text style={styles.buttonText}>Save Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => { setIsEditing(false); loadProfile(); }}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
            <Text style={styles.buttonText}>Edit Profile</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Emergency Contacts Link */}
      <TouchableOpacity style={styles.linkButton} onPress={() => navigation.navigate('Contacts')}>
        <Text style={styles.linkText}>👥 Manage Emergency Contacts</Text>
      </TouchableOpacity>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 50,
    padding: 20,
    backgroundColor: '#AB90CE',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  nameInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 10,
    borderRadius: 10,
    textAlign: 'center',
    width: '80%',
  },
  location: {
    fontSize: 16,
    color: '#fff',
    marginTop: 5,
  },
  section: {
    margin: 20,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#9150E4',
  },
  aboutText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  aboutInput: {
    fontSize: 15,
    color: '#333',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  contactText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  input: {
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 10,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  editButton: {
    backgroundColor: '#9150E4',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  cancelButton: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
  linkButton: {
    margin: 20,
    padding: 15,
    backgroundColor: '#f0e6ff',
    borderRadius: 10,
    alignItems: 'center',
  },
  linkText: {
    color: '#9150E4',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfilePage;
