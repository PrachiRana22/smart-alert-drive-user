import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { MapPin, Navigation, ArrowLeft, Home, Map as MapIcon, Bell, Search } from 'lucide-react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import polyline from '@mapbox/polyline';
import * as Location from 'expo-location';

// Remove Google Maps API key reference
// const GOOGLE_MAPS_APIKEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "";

export default function TripSetupScreen({ navigation }) {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [startCoords, setStartCoords] = useState(null);
  const [endCoords, setEndCoords] = useState(null);
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const mapRef = useRef(null);

  const fetchRoute = async () => {
    if (start === "" || end === "") {
      Alert.alert("Error", "Please enter start and destination locations.");
      return;
    }

    setLoading(true);
    setStartCoords(null);
    setEndCoords(null);
    setDistance(0);
    setDuration(0);
    setRouteCoordinates([]);

    try {
      // 1. Request location permissions just in case
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission Denied", "Location permission is required to search addresses.");
        setLoading(false);
        return;
      }

      // 2. Geocode start location
      const startResult = await Location.geocodeAsync(start);
      if (startResult.length === 0) {
        Alert.alert("Not Found", "Could not find coordinates for the start location.");
        setLoading(false);
        return;
      }

      // 3. Geocode end location
      const endResult = await Location.geocodeAsync(end);
      if (endResult.length === 0) {
        Alert.alert("Not Found", "Could not find coordinates for the destination.");
        setLoading(false);
        return;
      }

      setStartCoords({
        latitude: startResult[0].latitude,
        longitude: startResult[0].longitude,
      });

      setEndCoords({
        latitude: endResult[0].latitude,
        longitude: endResult[0].longitude,
      });

      // 4. Fetch Route from OSRM
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startResult[0].longitude},${startResult[0].latitude};${endResult[0].longitude},${endResult[0].latitude}?overview=full&geometries=polyline`;
      
      const response = await fetch(osrmUrl);
      const data = await response.json();

      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        
        // OSRM returns distance in meters, duration in seconds
        setDistance(route.distance / 1000); // convert to km
        setDuration(route.duration / 60); // convert to minutes

        // Decode the polyline using @mapbox/polyline
        const points = polyline.decode(route.geometry);
        const coords = points.map(point => ({
          latitude: point[0],
          longitude: point[1]
        }));
        
        setRouteCoordinates(coords);

        // Fit map to coordinates
        if (mapRef.current) {
          // adding a small delay to ensure map is ready to fit coordinates
          setTimeout(() => {
            mapRef.current.fitToCoordinates([
                { latitude: startResult[0].latitude, longitude: startResult[0].longitude },
                { latitude: endResult[0].latitude, longitude: endResult[0].longitude },
                ...coords
            ], {
              edgePadding: { right: 50, bottom: 50, left: 50, top: 50 },
              animated: true,
            });
          }, 500);
        }
      } else {
        Alert.alert("Route Error", "Could not find a driving route between these locations.");
      }

    } catch (error) {
      console.error(error);
      Alert.alert("Error", "An error occurred while finding the route.");
    } finally {
      setLoading(false);
    }
  };

  const startTrip = () => {
    if (start === "" || end === "") {
      Alert.alert("Error", "Please enter start and destination");
      return;
    }

    navigation.navigate('DriverMonitor', {
      start: start,
      end: end,
      routeCoords: routeCoordinates,
      destinationCoords: endCoords
    });
  };

  return (
    <View className="flex-1 bg-gray-100 pt-16">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

        {/* Back Button & Title Row */}
        <View className="flex-row items-center mb-6">
          <TouchableOpacity onPress={() => navigation.navigate('Home')} className="mr-4">
            <ArrowLeft size={28} color="#2563eb" />
          </TouchableOpacity>
          <Text className="text-3xl font-bold text-blue-600">Smart Drive Alert</Text>
        </View>

        {/* Start Location */}
        <View className="bg-white p-4 rounded-2xl mb-4 flex-row items-center shadow-sm">
          <MapPin size={20} color="#2563eb" />
          <TextInput
            placeholder="Start Location (e.g., Paldi)"
            value={start}
            onChangeText={setStart}
            className="ml-3 flex-1 text-base text-gray-800"
            placeholderTextColor="#9ca3af"
          />
        </View>

        {/* End Location */}
        <View className="bg-white p-4 rounded-2xl mb-6 flex-row items-center shadow-sm">
          <Navigation size={20} color="#2563eb" />
          <TextInput
            placeholder="Destination (e.g., Vadodara)"
            value={end}
            onChangeText={setEnd}
            className="ml-3 flex-1 text-base text-gray-800"
            placeholderTextColor="#9ca3af"
          />
        </View>

        {/* Find Route Button */}
        <TouchableOpacity
          onPress={fetchRoute}
          disabled={loading}
          className={`py-3 rounded-xl mb-6 flex-row justify-center items-center shadow-sm ${loading ? 'bg-blue-400' : 'bg-blue-100'}`}
        >
          {loading ? (
            <ActivityIndicator color="#2563eb" />
          ) : (
            <>
              <Search size={18} color="#2563eb" />
              <Text className="text-blue-600 font-bold ml-2 text-base">Preview Route</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Map View */}
        {(startCoords && endCoords) && (
          <View className="bg-white p-2 rounded-3xl mb-6 shadow-md border border-gray-100 overflow-hidden">
            <View style={{ height: 250, borderRadius: 20, overflow: 'hidden' }}>
              <MapView
                ref={mapRef}
                style={{ flex: 1 }}
                initialRegion={{
                  latitude: startCoords.latitude,
                  longitude: startCoords.longitude,
                  latitudeDelta: 0.1,
                  longitudeDelta: 0.1,
                }}
              >
                <Marker coordinate={startCoords} title="Start" pinColor="green" />
                <Marker coordinate={endCoords} title="Destination" pinColor="red" />

                {routeCoordinates.length > 0 && (
                  <Polyline
                    coordinates={routeCoordinates}
                    strokeWidth={4}
                    strokeColor="#2563eb"
                  />
                )}
              </MapView>
            </View>

            {/* Route Stats */}
            {distance > 0 && duration > 0 && (
              <View className="flex-row justify-between items-center px-4 py-3 bg-blue-50 mt-2 rounded-xl">
                <View>
                  <Text className="text-gray-500 text-xs font-semibold uppercase">Distance</Text>
                  <Text className="text-blue-700 font-bold text-lg">{distance.toFixed(1)} km</Text>
                </View>
                <View className="items-end">
                  <Text className="text-gray-500 text-xs font-semibold uppercase">Est. Time</Text>
                  <Text className="text-blue-700 font-bold text-lg">{Math.ceil(duration)} min</Text>
                </View>
              </View>
            )}

            {/* Route Stats */}
          </View>
        )}

        {/* GO BUTTON */}
        <TouchableOpacity
          onPress={startTrip}
          className="bg-blue-600 py-4 rounded-2xl items-center shadow-lg shadow-blue-300 mt-2"
        >
          <Text className="text-white text-xl font-bold tracking-wide">
            START TRIP
          </Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Bottom Navigation */}
      <View className="absolute bottom-0 left-0 right-0 bg-white flex-row justify-around py-4 border-t border-gray-200 shadow-xl">
        <TouchableOpacity onPress={() => navigation.navigate('Home')} className="items-center">
          <Home size={24} color="#9ca3af" />
          <Text className="text-xs text-gray-500 mt-1">Home</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Trips')} className="items-center">
          <MapIcon size={24} color="#2563eb" />
          <Text className="text-xs text-blue-600 mt-1 font-semibold">Trips</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Alerts')} className="items-center">
          <Bell size={24} color="#9ca3af" />
          <Text className="text-xs text-gray-500 mt-1">Alerts</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
